const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(extra = {}) {
  const context = vm.createContext({ ...extra });
  for (const file of ['shared/utils/formatters.js', 'features/lokasi/lokasi-service.js',
    'features/lokasi/lokasi-view.js', 'features/aset-form/bulk-import-page.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  return context;
}

test('impor mencocokkan master, mempertahankan data asal, dan menerima lokasi kosong', () => {
  const app = setup();
  const input = [
    { sheetRow: 2, rec: { nama_barang: 'Meja', lokasi: '  RUANG   A ' } },
    { sheetRow: 3, rec: { nama_barang: 'Kursi', lokasi: ' ' } },
  ];
  const result = app.mapBulkLokasi(input, [{ nama: 'Ruang A' }]);
  assert.equal(result[0].rec.lokasi, 'Ruang A');
  assert.equal(result[1].rec.lokasi, null);
  assert.equal(input[0].rec.lokasi, '  RUANG   A ');
});

test('lokasi impor tidak dikenal ditolak sebelum ada aset yang disimpan', async () => {
  let insertCalls = 0;
  const app = setup({ db: { from(table) {
    if (table === 'aset') { insertCalls++; throw new Error('Tidak boleh insert'); }
    return { select() { return this; }, order() { return this; },
      range: async () => ({ data: [{ nama: 'Ruang A' }] }) };
  } } });
  await assert.rejects(app.runBulkImport([
    { sheetRow: 2, rec: { lokasi: 'Ruang A' } },
    { sheetRow: 3, rec: { lokasi: 'Ruang Typo' } },
  ]), /Baris 3.*belum terdaftar/);
  assert.equal(insertCalls, 0);
});

test('kartu memuat lebih dari 1.000 aset dan tidak mengambil aset Trash', async () => {
  const assets = Array.from({ length: 1201 }, (_, i) => ({ id: String(i), lokasi: 'Ruang A' }));
  const ranges = [];
  const app = setup({ db: { from(table) {
    assert.equal(table, 'aset');
    return { select() { return this; }, order() { return this; },
      is(column, value) { assert.equal(column, 'deleted_at'); assert.equal(value, null); return this; },
      async range(start, end) { ranges.push([start, end]); return { data: assets.slice(start, end + 1) }; } };
  } } });
  const result = await app.fetchAsetRuangan();
  assert.equal(result.length, 1201);
  assert.equal(new Set(result.map(asset => asset.id)).size, 1201);
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]]);
});

test('gagal mengambil halaman lanjutan tidak mengembalikan kartu parsial', async () => {
  const app = setup();
  await assert.rejects(app.fetchAllLokasiRows(() => ({
    range: async start => start === 0 ? { data: Array(500).fill({}) }
      : { error: new Error('Koneksi terputus') },
  })), /Koneksi terputus/);
});

test('pengelompokan mempertahankan ruangan kosong, aset tanpa lokasi, dan barang bernama sama', () => {
  const app = setup();
  const groups = app.groupAsetByLokasi([{ id: 'a', nama: 'Ruang A' }, { id: 'b', nama: 'Ruang B' }], [
    { id: '1', nama_barang: 'Meja', lokasi: 'Ruang A' },
    { id: '2', nama_barang: 'Meja', lokasi: 'ruang a' },
    { id: '3', nama_barang: 'Kursi', lokasi: null },
  ]);
  assert.equal(groups[0].assets.length, 2);
  assert.equal(groups[1].assets.length, 0);
  assert.equal(groups[2].id, 'unassigned');
  assert.equal(groups[2].assets[0].id, '3');
});

test('kartu terpilih menampilkan data yang aman, nilai nol, dan tidak mencampur ruangan', () => {
  const nodes = { 'kir-cards': {}, 'kir-print': {} };
  const app = setup({ document: { getElementById: id => nodes[id] } });
  const groups = app.groupAsetByLokasi([{ id: 'a', nama: '<Ruang A>' }, { id: 'b', nama: 'Ruang B' }], [
    { id: '1', nama_barang: '<script>alert(1)</script>', lokasi: '<Ruang A>', jumlah: 0, harga: 0 },
    { id: '2', nama_barang: 'Aset ruangan lain', lokasi: 'Ruang B', jumlah: 5, harga: 99 },
  ]);
  app.renderKartuRuangan(groups, 'a');
  assert.match(nodes['kir-cards'].innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch(nodes['kir-cards'].innerHTML, /<script>|Aset ruangan lain/);
  assert.match(nodes['kir-cards'].innerHTML, /0 unit/);
  assert.equal(nodes['kir-print'].disabled, false);
  app.renderKartuRuangan([], 'all');
  assert.equal(nodes['kir-print'].disabled, true);
});
