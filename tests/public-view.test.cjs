const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicView = fs.readFileSync(
  path.join(__dirname, '..', 'general', 'view.html'),
  'utf8',
);

test('hasil scan QR memeriksa sesi sebelum menampilkan aksi edit', () => {
  assert.match(publicView, /db\.auth\.getSession\(\)/);
  assert.match(publicView, /const editActionHTML = isLoggedIn/);
  assert.match(publicView, /\.\.\/pages\/edit\.html\?id=\$\{encodeURIComponent\(data\.id\)\}/);
  assert.match(publicView, />Edit Barang</);
});
