const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const detailView = fs.readFileSync(
  path.join(__dirname, '..', 'features', 'aset-detail', 'aset-detail-view.js'),
  'utf8',
);

test('detail aset menampilkan tombol download hanya ketika foto tersedia', () => {
  assert.match(detailView, /data\.foto_url\s*\? `<div class="foto-download-wrap">/);
  assert.match(detailView, /class="foto-download-button"/);
  assert.match(detailView, /downloadFotoAset\(data\.foto_url, data\.nama_barang/);
  assert.match(detailView, /link\.download = `foto_\$\{safeName\}\.\$\{extension\}`/);
});
