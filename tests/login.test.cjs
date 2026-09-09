const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../shared/auth/login.js'), 'utf8');

async function setup({ sitekey = 'public-key', session = null, signIn, sessionError = false } = {}) {
  const elements = new Map();
  function el(id) {
    if (!elements.has(id)) elements.set(id, { value: '', clientWidth: 280, handlers: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(name, fn) { this.handlers[name] = fn; },
    });
    return elements.get(id);
  }
  const calls = [];
  const scripts = [];
  let callbacks;
  let resets = 0;
  let redirect;
  const window = {
    HCAPTCHA_SITEKEY: sitekey,
    createSupabaseClient: () => ({ auth: {
      getSession: async () => { if (sessionError) throw Error(); return { data: { session } }; },
      signInWithPassword: async data => { calls.push(data); return signIn ? signIn() : { error: null }; },
    } }),
    location: { replace: path => { redirect = path; } },
    hcaptcha: { render: (_, opts) => { callbacks = opts; return 0; }, reset: () => { resets++; } },
  };
  vm.runInNewContext(source, { window, document: {
    getElementById: el, querySelector: el, documentElement: { dataset: { theme: 'dark' } },
    createElement: () => ({}), head: { appendChild: script => scripts.push(script) },
  }, setTimeout: () => 1, clearTimeout() {} });
  await new Promise(resolve => setImmediate(resolve));
  el('email').value = ' admin@example.com ';
  el('password').value = ' password with spaces ';
  return { el, calls, scripts, window,
    load() { window.onLoginCaptchaLoad(); return callbacks; },
    submit: () => el('login-form').handlers.submit({ preventDefault() {} }),
    resets: () => resets, redirect: () => redirect,
  };
}

test('missing configuration or token blocks authentication', async () => {
  const missing = await setup({ sitekey: '' });
  await missing.submit();
  assert.equal(missing.calls.length, 0);
  assert.equal(missing.scripts.length, 0);
  assert.equal(missing.el('btn-login').disabled, true);
  const app = await setup();
  app.load();
  await app.submit();
  assert.equal(app.calls.length, 0);
});

test('passes CAPTCHA token and unchanged password to Supabase, then redirects', async () => {
  const app = await setup();
  const captcha = app.load();
  assert.equal(captcha.size, 'compact');
  captcha.callback('solved-token');
  await app.submit();
  assert.equal(app.calls[0].options.captchaToken, 'solved-token');
  assert.equal(app.calls[0].email, 'admin@example.com');
  assert.equal(app.calls[0].password, ' password with spaces ');
  assert.equal(app.redirect(), 'pages/index.html');
  assert.equal(app.resets(), 1);
});

test('expired tokens and SDK errors prevent login', async () => {
  for (const event of ['expired-callback', 'chalexpired-callback', 'error-callback']) {
    const app = await setup();
    const captcha = app.load();
    captcha.callback('old');
    captcha[event]();
    await app.submit();
    assert.equal(app.calls.length, 0);
    assert.equal(app.el('btn-login').disabled, true);
  }
});

test('failed login consumes token and requires a new solve; duplicate submits are ignored', async () => {
  let resolve;
  const app = await setup({ signIn: () => new Promise(r => { resolve = r; }) });
  const captcha = app.load();
  captcha.callback('first');
  const pending = app.submit();
  await app.submit();
  assert.equal(app.calls.length, 1);
  resolve({ error: { code: 'captcha_failed' } });
  await pending;
  assert.match(app.el('error-text').textContent, /ditolak/);
  await app.submit();
  assert.equal(app.calls.length, 1);
  assert.equal(app.resets(), 1);
  captcha.callback('second');
  assert.equal(app.el('btn-login').disabled, false);
});

test('network exceptions reset CAPTCHA and release loading state', async () => {
  const app = await setup({ signIn: () => { throw Error('offline'); } });
  app.load().callback('token');
  await app.submit();
  assert.equal(app.resets(), 1);
  assert.match(app.el('error-text').textContent, /koneksi/);
  assert.equal(app.el('btn-login').disabled, true);
});

test('existing session redirects without loading CAPTCHA; session errors allow retry', async () => {
  const app = await setup({ session: { user: {} } });
  assert.equal(app.redirect(), 'pages/index.html');
  assert.equal(app.scripts.length, 0);
  const failed = await setup({ sessionError: true });
  failed.load().callback('token');
  assert.equal(failed.el('btn-login').disabled, false);
});

test('SDK load failure keeps login blocked with recovery instructions', async () => {
  const app = await setup();
  app.scripts[0].onerror();
  await app.submit();
  assert.equal(app.calls.length, 0);
  assert.match(app.el('captcha-status').textContent, /muat ulang/);
});
