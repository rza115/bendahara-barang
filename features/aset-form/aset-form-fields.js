// ============================================
// features/aset-form/aset-form-fields.js
// ============================================

const FIELDS_TEXT = [
  'kib','kode_barang','id_barang','no_register','nama_barang','merk_type',
  'ukuran_cc','bahan','cara_perolehan','sumber_dana','kondisi',
  'status_barang','status_aset','lokasi','penggunaan','keterangan',
  'no_bast','id_penerimaan','penanggung_jawab_id','nama_penanggung_jawab',
  // KIB A
  'letak_alamat','status_tanah','no_urut_sertifikat','no_sertifikat','penggunaan_tanah',
  // KIB B
  'no_pabrik','no_rangka','no_mesin','no_polisi','no_bpkb',
  // KIB C
  'kondisi_bangunan','konstruksi_bertingkat','konstruksi_beton',
  'letak_bangunan','no_imb','status_tanah_gedung','no_kode_tanah',
  'id_awal_tanah','status_sertifikat_tanah',
  // KIB E
  'spesifikasi','penerbit','judul_koleksi','asal_daerah',
  'bahan_aset','jenis_aset','ukuran_aset',
];

const FIELDS_NUMBER = [
  { id: 'harga',               key: 'harga',               parse: v => parseInt(v.replace(/\./g, '')) || 0    },
  { id: 'jumlah',              key: 'jumlah',              parse: v => parseInt(v)                || 1    },
  { id: 'tahun_perolehan',     key: 'tahun_perolehan',     parse: v => parseInt(v)                || null },
  { id: 'luas_tanah',          key: 'luas_tanah',          parse: v => parseFloat(v)              || null },
  { id: 'luas_lantai',         key: 'luas_lantai',         parse: v => parseFloat(v)              || null },
  { id: 'jumlah_lantai',       key: 'jumlah_lantai',       parse: v => parseInt(v)                || null },
  { id: 'tahun_perolehan_tanah',key: 'tahun_perolehan_tanah',parse: v => parseInt(v)              || null },
  { id: 'tahun_cetak',         key: 'tahun_cetak',         parse: v => parseInt(v)                || null },
];

// FIX Bug #4: tambah tgl_bpkb yang sebelumnya tidak tercakup
const FIELDS_DATE = ['tgl_buku','tgl_bast','tgl_imb','tgl_sertifikat','tgl_bpkb'];

function fillForm(data) {
  FIELDS_TEXT.forEach(f => {
    const el = document.getElementById(f);
    if (!el) return;
    const val = data[f] ?? null;
    if (el.tagName === 'SELECT') {
      el.value = val;
      if (el.value !== String(val)) {
        const opt = Array.from(el.options).find(o => o.text === String(val));
        if (opt) el.value = opt.value;
      }
    } else {
      el.value = val ?? '';
    }
  });

  const hargaEl = document.getElementById('harga');
  if (hargaEl && data.harga != null) {
    hargaEl.value = parseInt(data.harga).toLocaleString('id-ID');
  }

  FIELDS_NUMBER.forEach(({ id, key }) => {
    if (id === 'harga') return;
    const el = document.getElementById(id);
    if (el && data[key] != null) el.value = data[key];
  });

  FIELDS_DATE.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = data[f] ?? '';
  });

  toggleKIBFields();
}

function getFormData() {
  const result = {};
  FIELDS_TEXT.forEach(f => {
    const el = document.getElementById(f);
    if (el) result[f] = el.value.trim() || null;
  });
  FIELDS_NUMBER.forEach(({ id, key, parse }) => {
    const el = document.getElementById(id);
    if (el) result[key] = parse(el.value);
  });
  FIELDS_DATE.forEach(f => {
    const el = document.getElementById(f);
    result[f] = el?.value || null;
  });
  return result;
}

// FIX Bug #1: ID section di tambah.html adalah section-tanah, section-kendaraan,
// section-gedung, section-lainnya — bukan section-kib-a/b/c/e
function toggleKIBFields() {
  const kib = document.getElementById('kib')?.value;
  const sections = {
    'section-tanah':     kib === 'KIB A',
    'section-kendaraan': kib === 'KIB B',
    'section-gedung':    kib === 'KIB C',
    'section-lainnya':   kib === 'KIB E',
  };
  Object.entries(sections).forEach(([id, show]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  });
}

function initHargaFormat() {
  const el = document.getElementById('harga');
  el?.addEventListener('input', function () {
    const val = this.value.replace(/\./g, '');
    this.value = val ? parseInt(val).toLocaleString('id-ID') : '';
  });
}
