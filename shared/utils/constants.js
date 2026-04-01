// ============================================
// shared/utils/constants.js
// Konstanta global yang dipakai lintas modul
// ============================================

const SORT_MAP = {
  'terbaru':        { column: 'tahun_perolehan', ascending: false },
  'terlama':        { column: 'tahun_perolehan', ascending: true  },
  'harga-tertinggi':{ column: 'harga',           ascending: false },
  'harga-terendah': { column: 'harga',           ascending: true  },
  'nama-az':        { column: 'nama_barang',     ascending: true  },
  'nama-za':        { column: 'nama_barang',     ascending: false },
};

const KIB_LABEL = {
  'KIB A': '🏞️ KIB A – Tanah',
  'KIB B': '⚙️ KIB B – Peralatan & Mesin',
  'KIB C': '🏢 KIB C – Gedung & Bangunan',
  'KIB E': '📦 KIB E – Aset Tetap Lainnya',
};

const KONDISI_BADGE = {
  'Baik':        'badge-baik',
  'Rusak Ringan':'badge-rusak-ringan',
  'Rusak Berat': 'badge-rusak-berat',
};

const DOK_INPUTS = [
  { id: 'dok_spk_file',      key: 'dok_spk_url',      previewId: 'dok_spk_new_preview'      },
  { id: 'dok_penawaran_file',key: 'dok_penawaran_url', previewId: 'dok_penawaran_new_preview' },
  { id: 'dok_baphp_file',    key: 'dok_baphp_url',    previewId: 'dok_baphp_new_preview'    },
  { id: 'dok_bast_file',     key: 'dok_bast_url',     previewId: 'dok_bast_new_preview'     },
  { id: 'dok_kuitansi_file', key: 'dok_kuitansi_url', previewId: 'dok_kuitansi_new_preview' },
];

const DOK_FIELDS = [
  { key: 'dok_spk_url',      existingId: 'dok_spk_existing',      previewId: 'dok_spk_preview'      },
  { key: 'dok_penawaran_url',existingId: 'dok_penawaran_existing', previewId: 'dok_penawaran_preview' },
  { key: 'dok_baphp_url',    existingId: 'dok_baphp_existing',    previewId: 'dok_baphp_preview'    },
  { key: 'dok_bast_url',     existingId: 'dok_bast_existing',     previewId: 'dok_bast_preview'     },
  { key: 'dok_kuitansi_url', existingId: 'dok_kuitansi_existing', previewId: 'dok_kuitansi_preview' },
];

const DOK_PJ_INPUTS = [
  { id: 'dok_pj_pakta',   jenis: 'Pakta Integritas'          },
  { id: 'dok_pj_sptjm',   jenis: 'SPTJM'                     },
  { id: 'dok_pj_bast',    jenis: 'Berita Acara Serah Terima' },
  { id: 'dok_pj_lainnya', jenis: 'Lainnya'                   },
];

const DOK_LABELS = {
  dok_spk_url:      'SPK / Surat Pesanan',
  dok_penawaran_url:'Surat Penawaran',
  dok_baphp_url:    'BAPHP',
  dok_bast_url:     'BAST',
  dok_kuitansi_url: 'Kuitansi',
};
