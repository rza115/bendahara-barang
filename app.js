// ============================================
// app.js — Logika Supabase CRUD
// ============================================

// JANGAN inisialisasi db di sini — tunggu auth guard selesai dulu
let db = null;

// FOTO BARANG - Upload ke Supabase Storage
let _fotoHapus = false;

async function uploadFoto(file) {
  const ext = file.name.split('.').pop();
  const fileName = `barang_${Date.now()}.${ext}`;
  const { data, error } = await db.storage
    .from('foto-barang')
    .upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = db.storage.from('foto-barang').getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function hapusFotoStorage(url) {
  if (!url) return;
  try {
    const path = url.split('/foto-barang/')[1];
    if (path) await db.storage.from('foto-barang').remove([path]);
  } catch (_) {}
}

function initFotoUpload(existingUrl = null) {
  const fileInput = document.getElementById('foto_file');
  const previewWrap = document.getElementById('foto-preview-wrap');
  const previewImg = document.getElementById('foto-preview');
  const existingWrap = document.getElementById('foto-existing-wrap');
  const existingImg = document.getElementById('foto-existing');
  const btnHapus = document.getElementById('btn-hapus-foto');
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
      if (previewImg) previewImg.src = e.target.result;
      if (previewWrap) previewWrap.style.display = 'block';
      if (existingWrap) existingWrap.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  btnHapus?.addEventListener('click', function () {
    _fotoHapus = true;
    if (existingWrap) existingWrap.style.display = 'none';
    if (previewWrap) previewWrap.style.display = 'none';
    if (fileInput) fileInput.value = '';
  });
}

// DOKUMEN PENGADAAN - Upload ke Supabase Storage
const _uploadedDokumen = {};

async function uploadDokumen(file, jenisDok) {
  const ext = file.name.split('.').pop();
  const fileName = `${jenisDok}_${Date.now()}.${ext}`;
  const { data, error } = await db.storage
    .from('dokumen-pengadaan')
    .upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = db.storage.from('dokumen-pengadaan').getPublicUrl(fileName);
  return urlData.publicUrl;
}

function initDokumenUpload() {
  const dokInputs = [
        { id: 'dok_spk_file', key: 'dok_spk_url' },
    { id: 'dok_penawaran_file', key: 'dok_penawaran_url' },
        { id: 'dok_baphp_file', key: 'dok_baphp_url' },
    { id: 'dok_bast_file', key: 'dok_bast_url' },
    { id: 'dok_kuitansi_file', key: 'dok_kuitansi_url' }
  ];
  dokInputs.forEach(({ id, key }) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('change', function() {
      const file = this.files[0];
      if (!file) return;
      
      // Validasi ukuran (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Ukuran file melebihi 5 MB!', 'error');
        this.value = '';
        return;
      }
      
      // Simpan file untuk diupload nanti saat save
      _uploadedDokumen[key] = file;
    });
}



// ============================================
// UTILITY
// ============================================

function formatRupiah(angka) {
  if (!angka && angka !== 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka);
}

// FIX: Escape HTML untuk mencegah XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showAlert(msg, type = 'success') {
  const el = document.getElementById('alert-box');
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function showLoading(show = true) {
  const el = document.getElementById('loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function getKIBLabel(kib) {
  const map = {
    'KIB A': '🏞️ KIB A – Tanah',
    'KIB B': '⚙️ KIB B – Peralatan & Mesin',
    'KIB C': '🏢 KIB C – Gedung & Bangunan',
    'KIB E': '📦 KIB E – Aset Tetap Lainnya'
  };
  return map[kib] || kib;
}

function getKondisiBadge(kondisi) {
  const map = {
    'Baik': 'badge-baik',
    'Rusak Ringan': 'badge-rusak-ringan',
    'Rusak Berat': 'badge-rusak-berat'
  };
  return map[kondisi] || 'badge-baik';
}

// FIX: Simpan filter aktif agar bisa dipakai ulang saat hapus
let activeFilter = {};

// ============================================
// INDEX PAGE — DAFTAR ASET
// ============================================

async function loadAset(filter = {}) {
  activeFilter = filter;
  showLoading(true);
  try {
    let query = db.from('aset').select('*');
    if (filter.kib) query = query.eq('kib', filter.kib);
    if (filter.kondisi) query = query.eq('kondisi', filter.kondisi);
    if (filter.search) query = query.ilike('nama_barang', `%${filter.search}%`);
    
    if (!filter.sort) {
      query = query.order('kib').order('nama_barang');
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Client-side sort
    if (filter.sort && data) {
      const sortMap = {
        'terbaru': (a, b) => (b.tahun_perolehan || 0) - (a.tahun_perolehan || 0),
        'terlama': (a, b) => (a.tahun_perolehan || 0) - (b.tahun_perolehan || 0),
        'harga-tertinggi': (a, b) => (b.harga || 0) - (a.harga || 0),
        'harga-terendah': (a, b) => (a.harga || 0) - (b.harga || 0),
        'nama-az': (a, b) => a.nama_barang.localeCompare(b.nama_barang, 'id'),
        'nama-za': (a, b) => b.nama_barang.localeCompare(a.nama_barang, 'id'),
      };
      if (sortMap[filter.sort]) data.sort(sortMap[filter.sort]);
    }
    
    // ← TAMBAHKAN KODE LIMIT DI SINI (setelah sort, sebelum renderTable)
    // Apply limit
    let displayData = data;
    if (filter.limit && filter.limit !== 'all' && data) {
      const limit = parseInt(filter.limit);
      displayData = data.slice(0, limit);
    }
    
    renderTable(displayData);  // ← Ganti dari renderTable(data) ke renderTable(displayData)
    updateSummary(data);  // ← Summary tetap menggunakan data lengkap
    
  } catch (err) {
    showAlert('Gagal memuat data: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

function renderTable(data) {
  const tbody = document.getElementById('aset-tbody');
  if (!tbody) return;
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">
      <div>📭</div>
      <p>Belum ada data aset. <a href="tambah.html">Tambah aset pertama</a></p>
      </td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((row, i) => `
    <tr>
      <td class="td-no">${i + 1}</td>
      <td>
        ${row.foto_url ? `<img src="${escapeHtml(row.foto_url)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;">` : ''}
        <div class="nama-barang">${escapeHtml(row.nama_barang)}</div>
        ${row.merk_type ? `<div class="sub-info">${escapeHtml(row.merk_type)}</div>` : ''}
        ${row.kode_barang ? `<div class="kode-info">${escapeHtml(row.kode_barang)}</div>` : ''}
      </td>
      <td><span class="kib-badge kib-${row.kib.replace(' ', '-').toLowerCase()}">${escapeHtml(row.kib)}</span></td>
      <td>${row.tahun_perolehan || '-'}</td>
      <td class="td-harga">${formatRupiah(row.harga)}</td>
      <td>${row.kondisi ? `<span class="badge ${getKondisiBadge(row.kondisi)}">${escapeHtml(row.kondisi)}</span>` : '-'}</td>
      <td>${escapeHtml(row.lokasi || row.penggunaan || '-')}</td>
      <td class="td-action">
        <a href="edit.html?id=${row.id}" class="btn-edit" title="Edit">✏️</a>
        <button class="btn-hapus" data-id="${row.id}" data-nama="${escapeHtml(row.nama_barang)}" title="Hapus">🗑️</button>
      </td>
    </tr>
  `).join('');
  tbody.onclick = (e) => {
    const btn = e.target.closest('.btn-hapus');
    if (!btn) return;
    hapusAset(btn.dataset.id, btn.dataset.nama);
  };
}

function updateSummary(data) {
  if (!data) return;
  const total = data.length;
  const totalNilai = data.reduce((s, r) => s + (parseInt(r.harga) || 0), 0);
  const perKIB = { 'KIB A': 0, 'KIB B': 0, 'KIB C': 0, 'KIB E': 0 };
  data.forEach(r => { if (perKIB[r.kib] !== undefined) perKIB[r.kib]++; });

  const el = id => document.getElementById(id);
  if (el('total-aset')) el('total-aset').textContent = total;
  if (el('total-nilai')) el('total-nilai').textContent = formatRupiah(totalNilai);
  if (el('total-kib-a')) el('total-kib-a').textContent = perKIB['KIB A'];
  if (el('total-kib-b')) el('total-kib-b').textContent = perKIB['KIB B'];
  if (el('total-kib-c')) el('total-kib-c').textContent = perKIB['KIB C'];
  if (el('total-kib-e')) el('total-kib-e').textContent = perKIB['KIB E'];
}

async function hapusAset(id, nama) {
  if (!confirm(`Yakin hapus aset "${nama}"?\n\nTindakan ini tidak bisa dibatalkan.`)) return;
  showLoading(true);
  try {
    const { error } = await db.from('aset').delete().eq('id', id);
    if (error) throw error;
    showAlert(`Aset "${nama}" berhasil dihapus.`);
    // FIX: Pertahankan filter aktif setelah hapus
    loadAset(activeFilter);
  } catch (err) {
    showAlert('Gagal menghapus: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

// Filter & Search
function initFilter() {
  const filterKIB = document.getElementById('filter-kib');
  const filterKondisi = document.getElementById('filter-kondisi');
  const searchInput = document.getElementById('search-input');
  const sortBy = document.getElementById('sort-by');

function applyFilter() {
  const limitRowsSelect = document.getElementById('limit-rows');
  loadAset({
    kib: filterKIB?.value || '',
    kondisi: filterKondisi?.value || '',
    search: searchInput?.value || '',
    sort: sortBy?.value || '',
    limit: limitRowsSelect?.value || 'all'  // ← TAMBAHKAN INI
  });
}

  filterKIB?.addEventListener('change', applyFilter);
  filterKondisi?.addEventListener('change', applyFilter);
  sortBy?.addEventListener('change', applyFilter);

  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilter, 400);
  });
    
  // Event listener untuk limit rows
  const limitRowsSelect = document.getElementById('limit-rows');
  if (limitRowsSelect) {
    limitRowsSelect.addEventListener('change', applyFilter);
  }
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
    'tgl_buku', 'no_bast', 'tgl_bast', 'id_penerimaan',
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
    const el = document.getElementById(f);
    if (!el || data[f] == null) return;
    if (el.tagName === 'SELECT') {
      // FIX: coba set by value dulu, jika gagal (tidak ada option yg cocok)
      // cari option berdasarkan teks (untuk option tanpa value= eksplisit)
      el.value = data[f];
      if (el.value !== String(data[f])) {
        const opt = Array.from(el.options).find(o => o.text === String(data[f]));
        if (opt) el.value = opt.value;
      }
    } else {
      el.value = data[f];
    }
  });

  // FIX: Format harga ke Rupiah saat mengisi form edit
  const hargaEl = document.getElementById('harga');
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
    'no_bast', 'id_penerimaan',
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
    'spesifikasi', 'penerbit', 'judul_koleksi',
    'asal_daerah', 'bahan_aset', 'jenis_aset', 'ukuran_aset',
  ];
  const result = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) result[f] = el.value.trim() || null;
  });

  // Angka
  const hargaEl = document.getElementById('harga');
  const jumlahEl = document.getElementById('jumlah');
  const tahunEl = document.getElementById('tahun_perolehan');
  const luasEl = document.getElementById('luas_tanah');
  const luasLantaiEl = document.getElementById('luas_lantai');
  const jumlahLantaiEl = document.getElementById('jumlah_lantai');
  const tahunTanahEl = document.getElementById('tahun_perolehan_tanah');
  const tahunCetakEl = document.getElementById('tahun_cetak');
  if (hargaEl) result.harga = parseInt(hargaEl.value.replace(/\D/g, '')) || 0;
  if (jumlahEl) result.jumlah = parseInt(jumlahEl.value) || 1;
  if (tahunEl) result.tahun_perolehan = parseInt(tahunEl.value) || null;
  if (luasEl) result.luas_tanah = parseFloat(luasEl.value) || null;
  if (luasLantaiEl) result.luas_lantai = parseFloat(luasLantaiEl.value) || null;
  if (jumlahLantaiEl) result.jumlah_lantai = parseInt(jumlahLantaiEl.value) || null;
  if (tahunTanahEl) result.tahun_perolehan_tanah = parseInt(tahunTanahEl.value) || null;
  if (tahunCetakEl) result.tahun_cetak = parseInt(tahunCetakEl.value) || null;

  // Tanggal
  ['tgl_buku', 'tgl_bast', 'tgl_imb', 'tgl_sertifikat'].forEach(f => {
    const el = document.getElementById(f);
    result[f] = el?.value || null;
  });

  return result;
}

