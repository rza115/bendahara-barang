const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../shared/ui/theme.js'), 'utf8');

function setup({ saved = null, dark = false, blocked = false } = {}) {
  const handlers = {};
  const stored = new Map(saved === null ? [] : [['siaset-theme', saved]]);
  const elements = [];
  const makeElement = tag => {
    const element = { tag, children: [], handlers: {},
      setAttribute(key, value) { this[key] = value; },
      addEventListener(key, callback) { this.handlers[key] = callback; },
      append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); },
      prepend(child) { this.children.unshift(child); },
    };
    elements.push(element);
    return element;
  };
  const topbar = makeElement('div');
  const document = { documentElement: { dataset: {} }, readyState: 'loading',
    createElement: makeElement,
    querySelector: selector => selector === '.topbar-right' ? topbar : null,
    addEventListener: (key, callback) => { handlers[key] = callback; },
  };
  const media = { matches: dark, addEventListener: (_, callback) => { handlers.system = callback; } };
  const window = { matchMedia: () => media,
    addEventListener: (key, callback) => { handlers[key] = callback; } };
  const localStorage = {
    getItem(key) { if (blocked) throw Error('Storage unavailable'); return stored.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw Error('Storage unavailable'); stored.set(key, value); },
  };
  vm.runInNewContext(source, { document, window, localStorage });
  return { document, media, handlers, stored, elements, topbar,
    theme: () => document.documentElement.dataset.theme,
    mount() { handlers.DOMContentLoaded(); return elements.find(el => el.tag === 'button'); },
  };
}

test('saved preference applies before the button mounts and persists changes', () => {
  const app = setup({ saved: 'dark' });
  assert.equal(app.theme(), 'dark');
  const button = app.mount();
  assert.equal(button.type, 'button');
  assert.equal(button['aria-label'], 'Aktifkan tema terang');
  assert.equal(button.children[0].textContent, 'light_mode');
  assert.equal(app.elements.some(el => el.tag === 'select'), false);
  button.handlers.click();
  assert.equal(app.theme(), 'light');
  assert.equal(app.stored.get('siaset-theme'), 'light');
  assert.equal(button.children[0].textContent, 'dark_mode');
  assert.equal(button['aria-label'], 'Aktifkan tema gelap');
  assert.equal(setup({ saved: app.stored.get('siaset-theme'), dark: true }).theme(), 'light');
});

test('system preference follows OS changes while explicit choices stay fixed', () => {
  const app = setup({ saved: 'invalid', dark: true });
  assert.equal(app.theme(), 'dark');
  const button = app.mount();
  assert.equal(button['aria-label'], 'Aktifkan tema terang');
  app.media.matches = false;
  app.handlers.system();
  assert.equal(app.theme(), 'light');
  button.handlers.click();
  app.handlers.system();
  assert.equal(app.theme(), 'dark');
});

test('unavailable storage does not prevent selecting a theme', () => {
  const app = setup({ blocked: true });
  const button = app.mount();
  assert.doesNotThrow(() => button.handlers.click());
  assert.equal(app.theme(), 'dark');
});

test('storage changes synchronize open pages and reset to system on clear', () => {
  const app = setup({ saved: 'light' });
  const button = app.mount();
  app.handlers.storage({ key: 'siaset-theme', newValue: 'dark' });
  assert.equal(button['aria-label'], 'Aktifkan tema terang');
  assert.equal(app.theme(), 'dark');
  app.handlers.storage({ key: 'unrelated', newValue: 'light' });
  assert.equal(app.theme(), 'dark');
  app.handlers.storage({ key: null, newValue: null });
  assert.equal(button['aria-label'], 'Aktifkan tema gelap');
  assert.equal(app.theme(), 'light');
});
