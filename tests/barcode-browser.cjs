// Optional integration test: npm install --no-save playwright html2canvas@1.4.1 jspdf@2.5.1 qrcodejs@1.0.0 jsbarcode@3.11.6
// npx playwright install chromium && node tests/barcode-browser.cjs
// Uses fixture data and intercepted local assets; never connects to Supabase.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.BARCODE_TEST_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'barcode-test-'));
const libs = {
  'qrcode.min.js': require.resolve('qrcodejs/qrcode.min.js'),
  'JsBarcode.all.min.js': require.resolve('jsbarcode/dist/JsBarcode.all.min.js'),
  'jspdf.umd.min.js': require.resolve('jspdf/dist/jspdf.umd.min.js'),
  'html2canvas.min.js': require.resolve('html2canvas/dist/html2canvas.min.js'),
};
const source = fs.readFileSync(path.join(root, 'pages/barcode.html'), 'utf8');
const assets = Array.from({ length: 21 }, (_, i) => ({
  id: `12345678-1234-1234-1234-${String(i).padStart(12, '0')}`,
  id_barang: String(i + 1).padStart(6, '0'), nama_barang: i === 1 ? 'Lemari Arsip Besi Dua Pintu' : 'Laptop Kantor',
  kode_barang: '1.3.2.10.01.02.001', tahun_perolehan: 2025, kib: 'KIB B',
}));
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BARCODE_CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      const name = path.basename(url.pathname);
      if (libs[name]) return route.fulfill({ path: libs[name], contentType: 'application/javascript' });
      if (url.hostname !== 'label.test') return route.fulfill({ body: '' });
      if (url.pathname === '/pages/barcode.html') return route.fulfill({ body: source, contentType: 'text/html' });
      if (/supabase\.js|auth-guard\.js|nav\.js|main\.js|barcode-service\.js|feedback\.js|theme\.js/.test(name)) return route.fulfill({ body: '', contentType: 'application/javascript' });
      const file = path.join(root, decodeURIComponent(url.pathname));
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ path: file, contentType: name.endsWith('.css') ? 'text/css' : name.endsWith('.png') ? 'image/png' : 'application/javascript' });
    });
    await page.addInitScript(data => {
      window._appReady = Promise.resolve(true);
      window._authClient = {};
      window.fetchAsetBarcode = async () => data;
      window.testAlerts = [];
      window.showAlert = (...args) => window.testAlerts.push(args);
      window.showLoading = () => { document.getElementById('loading').style.display = 'none'; };
      window.print = () => { window.didPrint = true; };
    }, assets);
    await page.goto('https://label.test/pages/barcode.html');
    await page.evaluate(() => window.initBarcodePage());
    await page.click('#btn-pilih-semua');
    const expected = { a4: 10, folio: 12, a3: 20 };
    let checks = 0;
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const kind of ['qrcode', 'barcode', 'bpkad']) {
        await page.selectOption('#opt-jenis-kode', kind);
        await page.click('#btn-generate');
        for (const paper of ['a4', 'folio', 'a3']) {
          await page.selectOption('#opt-kertas', paper);
          const result = await page.evaluate(() => ({
            counts: [...document.querySelectorAll('.label-sheet')].map(e => e.children.length),
            sizes: [...document.querySelectorAll('.label-card')].map(e => ({ w: e.getBoundingClientRect().width * 25.4 / 96, h: e.getBoundingClientRect().height * 25.4 / 96 })),
          }));
          assert.equal(result.counts[0], expected[paper]);
          assert.equal(result.counts.length, Math.ceil(21 / expected[paper]));
          result.sizes.forEach(s => { assert.ok(Math.abs(s.w - 90) < .02); assert.ok(Math.abs(s.h - 45) < .02); });
          await page.evaluate(() => { window.didPrint = false; window.testAlerts = []; });
          await page.click('#btn-print');
          await page.waitForFunction(() => window.didPrint || window.testAlerts.length);
          assert.equal(await page.evaluate(() => window.didPrint), true, JSON.stringify(await page.evaluate(() => window.testAlerts)));
          checks++;
        }
      }
    }
    // Actual jsPDF + html2canvas export, including offscreen labels and page break.
    await page.setViewportSize({ width: 375, height: 1000 });
    await page.selectOption('#opt-jenis-kode', 'qrcode');
    await page.selectOption('#opt-kertas', 'a4');
    await page.click('#btn-generate');
    await page.evaluate(() => { window.testAlerts = []; });
    const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
    await page.click('#btn-pdf');
    const download = await downloadPromise;
    await download.saveAs(path.join(output, 'qr-export-a4.pdf'));
    await page.locator('.label-card').first().screenshot({ path: path.join(output, 'qr-label.png') });
    for (const paper of ['a4', 'folio', 'a3']) {
      await page.selectOption('#opt-kertas', paper);
      await page.pdf({ path: path.join(output, `print-${paper}.pdf`), preferCSSPageSize: true, printBackground: true });
    }
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => {
      document.querySelector('.label-val').textContent = 'Nama sangat panjang '.repeat(100);
      window.didPrint = false; window.testAlerts = [];
    });
    await page.click('#btn-print');
    await page.waitForFunction(() => window.testAlerts.length > 0);
    assert.equal(await page.evaluate(() => window.didPrint), false);
    assert.match(await page.evaluate(() => window.testAlerts[0][0]), /melebihi label/);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ matrixChecks: checks, overflowBlocked: true, errors, output }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
