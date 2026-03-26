// ============================================
// app.js — Logika Supabase CRUD
// ============================================

let db = null;
let _fotoHapus = false;
const _uploadedDokumen = {};
let activeFilter = {};

const SORT_MAP = {
  'terbaru':         { column: 'tahun_perolehan', ascending: false },
  'terlama':         { column: 'tahun_perolehan', ascending: true  },
  'harga-tertinggi': { column: 'harga',           ascending: false },
  'harga-terendah':  { column: 'harga',           ascending: true  },
  'nama-az':         { column: 'nama_barang',     ascending: true  },
  'nama-za':         { column: 'nama_barang',     ascending: false },
};

const KIB_LABEL = {
  'KIB A': '🏞️ KIB A – Tanah',
  'KIB B': '⚙️ KIB B – Peralatan & Mesin',
  'KIB C': '🏢 KIB C – Gedung & Bangunan',
  'KIB E': '📦 KIB E – Aset Tetap Lainnya',
};

const KONDISI_BADGE = {
  'Baik':         'badge-baik',
  'Rusak Ringan': 'badge-rusak-ringan',
  'Rusak Berat':  'badge-rusak-berat',
};

const DOK_INPUTS = [
  { id: 'dok_spk_file',      key: 'dok_spk_url',      previewId: 'dok_spk_new_preview' },
  { id: 'dok_penawaran_file', key: 'dok_penawaran_url', previewId: 'dok_penawaran_new_preview' },
  { id: 'dok_baphp_file',    key: 'dok_baphp_url',    previewId: 'dok_baphp_new_preview' },
  { id: 'dok_bast_file',     key: 'dok_bast_url',     previewId: 'dok_bast_new_preview' },
  { id: 'dok_kuitansi_file', key: 'dok_kuitansi_url', previewId: 'dok_kuitansi_new_preview' },
];

const DOK_FIELDS = [
  { key: 'dok_spk_url',      existingId: 'dok_spk_existing',      previewId: 'dok_spk_preview' },
  { key: 'dok_penawaran_url', existingId: 'dok_penawaran_existing', previewId: 'dok_penawaran_preview' },
  { key: 'dok_baphp_url',    existingId: 'dok_baphp_existing',    previewId: 'dok_baphp_preview' },
  { key: 'dok_bast_url',     existingId: 'dok_bast_existing',     previewId: 'dok_bast_preview' },
  { key: 'dok_kuitansi_url', existingId: 'dok_kuitansi_existing', previewId: 'dok_kuitansi_preview' },
];

// ============================================
// UTILITY
// ============================================

