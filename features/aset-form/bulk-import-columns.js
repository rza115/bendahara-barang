// ============================================
// features/aset-form/bulk-import-columns.js
// Kolom impor massal = field form tambah (tanpa foto & dokumen file)
// ============================================

/** @typedef {{ key: string, label: string, type: 'text'|'number'|'money'|'date', required?: boolean, options?: string[] }} BulkCol */

/** @type {BulkCol[]} */
const BULK_IMPORT_COLUMNS = [
  { key: 'kib', label: 'Kategori KIB', type: 'text', required: true,
    options: ['KIB A', 'KIB B', 'KIB C', 'KIB E'] },
  { key: 'nama_barang', label: 'Nama Barang', type: 'text', required: true },
  { key: 'kode_barang', label: 'Kode Barang', type: 'text' },
  { key: 'id_barang', label: 'ID Barang', type: 'text' },
  { key: 'no_register', label: 'No. Register', type: 'text' },
  { key: 'merk_type', label: 'Merk / Type', type: 'text' },
  { key: 'ukuran_cc', label: 'Ukuran / CC', type: 'text' },
  { key: 'bahan', label: 'Bahan', type: 'text' },
  { key: 'tahun_perolehan', label: 'Tahun Perolehan', type: 'number' },
  { key: 'jumlah', label: 'Jumlah Unit', type: 'number' },
  { key: 'harga', label: 'Harga (Rp)', type: 'money' },
  { key: 'cara_perolehan', label: 'Cara Perolehan', type: 'text',
    options: ['', 'Pengadaan APBD', 'Hibah/Sumbangan', 'Mutasi', 'Reklas', 'Lainnya'] },
  { key: 'sumber_dana', label: 'Sumber Dana', type: 'text',
    options: ['', 'APBD', 'APBN', 'Hibah', 'Lainnya'] },
  { key: 'kondisi', label: 'Kondisi', type: 'text', options: ['Baik', 'Rusak Ringan', 'Rusak Berat'] },
  { key: 'luas_tanah', label: 'Luas Tanah (m²) KIB A', type: 'number' },
  { key: 'tahun_perolehan_tanah', label: 'Tahun Perolehan Tanah', type: 'number' },
  { key: 'letak_alamat', label: 'Letak / Alamat (KIB A)', type: 'text' },
  { key: 'status_tanah', label: 'Hak / Status Sertifikat (KIB A)', type: 'text',
    options: ['', 'Pakai/Bersertifikat', 'Milik/Bersertifikat', 'Pakai/Belum Bersertifikat', 'Sewa', 'Pinjam Pakai'] },
  { key: 'no_urut_sertifikat', label: 'No. Urut Sertifikat', type: 'text' },
  { key: 'tgl_sertifikat', label: 'Tanggal Sertifikat', type: 'date' },
  { key: 'no_sertifikat', label: 'Nomor Sertifikat', type: 'text' },
  { key: 'penggunaan_tanah', label: 'Penggunaan Tanah', type: 'text' },
  { key: 'no_pabrik', label: 'No. Pabrik (KIB B)', type: 'text' },
  { key: 'no_rangka', label: 'No. Rangka', type: 'text' },
  { key: 'no_mesin', label: 'No. Mesin', type: 'text' },
  { key: 'no_polisi', label: 'No. Polisi', type: 'text' },
  { key: 'no_bpkb', label: 'No. BPKB', type: 'text' },
  { key: 'tgl_bpkb', label: 'Tanggal BPKB', type: 'date' },
  { key: 'kondisi_bangunan', label: 'Kondisi Bangunan (KIB C)', type: 'text' },
  { key: 'konstruksi_bertingkat', label: 'Konstruksi Bertingkat', type: 'text' },
  { key: 'konstruksi_beton', label: 'Konstruksi Beton', type: 'text' },
  { key: 'luas_lantai', label: 'Luas Lantai (m²)', type: 'number' },
  { key: 'jumlah_lantai', label: 'Jumlah Lantai', type: 'number' },
  { key: 'no_imb', label: 'No. IMB', type: 'text' },
  { key: 'tgl_imb', label: 'Tanggal IMB', type: 'date' },
  { key: 'letak_bangunan', label: 'Letak / Alamat Gedung', type: 'text' },
  { key: 'status_tanah_gedung', label: 'Status Tanah (gedung)', type: 'text',
    options: ['', 'Milik Sendiri', 'Sewa', 'Pinjam Pakai', 'Milik Pihak Lain'] },
  { key: 'status_sertifikat_tanah', label: 'Status Sertifikat Tanah', type: 'text' },
  { key: 'no_kode_tanah', label: 'No Kode Tanah', type: 'text' },
  { key: 'id_awal_tanah', label: 'ID Awal Tanah', type: 'text' },
  // { key: 'luas_bangunan', label: 'Luas Tanah m² (gedung)', type: 'number' },
  { key: 'tahun_cetak', label: 'Tahun Cetak / Beli (KIB E)', type: 'number' },
  { key: 'ukuran_aset', label: 'Ukuran (KIB E)', type: 'text' },
  { key: 'judul_koleksi', label: 'Judul / Pencipta', type: 'text' },
  { key: 'spesifikasi', label: 'Spesifikasi', type: 'text' },
  { key: 'asal_daerah', label: 'Asal Daerah', type: 'text' },
  { key: 'penerbit', label: 'Pencipta (kesenian)', type: 'text' },
  { key: 'bahan_aset', label: 'Bahan (KIB E)', type: 'text' },
  { key: 'jenis_aset', label: 'Jenis (hewan ternak)', type: 'text' },
  { key: 'tgl_buku', label: 'Tanggal Buku', type: 'date' },
  { key: 'no_bast', label: 'No. BAST', type: 'text' },
  { key: 'tgl_bast', label: 'Tanggal BAST', type: 'date' },
  { key: 'id_penerimaan', label: 'ID Penerimaan', type: 'text' },
  { key: 'status_aset', label: 'Status Aset', type: 'text',
    options: ['Aset Tetap', 'Aset Tidak Berwujud', 'Ekstra Komptabel', 'Penghapusan'] },
  { key: 'status_barang', label: 'Status Barang', type: 'text',
    options: ['Inventaris', 'Pinjaman', 'Titipan'] },
  { key: 'penanggung_jawab_id', label: 'ID Penanggung Jawab (UUID)', type: 'text' },
  { key: 'nama_penanggung_jawab', label: 'Nama Penanggung Jawab (manual)', type: 'text' },
  { key: 'lokasi', label: 'Lokasi Aset', type: 'text' },
  { key: 'penggunaan', label: 'Penggunaan', type: 'text' },
  { key: 'keterangan', label: 'Keterangan', type: 'text' },
];

