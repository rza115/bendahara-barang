// ============================================
// app.js — Logika Supabase CRUD
// Ganti SUPABASE_URL dan SUPABASE_KEY di bawah
// ============================================

const SUPABASE_URL = 'https://ibektroxjjibniwidmpk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_b-oL0WNdkqDjUFhepAkADw_uy9coRD6'; // anon public key

// Gunakan client bersama dari auth guard
const db = window._authClient || supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
  console.log('[loadAset] called, db:', !!db, 'filter:', filter);
  showLoading(true);
  try {
    let query = db.from('aset').select('*').order('kib').order('nama_barang');

    if (filter.kib) query = query.eq('kib', filter.kib);
    if (filter.kondisi) query = query.eq('kondisi', filter.kondisi);
    if (filter.search) query = query.ilike('nama_barang', `%${filter.search}%`);

    console.log('[loadAset] running query...');
    const { data, error } = await query;
    console.log('[loadAset] result:', { data, error });
    if (error) throw error;
    renderTable(data);
    updateSummary(data);
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
        <button onclick="hapusAset('${row.id}', '${escapeHtml(row.nama_barang)}')" class="btn-hapus" title="Hapus">🗑️</button>
      </td>
    </tr>
  `).join('');
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

  function applyFilter() {
    loadAset({
      kib: filterKIB?.value || '',
      kondisi: filterKondisi?.value || '',
      search: searchInput?.value || ''
    });
  }

  filterKIB?.addEventListener('change', applyFilter);
  filterKondisi?.addEventListener('change', applyFilter);

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
    if (el && data[f] != null) el.value = data[f];
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
  console.log('[app.js] Script loaded, db ready:', !!db);
  const page = document.body.dataset.page;
  console.log('[app.js] Page:', page);

  if (page === 'index') {
    console.log('[app.js] Calling initFilter + loadAset...');
    initFilter();
    await loadAset();
    console.log('[app.js] loadAset() done');
  }

  if (page === 'tambah') {
    document.getElementById('kib')?.addEventListener('change', toggleKIBFields);
    initHargaFormat();
    toggleKIBFields();
    document.getElementById('btn-simpan')?.addEventListener('click', () => simpanAset(false));
  }

  if (page === 'edit') {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { window.location.href = 'index.html'; return; }

    showLoading(true);
    try {
      const data = await loadAsetById(id);
      fillForm(data);
      initHargaFormat();
      document.getElementById('kib')?.addEventListener('change', toggleKIBFields);
      document.getElementById('btn-simpan')?.addEventListener('click', () => simpanAset(true, id));
    } catch (err) {
      showAlert('Data tidak ditemukan', 'error');
    } finally {
      showLoading(false);
    }
  }
});