const $ = id => document.getElementById(id);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRupiah(angka) {
  if (!angka && angka !== 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(angka);
}

function showAlert(msg, type = 'success') {
  const el = $('alert-box');
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function showLoading(show = true) {
  const el = $('loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function getKIBLabel(kib)     { return KIB_LABEL[kib]   || kib; }
function getKondisiBadge(k)   { return KONDISI_BADGE[k]  || 'badge-baik'; }

// ============================================
// FOTO
// ============================================

async function uploadFoto(file) {
  const fileName = `barang_${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await db.storage.from('foto-barang').upload(fileName, file, { upsert: true });
  if (error) throw error;
  return db.storage.from('foto-barang').getPublicUrl(fileName).data.publicUrl;
}

async function hapusFotoStorage(url) {
  if (!url) return;
  try {
    const path = url.split('/foto-barang/')[1];
    if (path) await db.storage.from('foto-barang').remove([path]);
  } catch (_) {}
}

function initFotoUpload(existingUrl = null) {
  const fileInput   = $('foto_file');
  const previewWrap = $('foto-preview-wrap');
  const previewImg  = $('foto-preview');
  const existingWrap = $('foto-existing-wrap');
  const existingImg  = $('foto-existing');
  _fotoHapus = false;

  if (existingUrl && existingImg) {
    existingImg.src = existingUrl;
    if (existingWrap) existingWrap.style.display = 'block';
  }

  fileInput?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Ukuran foto melebihi 2 MB!', 'error');
      this.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      if (previewImg)   previewImg.src = e.target.result;
      if (previewWrap)  previewWrap.style.display = 'block';
      if (existingWrap) existingWrap.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  $('btn-hapus-foto')?.addEventListener('click', () => {
    _fotoHapus = true;
    if (existingWrap) existingWrap.style.display = 'none';
    if (previewWrap)  previewWrap.style.display = 'none';
    if (fileInput)    fileInput.value = '';
  });
}

// ============================================
// DOKUMEN PENGADAAN
// ============================================

async function uploadDokumen(file, jenisDok) {
  const fileName = `${jenisDok}_${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await db.storage.from('dokumen-pengadaan').upload(fileName, file, { upsert: true });
  if (error) throw error;
  return db.storage.from('dokumen-pengadaan').getPublicUrl(fileName).data.publicUrl;
}

function renderDokPreview(wrap, file) {
  if (!wrap) return;
  const isImage = file.type.startsWith('image/');
  if (isImage) {
    const reader = new FileReader();
    reader.onload = e => {
      wrap.innerHTML = `
        <img src="${e.target.result}" alt="Preview"
          style="max-width:200px;max-height:200px;border-radius:8px;border:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#64748b;margin-top:4px;">📄 ${escapeHtml(file.name)}</p>`;
      wrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    wrap.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;
        background:#f1f5f9;border-radius:8px;border:1px solid #e2e8f0;">
        <span style="font-size:20px;">📄</span>
        <span style="font-size:13px;color:#334155;">${escapeHtml(file.name)}</span>
      </div>`;
    wrap.style.display = 'block';
  }
}

function initDokumenUpload() {
  DOK_INPUTS.forEach(({ id, key, previewId }) => {
    const input = $(id);
    if (!input) return;
    input.addEventListener('change', function () {
      const file = this.files[0];
      const previewWrap = $(previewId);
      if (previewWrap) { previewWrap.innerHTML = ''; previewWrap.style.display = 'none'; }
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Ukuran file melebihi 5 MB!', 'error');
        this.value = '';
        return;
      }
      _uploadedDokumen[key] = file;
      renderDokPreview(previewWrap, file);
    });
  });
}

function initDokumenPreview(data) {
  DOK_FIELDS.forEach(({ key, existingId, previewId }) => {
    const url = data[key];
    if (!url) return;
    const existingWrap = $(existingId);
    const previewEl    = $(previewId);
    if (!existingWrap || !previewEl) return;

    existingWrap.dataset.url = url;
    const ext = url.split('?')[0].split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);

    if (isImage) {
      previewEl.innerHTML = `
        <img src="${escapeHtml(url)}" alt="Dokumen"
          style="max-width:200px;max-height:200px;border-radius:8px;border:1px solid #e2e8f0;">`;
    } else {
      const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]);
      previewEl.innerHTML = `
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;
            background:#f1f5f9;border-radius:8px;border:1px solid #cbd5e1;
            text-decoration:none;color:#1e40af;font-size:13px;">
          <span style="font-size:18px;">📄</span>
          <span>${escapeHtml(fileName)}</span>
          <span style="font-size:11px;color:#64748b;">↗ Buka</span>
        </a>`;
    }
    existingWrap.style.display = 'block';
  });
}

function hapusDokumen(key, existingId) {
  const el = $(existingId);
  if (el) el.style.display = 'none';
  _uploadedDokumen[key] = null;
}

// ============================================
// INDEX PAGE — DAFTAR ASET
// ============================================

async function loadAset(filter = {}) {
  activeFilter = filter;
  showLoading(true);
  try {
    // Query 1: data tampil (sort + limit server-side)
    let query = db.from('aset').select('*');
    if (filter.kib)     query = query.eq('kib', filter.kib);
    if (filter.kondisi) query = query.eq('kondisi', filter.kondisi);
    if (filter.search)  query = query.ilike('nama_barang', `%${filter.search}%`);

    const sortOpt = SORT_MAP[filter.sort];
    query = sortOpt
      ? query.order(sortOpt.column, { ascending: sortOpt.ascending })
      : query.order('kib').order('nama_barang');

    const limitVal = filter.limit && filter.limit !== 'all' ? parseInt(filter.limit) : null;
    if (limitVal) query = query.limit(limitVal);

    const { data, error } = await query;
    if (error) throw error;
    renderTable(data);

    // Query 2: summary (tanpa limit/sort, hanya kolom yang dibutuhkan)
    let summaryQuery = db.from('aset').select('kib, harga');
    if (filter.kib)     summaryQuery = summaryQuery.eq('kib', filter.kib);
    if (filter.kondisi) summaryQuery = summaryQuery.eq('kondisi', filter.kondisi);
    if (filter.search)  summaryQuery = summaryQuery.ilike('nama_barang', `%${filter.search}%`);

    const { data: summaryData, error: summaryError } = await summaryQuery;
    if (summaryError) throw summaryError;
    updateSummary(summaryData);

  } catch (err) {
    showAlert('Gagal memuat data: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

function renderTable(data) {
  const tbody = $('aset-tbody');
  if (!tbody) return;

  if (!data?.length) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="empty-state">
        <div>📭</div>
        <p>Belum ada data aset. <a href="tambah.html">Tambah aset pertama</a></p>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((row, i) => `
    <tr class="row-clickable" data-id="${row.id}" style="cursor:pointer" title="Klik untuk lihat detail">
      <td class="td-no">${i + 1}</td>
      <td>
        ${row.foto_url ? `<img src="${escapeHtml(row.foto_url)}" alt=""
          style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;">` : ''}
        <div class="nama-barang">${escapeHtml(row.nama_barang)}</div>
        ${row.merk_type   ? `<div class="sub-info">${escapeHtml(row.merk_type)}</div>` : ''}
        ${row.kode_barang ? `<div class="kode-info">${escapeHtml(row.kode_barang)}</div>` : ''}
      </td>
      <td><span class="kib-badge kib-${row.kib.replace(' ', '-').toLowerCase()}">${escapeHtml(row.kib)}</span></td>
      <td>${row.tahun_perolehan || '-'}</td>
      <td class="td-harga">${formatRupiah(row.harga)}</td>
      <td>${row.kondisi ? `<span class="badge ${getKondisiBadge(row.kondisi)}">${escapeHtml(row.kondisi)}</span>` : '-'}</td>
      <td>${escapeHtml(row.lokasi || row.penggunaan || '-')}</td>
      <td class="td-action">
        <a href="detail.html?id=${row.id}" class="btn-edit" title="Detail"  onclick="event.stopPropagation()">🔍</a>
        <a href="edit.html?id=${row.id}"   class="btn-edit" title="Edit"    onclick="event.stopPropagation()">✏️</a>
        <button class="btn-hapus" data-id="${row.id}" data-nama="${escapeHtml(row.nama_barang)}"
          title="Hapus" onclick="event.stopPropagation()">🗑️</button>
      </td>
    </tr>
  `).join('');

  tbody.onclick = e => {
    const btn = e.target.closest('.btn-hapus');
    if (btn) { hapusAset(btn.dataset.id, btn.dataset.nama); return; }
    const row = e.target.closest('.row-clickable');
    if (row) window.location.href = `detail.html?id=${row.dataset.id}`;
  };
}

function updateSummary(data) {
  if (!data) return;
  const totalNilai = data.reduce((s, r) => s + (parseInt(r.harga) || 0), 0);
  const perKIB = { 'KIB A': 0, 'KIB B': 0, 'KIB C': 0, 'KIB E': 0 };
  data.forEach(r => { if (r.kib in perKIB) perKIB[r.kib]++; });

  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  setText('total-aset',  data.length);
  setText('total-nilai', formatRupiah(totalNilai));
  setText('total-kib-a', perKIB['KIB A']);
  setText('total-kib-b', perKIB['KIB B']);
  setText('total-kib-c', perKIB['KIB C']);
  setText('total-kib-e', perKIB['KIB E']);
}

async function hapusAset(id, nama) {
  if (!confirm(`Yakin hapus aset "${nama}"?\n\nTindakan ini tidak bisa dibatalkan.`)) return;
  showLoading(true);
  try {
    const { error } = await db.from('aset').delete().eq('id', id);
    if (error) throw error;
    showAlert(`Aset "${nama}" berhasil dihapus.`);
    loadAset(activeFilter);
  } catch (err) {
    showAlert('Gagal menghapus: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

function initFilter() {
  const filterKIB     = $('filter-kib');
  const filterKondisi = $('filter-kondisi');
  const searchInput   = $('search-input');
  const sortBy        = $('sort-by');
  const limitRows     = $('limit-rows');

  function applyFilter() {
    loadAset({
      kib:     filterKIB?.value     || '',
      kondisi: filterKondisi?.value || '',
      search:  searchInput?.value   || '',
      sort:    sortBy?.value        || '',
      limit:   limitRows?.value     || 'all',
    });
  }

  [filterKIB, filterKondisi, sortBy, limitRows].forEach(el =>
    el?.addEventListener('change', applyFilter)
  );

  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilter, 400);
  });
}

// ============================================
// TAMBAH / EDIT ASET
// ============================================

async function loadAsetById(id) {
  const { data, error } = await db.from('aset').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

function fillForm(data) {
  const fields = [
    'kib', 'kode_barang', 'id_barang', 'no_register', 'nama_barang',
    'merk_type', 'ukuran_cc', 'bahan', 'tahun_perolehan', 'cara_perolehan',
    'sumber_dana', 'jumlah', 'kondisi', 'status_barang', 'status_aset',
    'tgl_buku', 'no_bast', 'tgl_bast', 'id_penerimaan',     'nama_penanggung_jawab', 'penanggung_jawab_id',
    'lokasi', 'penggunaan', 'keterangan',
    // KIB A
    'luas_tanah', 'tahun_perolehan_tanah', 'letak_alamat', 'status_tanah',
    'no_urut_sertifikat', 'tgl_sertifikat', 'no_sertifikat', 'penggunaan_tanah',
    // KIB B
    'no_pabrik', 'no_rangka', 'no_mesin', 'no_polisi', 'no_bpkb',
    // KIB C
    'kondisi_bangunan', 'luas_lantai', 'konstruksi_bertingkat', 'konstruksi_beton',
    'letak_bangunan', 'tgl_imb', 'no_imb',
    'status_tanah_gedung', 'no_kode_tanah', 'id_awal_tanah', 'status_sertifikat_tanah',
    // KIB E
    'tahun_cetak', 'ukuran_aset', 'judul_koleksi', 'spesifikasi',
    'asal_daerah', 'penerbit', 'bahan_aset', 'jenis_aset',
  ];

  fields.forEach(f => {
    const el = $(f);
    if (!el || data[f] == null) return;
    if (el.tagName === 'SELECT') {
      el.value = data[f];
      if (el.value !== String(data[f])) {
        const opt = Array.from(el.options).find(o => o.text === String(data[f]));
        if (opt) el.value = opt.value;
      }
    } else {
      el.value = data[f];
    }
  });

  const hargaEl = $('harga');
  if (hargaEl && data.harga != null) {
    hargaEl.value = parseInt(data.harga).toLocaleString('id-ID');
  }

  toggleKIBFields();
}

function getFormData() {
  const fields = [
    'kib', 'kode_barang', 'id_barang', 'no_register', 'nama_barang',
    'merk_type', 'ukuran_cc', 'bahan', 'cara_perolehan', 'sumber_dana',
    'kondisi', 'status_barang', 'status_aset', 'lokasi', 'penggunaan', 'keterangan',
    'no_bast', 'id_penerimaan',     'nama_penanggung_jawab', 'penanggung_jawab_id',
    // KIB A
    'letak_alamat', 'status_tanah', 'no_urut_sertifikat', 'tgl_sertifikat',
    'no_sertifikat', 'penggunaan_tanah',
    // KIB B
    'no_pabrik', 'no_rangka', 'no_mesin', 'no_polisi', 'no_bpkb',
    // KIB C
    'kondisi_bangunan', 'konstruksi_bertingkat', 'konstruksi_beton',
    'letak_bangunan', 'no_imb', 'status_tanah_gedung',
    'no_kode_tanah', 'id_awal_tanah', 'status_sertifikat_tanah',
    // KIB E
    'spesifikasi', 'penerbit', 'judul_koleksi', 'asal_daerah', 'bahan_aset', 'jenis_aset', 'ukuran_aset',
  ];

  const result = {};
  fields.forEach(f => {
    const el = $(f);
    if (el) result[f] = el.value.trim() || null;
  });

  // Field angka
  const numFields = [
    { id: 'harga',                 key: 'harga',                   parse: v => parseInt(v.replace(/\D/g, '')) || 0 },
    { id: 'jumlah',                key: 'jumlah',                  parse: v => parseInt(v) || 1 },
    { id: 'tahun_perolehan',       key: 'tahun_perolehan',         parse: v => parseInt(v) || null },
    { id: 'luas_tanah',            key: 'luas_tanah',              parse: v => parseFloat(v) || null },
    { id: 'luas_lantai',           key: 'luas_lantai',             parse: v => parseFloat(v) || null },
    { id: 'jumlah_lantai',         key: 'jumlah_lantai',           parse: v => parseInt(v) || null },
    { id: 'tahun_perolehan_tanah', key: 'tahun_perolehan_tanah',   parse: v => parseInt(v) || null },
    { id: 'tahun_cetak',           key: 'tahun_cetak',             parse: v => parseInt(v) || null },
  ];
  numFields.forEach(({ id, key, parse }) => {
    const el = $(id);
    if (el) result[key] = parse(el.value);
  });

  // Field tanggal
  ['tgl_buku', 'tgl_bast', 'tgl_imb', 'tgl_sertifikat'].forEach(f => {
    result[f] = $(f)?.value || null;
  });

  return result;
}

async function simpanAset(isEdit = false, id = null) {
  const data = getFormData();
  if (!data.nama_barang) { showAlert('Nama barang wajib diisi!', 'error'); return; }
  if (!data.kib)         { showAlert('Kategori KIB wajib dipilih!', 'error'); return; }

  showLoading(true);
  try {
    const fotoFile = $('foto_file')?.files?.[0];
    if (fotoFile) {
      try { data.foto_url = await uploadFoto(fotoFile); }
      catch (err) { showAlert('Gagal upload foto: ' + err.message, 'error'); return; }
    } else if (isEdit && _fotoHapus) {
      const existingImg = $('foto-existing');
      if (existingImg?.src) await hapusFotoStorage(existingImg.src);
      data.foto_url = null;
    }

    for (const [key, file] of Object.entries(_uploadedDokumen)) {
      if (file === null) {
        data[key] = null;
      } else if (file instanceof File) {
        try { data[key] = await uploadDokumen(file, key.replace('_url', '')); }
        catch (err) { showAlert('Gagal upload dokumen: ' + err.message, 'error'); return; }
      }
    }

    const { error } = isEdit && id
      ? await db.from('aset').update(data).eq('id', id)
      : await db.from('aset').insert(data);
    if (error) throw error;

    showAlert(isEdit ? 'Aset berhasil diperbarui!' : 'Aset berhasil ditambahkan!');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  } catch (err) {
    showAlert('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

function toggleKIBFields() {
  const kib = $('kib')?.value;
  const sections = {
    'section-tanah':     kib === 'KIB A',
    'section-kendaraan': kib === 'KIB B',
    'section-gedung':    kib === 'KIB C',
    'section-lainnya':   kib === 'KIB E',
  };
  Object.entries(sections).forEach(([id, show]) => {
    const el = $(id);
    if (el) el.style.display = show ? 'block' : 'none';
  });
}

function initHargaFormat() {
  const el = $('harga');
  el?.addEventListener('input', function () {
    const val = this.value.replace(/\D/g, '');
    this.value = val ? parseInt(val).toLocaleString('id-ID') : '';
  });
}


// ============================================
// DETAIL PAGE
// ============================================

const DOK_LABELS = {
  dok_spk_url:       'SPK / Surat Pesanan',
  dok_penawaran_url: 'Surat Penawaran',
  dok_baphp_url:     'BAPHP',
  dok_bast_url:      'BAST',
  dok_kuitansi_url:  'Kuitansi',
};

function renderDetail(data) {
  $('detail-nama').textContent      = data.nama_barang || '—';
  $('detail-kib-label').textContent = getKIBLabel(data.kib) || '—';
  $('btn-edit').href                = `edit.html?id=${data.id}`;

  // Foto
  const fotoWrap = $('foto-wrap');
  if (fotoWrap) {
    fotoWrap.innerHTML = data.foto_url
      ? `<img src="${escapeHtml(data.foto_url)}" alt="Foto Barang" class="foto-box">`
      : `<div class="foto-placeholder"><span>📷</span>Tidak ada foto</div>`;
  }

  // Helper set nilai ke elemen
  const set = (id, v, mono = false) => {
    const el = $(id);
    if (!el) return;
    if (v == null || v === '') {
      el.innerHTML = '<span class="detail-value empty">—</span>';
    } else {
      el.innerHTML = `<span class="detail-value${mono ? ' mono' : ''}">${escapeHtml(String(v))}</span>`;
    }
  };

  // Data umum
  set('d-kode_barang',   data.kode_barang,   true);
  set('d-no_register',   data.no_register,   true);
  set('d-id_barang',     data.id_barang,     true);
  set('d-merk_type',     data.merk_type);
  set('d-ukuran_cc',     data.ukuran_cc);
  set('d-bahan',         data.bahan);
  set('d-jumlah',        data.jumlah,        true);
  set('d-status_barang', data.status_barang);
  set('d-status_aset',   data.status_aset);
  set('d-lokasi',        data.lokasi);
  set('d-penggunaan',    data.penggunaan);
  set('d-keterangan',    data.keterangan);

  // KIB badge
  const kibEl = $('d-kib');
  if (kibEl) kibEl.innerHTML = data.kib
    ? `<span class="kib-badge kib-${data.kib.replace(' ','-').toLowerCase()}">${escapeHtml(data.kib)}</span>`
    : '<span class="detail-value empty">—</span>';

  // Kondisi badge
  const kondisiEl = $('d-kondisi');
  if (kondisiEl) kondisiEl.innerHTML = data.kondisi
    ? `<span class="badge ${getKondisiBadge(data.kondisi)}">${escapeHtml(data.kondisi)}</span>`
    : '<span class="detail-value empty">—</span>';

  // Perolehan
  set('d-tahun_perolehan', data.tahun_perolehan, true);
  set('d-harga',           data.harga != null ? formatRupiah(data.harga) : null, true);
  set('d-cara_perolehan',  data.cara_perolehan);
  set('d-sumber_dana',     data.sumber_dana);
  set('d-tgl_buku',        data.tgl_buku);
  set('d-no_bast',         data.no_bast, true);
  set('d-tgl_bast',        data.tgl_bast);
  set('d-id_penerimaan',   data.id_penerimaan, true);

  // Tampilkan section KIB yang relevan
  const kibSectionMap = {
    'KIB A': 'section-kib-a', 'KIB B': 'section-kib-b',
    'KIB C': 'section-kib-c', 'KIB E': 'section-kib-e',
  };
  Object.values(kibSectionMap).forEach(id => {
    const el = $(id); if (el) el.style.display = 'none';
  });
  const activeSection = $(kibSectionMap[data.kib]);
  if (activeSection) activeSection.style.display = 'block';

  // KIB A
  set('d-luas_tanah',            data.luas_tanah,            true);
  set('d-tahun_perolehan_tanah', data.tahun_perolehan_tanah, true);
  set('d-status_tanah',          data.status_tanah);
  set('d-letak_alamat',          data.letak_alamat);
  set('d-no_urut_sertifikat',    data.no_urut_sertifikat,    true);
  set('d-no_sertifikat',         data.no_sertifikat,         true);
  set('d-tgl_sertifikat',        data.tgl_sertifikat);
  set('d-penggunaan_tanah',      data.penggunaan_tanah);

  // KIB B
  set('d-no_pabrik', data.no_pabrik, true);
  set('d-no_rangka', data.no_rangka, true);
  set('d-no_mesin',  data.no_mesin,  true);
  set('d-no_polisi', data.no_polisi, true);
  set('d-no_bpkb',   data.no_bpkb,   true);

  // KIB C
  set('d-kondisi_bangunan',        data.kondisi_bangunan);
  set('d-luas_lantai',             data.luas_lantai,            true);
  set('d-jumlah_lantai',           data.jumlah_lantai,          true);
  set('d-konstruksi_bertingkat',   data.konstruksi_bertingkat);
  set('d-konstruksi_beton',        data.konstruksi_beton);
  set('d-letak_bangunan',          data.letak_bangunan);
  set('d-no_imb',                  data.no_imb,                 true);
  set('d-tgl_imb',                 data.tgl_imb);
  set('d-status_tanah_gedung',     data.status_tanah_gedung);
  set('d-no_kode_tanah',           data.no_kode_tanah,          true);
  set('d-id_awal_tanah',           data.id_awal_tanah,          true);
  set('d-status_sertifikat_tanah', data.status_sertifikat_tanah);

  // KIB E
  set('d-judul_koleksi', data.judul_koleksi);
  set('d-spesifikasi',   data.spesifikasi);
  set('d-penerbit',      data.penerbit);
  set('d-asal_daerah',   data.asal_daerah);
  set('d-bahan_aset',    data.bahan_aset);
  set('d-jenis_aset',    data.jenis_aset);
  set('d-ukuran_aset',   data.ukuran_aset);
  set('d-tahun_cetak',   data.tahun_cetak, true);

  // Dokumen pengadaan
  const dokGrid    = $('dokumen-grid');
  const dokSection = $('section-dokumen');
  if (dokGrid && dokSection) {
    const items = Object.entries(DOK_LABELS)
      .filter(([key]) => data[key])
      .map(([key, label]) => {
        const url = data[key];
        const ext = url.split('?')[0].split('.').pop().toLowerCase();
        const isImage = ['jpg','jpeg','png','webp','gif'].includes(ext);
        const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]);
        const preview = isImage
          ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" class="dok-img">`
          : `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="dok-link">
               <span>📄</span><span>${escapeHtml(fileName)}</span>
               <span style="font-size:11px;color:#64748b">↗ Buka</span>
             </a>`;
        return `<div class="detail-item" style="flex-direction:column;gap:6px">
          <span class="detail-label">${escapeHtml(label)}</span>
   if (page === 'tambah') {
    await loadPenanggungJawabDropdown();       ${preview}
        </div>`;
      });
    if (items.length) {
      dokGrid.innerHTML = items.join('');
      dokSection.style.display = 'block';
    }
  }

  // Penanggung Jawab   if (data.penanggung_jawab_id) {     // Fetch nama penanggung jawab     db.from('penanggung_jawab').select('nama, jabatan').eq('id', data.penanggung_jawab_id).single()       .then(({ data: pj }) => {         if (pj) {           set('d-penanggung_jawab', pj.nama);           set('d-pj-jabatan', pj.jabatan);         }       }).catch(() => {});   } else if (data.nama_penanggung_jawab) {     set('d-penanggung_jawab', data.nama_penanggung_jawab);   }   $('detail-content').style.display = 'block';
}

// ============================================
// PENANGGUNG JAWAB DROPDOWN
// ============================================
async function loadPenanggungJawabDropdown(selectedId = null) {
  const sel = $('penanggung_jawab_id');
  if (!sel) return;
  try {
    const { data, error } = await db.from('penanggung_jawab')
      .select('id, nama, jabatan, unit_kerja')
      .eq('aktif', true)
      .order('nama', { ascending: true });
    if (error) throw error;
    sel.innerHTML = '<option value="">— Pilih Penanggung Jawab —</option>';
    (data || []).forEach(pj => {
      const opt = document.createElement('option');
      opt.value = pj.id;
      opt.textContent = pj.nama + (pj.jabatan ? ' — ' + pj.jabatan : '');
      if (String(pj.id) === String(selectedId)) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.warn('loadPenanggungJawabDropdown error:', err.message);
  }
}
// ============================================
// INIT PER HALAMAN
// ============================================

// ============================================
// PEMINDAHTANGANAN
// ============================================
async function initPemindahtangananPage() {
  // Cache semua PJ untuk lookup nama
  let allPJ = [];
  let allAset = [];

    async function loadMasterData() {
      try {
        const [resPJ, resAset] = await Promise.all([
                    db.from('penanggung_jawab').select('id, nama, jabatan').neq('aktif', false).order('nama'),
          db.from('aset').select('id, nama_barang, kode_barang').order('nama_barang'),
        ]);
        if (resPJ.error) throw new Error('Gagal load PJ: ' + resPJ.error.message);
        if (resAset.error) throw new Error('Gagal load aset: ' + resAset.error.message);
        allPJ    = resPJ.data  || [];
        allAset  = resAset.data || [];
      } catch (err) {
        console.error('[loadMasterData]', err);
        showAlert('Gagal memuat data master: ' + err.message, 'error');
      }
    }
  function getNamaPJ(id) {
    if (!id) return '— Tidak ada —';
    const pj = allPJ.find(p => p.id === id);
    return pj ? pj.nama + (pj.jabatan ? ' — ' + pj.jabatan : '') : id;
  }

  function getNamaAset(id) {
    const a = allAset.find(a => a.id === id);
    return a ? a.nama_barang + (a.kode_barang ? ' (' + a.kode_barang + ')' : '') : id;
  }

  function populateDropdowns() {
    // Dropdown barang di form
    const selBarang = $('pt-barang-id');
    const filterBarang = $('filter-pt-barang');
    allAset.forEach(a => {
      const label = a.nama_barang + (a.kode_barang ? ' (' + a.kode_barang + ')' : '');
      [selBarang, filterBarang].forEach(sel => {
        if (!sel) return;
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = label;
        sel.appendChild(opt);
      });
    });

    // Dropdown PJ baru di form
    const selKePJ = $('pt-ke-pj-id');
    const filterPJ = $('filter-pt-pj');
    allPJ.forEach(pj => {
      const label = pj.nama + (pj.jabatan ? ' — ' + pj.jabatan : '');
      [selKePJ, filterPJ].forEach(sel => {
        if (!sel) return;
        const opt = document.createElement('option');
        opt.value = pj.id;
        opt.textContent = label;
        sel.appendChild(opt);
      });
    });
  }

  async function loadRiwayat() {
    showLoading(true);
    try {
      let q = db.from('pemindahtanganan').select('*').order('tanggal', { ascending: false });
      const fBarang = $('filter-pt-barang')?.value;
      const fPJ     = $('filter-pt-pj')?.value;
      if (fBarang) q = q.eq('barang_id', fBarang);
      if (fPJ)     q = q.or(`dari_pj_id.eq.${fPJ},ke_pj_id.eq.${fPJ}`);
      const { data, error } = await q;
      if (error) throw error;
      renderRiwayat(data || []);
    } catch (err) {
      showAlert('Gagal memuat riwayat: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function renderRiwayat(data) {
    const tbody = $('pt-tbody');
    if (!tbody) return;
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8">📢 Belum ada data pemindahtanganan.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map((row, i) => `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:10px 12px;font-size:13px">${i + 1}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:500">${escapeHtml(getNamaAset(row.barang_id))}</td>
        <td style="padding:10px 12px;font-size:13px;color:#64748b">${escapeHtml(getNamaPJ(row.dari_pj_id))}</td>
        <td style="padding:10px 12px;font-size:13px;color:#166534;font-weight:500">${escapeHtml(getNamaPJ(row.ke_pj_id))}</td>
        <td style="padding:10px 12px;font-size:13px">${row.tanggal || '—'}</td>
        <td style="padding:10px 12px;font-size:12px;color:#64748b;font-family:monospace">${escapeHtml(row.no_dokumen || '—')}</td>
        <td style="padding:10px 12px">
          ${row.dokumen_url ? `<a href="${escapeHtml(row.dokumen_url)}" target="_blank" rel="noopener"
            style="font-size:12px;color:#1d4ed8">📄 Dok</a>&nbsp;` : ''}
          <button onclick="hapusPT('${row.id}')"
            style="padding:3px 8px;font-size:12px;background:#fef2f2;border:1px solid #fecaca;
            border-radius:6px;cursor:pointer;color:#dc2626">🗑️ Hapus</button>
        </td>
      </tr>
    `).join('');
  }

  async function simpanPT() {
    const barangId = $('pt-barang-id')?.value;
    const dariPjId = $('pt-dari-pj-id')?.value || null;
    const kePjId   = $('pt-ke-pj-id')?.value;
    const tanggal  = $('pt-tanggal')?.value;
    if (!barangId) { showAlert('Pilih barang terlebih dahulu!', 'error'); return; }
    if (!kePjId)   { showAlert('Pilih penanggung jawab baru!', 'error'); return; }
    if (!tanggal)  { showAlert('Tanggal wajib diisi!', 'error'); return; }
    if (dariPjId && dariPjId === kePjId) {
      showAlert('Penanggung jawab baru harus berbeda dengan yang lama!', 'error'); return;
    }
    showLoading(true);
    try {
      // Upload dokumen jika ada
      let dokumenUrl = null;
      const dokFile = $('pt-dokumen-file')?.files?.[0];
      if (dokFile) {
        if (dokFile.size > 5 * 1024 * 1024) {
          showAlert('Ukuran file melebihi 5 MB!', 'error'); return;
        }
        dokumenUrl = await uploadDokumen(dokFile, 'pemindahtanganan');
      }
      // Insert riwayat
      const payload = {
        barang_id:   barangId,
        dari_pj_id:  dariPjId || null,
        ke_pj_id:    kePjId,
        tanggal,
        no_dokumen:  $('pt-no-dokumen')?.value.trim() || null,
        keterangan:  $('pt-keterangan')?.value.trim() || null,
        dokumen_url: dokumenUrl,
      };
      const { error: errInsert } = await db.from('pemindahtanganan').insert(payload);
      if (errInsert) throw errInsert;
      // Update penanggung_jawab_id di tabel aset
      const { error: errUpdate } = await db.from('aset')
        .update({ penanggung_jawab_id: kePjId })
        .eq('id', barangId);
      if (errUpdate) throw errUpdate;
      showAlert('Pemindahtanganan berhasil dicatat! Penanggung jawab barang diperbarui.');
      resetFormPT();
      await loadRiwayat();
    } catch (err) {
      showAlert('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  window.hapusPT = async (id) => {
    if (!confirm('Yakin hapus riwayat pemindahtanganan ini?\n\nCatatan: penanggung jawab barang TIDAK akan dikembalikan ke PJ lama.')) return;
    showLoading(true);
    try {
      const { error } = await db.from('pemindahtanganan').delete().eq('id', id);
      if (error) throw error;
      showAlert('Riwayat berhasil dihapus.');
      await loadRiwayat();
    } catch (err) {
      showAlert('Gagal menghapus: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  };

  function resetFormPT() {
    ['pt-barang-id','pt-ke-pj-id','pt-tanggal','pt-no-dokumen'].forEach(id => {
      const el = $(id); if (el) el.value = '';
    });
    const ket = $('pt-keterangan'); if (ket) ket.value = '';
    const pjDisplay = $('pt-pj-lama-display'); if (pjDisplay) pjDisplay.value = '';
    const pjHidden = $('pt-dari-pj-id'); if (pjHidden) pjHidden.value = '';
    const dokFile = $('pt-dokumen-file'); if (dokFile) dokFile.value = '';
  }

  // Ketika barang dipilih: tampilkan PJ lama otomatis
  $('pt-barang-id')?.addEventListener('change', async function () {
    const barangId = this.value;
    if (!barangId) {
      if ($('pt-pj-lama-display')) $('pt-pj-lama-display').value = '';
      if ($('pt-dari-pj-id')) $('pt-dari-pj-id').value = '';
      return;
    }
    try {
      const { data } = await db.from('aset')
        .select('penanggung_jawab_id, nama_penanggung_jawab')
        .eq('id', barangId).single();
      const pjId = data?.penanggung_jawab_id;
      if ($('pt-dari-pj-id')) $('pt-dari-pj-id').value = pjId || '';
      if ($('pt-pj-lama-display')) {
        $('pt-pj-lama-display').value = pjId ? getNamaPJ(pjId) : (data?.nama_penanggung_jawab || '— Belum ada PJ —');
      }
    } catch (_) {}
  });

  // Filter listener
  $('filter-pt-barang')?.addEventListener('change', loadRiwayat);
  $('filter-pt-pj')?.addEventListener('change', loadRiwayat);
  $('btn-simpan-pt')?.addEventListener('click', simpanPT);
  $('btn-batal-pt')?.addEventListener('click', resetFormPT);

  // Set default tanggal hari ini
  const tgl = $('pt-tanggal');
  if (tgl) tgl.value = new Date().toISOString().split('T')[0];

  // Init
  showLoading(true);
  await loadMasterData();
  populateDropdowns();
  await loadRiwayat();
  showLoading(false);
}

(async () => {
  const ready = await window._appReady;
  if (!ready) return;

  db = window._authClient;

  const page = document.body.dataset.page;

  if (page === 'index') {
    initFilter();
    await loadAset();
  }

  if (page === 'tambah') {
        await loadPenanggungJawabDropdown();
    $('kib')?.addEventListener('change', toggleKIBFields);
    initHargaFormat();
    initFotoUpload();
    initDokumenUpload();
    toggleKIBFields();
    $('btn-simpan')?.addEventListener('click', () => simpanAset(false));
  }

  if (page === 'edit') {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { window.location.href = 'index.html'; return; }
    showLoading(true);
    try {
      const data = await loadAsetById(id);
      fillForm(data);
              initHargaFormat();
      initFotoUpload(data.foto_url);
      initDokumenPreview(data);
              await loadPenanggungJawabDropdown(data.penanggung_jawab_id);
      $('kib')?.addEventListener('change', toggleKIBFields);
      $('btn-simpan')?.addEventListener('click', () => simpanAset(true, id));
    } catch {
      showAlert('Data tidak ditemukan', 'error');
    } finally {
      showLoading(false);
    }
  }

if (page === 'detail') {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { window.location.href = 'index.html'; return; }
    showLoading(true);
    try {
      const data = await loadAsetById(id);
      renderDetail(data);
    } catch {
      $('detail-error').style.display = 'block';
    } finally {
      showLoading(false);
    }
}                                         // ← tutup if detail di sini

if (page === 'pemindahtanganan') {        // ← sejajar, bukan di dalam
    await initPemindahtangananPage();
}
)();