const BULK_HEADER_ALIASES = {
  kategori_kib: 'kib',
  kib_a: 'kib',
  merk: 'merk_type',
  type: 'merk_type',
  tahun: 'tahun_perolehan',
  pj_id: 'penanggung_jawab_id',
  id_pj: 'penanggung_jawab_id',
  penanggung_jawab_uuid: 'penanggung_jawab_id',
  nama_pj: 'nama_penanggung_jawab',
};

function normalizeBulkHeader(h) {
  if (h == null) return '';
  return String(h)
    .replace(/^\ufeff/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '');
}

function resolveBulkHeader(h) {
  const n = normalizeBulkHeader(h);
  if (!n) return null;
  if (BULK_HEADER_ALIASES[n]) return BULK_HEADER_ALIASES[n];
  const valid = new Set(BULK_IMPORT_COLUMNS.map(c => c.key));
  if (valid.has(n)) return n;
  return null;
}

const BULK_KIB_FIELDS = {
  'KIB A': ['luas_tanah', 'tahun_perolehan_tanah', 'letak_alamat', 'status_tanah', 'no_urut_sertifikat', 'tgl_sertifikat', 'no_sertifikat', 'penggunaan_tanah'],
  'KIB B': ['merk_type', 'ukuran_cc', 'bahan', 'no_pabrik', 'no_rangka', 'no_mesin', 'no_polisi', 'no_bpkb', 'tgl_bpkb'],
  'KIB C': ['kondisi_bangunan', 'konstruksi_bertingkat', 'konstruksi_beton', 'luas_lantai', 'jumlah_lantai', 'no_imb', 'tgl_imb', 'letak_bangunan', 'status_tanah_gedung', 'status_sertifikat_tanah', 'no_kode_tanah', 'id_awal_tanah'],
  'KIB E': ['tahun_cetak', 'ukuran_aset', 'judul_koleksi', 'spesifikasi', 'asal_daerah', 'penerbit', 'bahan_aset', 'jenis_aset'],
};

function getBulkColumns(kib) {
  if (!BULK_KIB_FIELDS[kib]) throw new Error('Pilih format KIB A, B, C, atau E.');
  const specific = new Set(Object.values(BULK_KIB_FIELDS).flat());
  return BULK_IMPORT_COLUMNS.filter(c => !specific.has(c.key) || BULK_KIB_FIELDS[kib].includes(c.key));
}

function getBulkTemplateKeys(kib) {
  return getBulkColumns(kib).map(c => c.key);
}