async function simpanAset(isEdit = false, id = null) {
  const data = getFormData();
  
  if (!data.nama_barang) {
    showAlert('Nama barang wajib diisi!', 'error');
    return;
  }
  if (!data.kib) {
    showAlert('Kategori KIB wajib dipilih!', 'error');
    return;
  }

  showLoading(true);
  try {
    const fotoInput = document.getElementById('foto_file');
    const fotoFile = fotoInput?.files?.[0];
    
    if (fotoFile) {
      try {
        data.foto_url = await uploadFoto(fotoFile);
      } catch (err) {
        showAlert('Gagal upload foto: ' + err.message, 'error');
        showLoading(false);
        return;
      }
    } else if (isEdit && _fotoHapus) {
      const existingImg = document.getElementById('foto-existing');
      if (existingImg?.src) await hapusFotoStorage(existingImg.src);
      data.foto_url = null;
    }

        // Upload dokumen pengadaan
    for (const [key, file] of Object.entries(_uploadedDokumen)) {
      if (file) {
        try {
          const jenisDok = key.replace('_url', '');
          data[key] = await uploadDokumen(file, jenisDok);
        } catch (err) {
          showAlert('Gagal upload dokumen: ' + err.message, 'error');
          showLoading(false);
          return;
        }
      }
    }

    let error;
    if (isEdit && id) {
      ({ error } = await db.from('aset').update(data).eq('id', id));
    } else {
      ({ error } = await db.from('aset').insert(data));
    }
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

// Format harga otomatis saat input
function initHargaFormat() {
  const hargaEl = document.getElementById('harga');
  if (!hargaEl) return;
  hargaEl.addEventListener('input', function () {
    const val = this.value.replace(/\D/g, '');
    this.value = val ? parseInt(val).toLocaleString('id-ID') : '';
  });
}

// ============================================
// INIT PER HALAMAN
// ============================================

// Tunggu auth guard selesai, baru init halaman
(async () => {
  const ready = await window._appReady;
  if (!ready) return; // redirect ke login sudah terjadi

  // FIX: db diambil SETELAH _appReady selesai — window._authClient sudah pasti ada
  db = window._authClient;
  console.log('[app.js] db ready:', !!db);

  const page = document.body.dataset.page;
  console.log('[app.js] Page:', page);

  if (page === 'index') {
    console.log('[app.js] Calling initFilter + loadAset...');
    initFilter();
    await loadAset();
    console.log('[app.js] loadAset() done');
  }

// Page: tambah
if (page === 'tambah') {
  document.getElementById('kib')?.addEventListener('change', toggleKIBFields);
  initHargaFormat();
  initFotoUpload(); // ← TAMBAHKAN INI
  toggleKIBFields();
  document.getElementById('btn-simpan')?.addEventListener('click', () => simpanAset(false));
}

    initDokumenUpload(); // ← TAMBAHKAN INI
// Page: edit
if (page === 'edit') {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = 'index.html'; return; }
  showLoading(true);
  try {
    const data = await loadAsetById(id);
    fillForm(data);
    initHargaFormat();
    initFotoUpload(data.foto_url); // ← TAMBAHKAN INI
        initDokumenUpload(); // ← TAMBAHKAN INI
    document.getElementById('kib')?.addEventListener('change', toggleKIBFields);
    document.getElementById('btn-simpan')?.addEventListener('click', () => simpanAset(true, id));
  } catch (err) {
    showAlert('Data tidak ditemukan', 'error');
  } finally {
    showLoading(false);
  }
}
})();
