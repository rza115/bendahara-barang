// ============================================
// features/barang/barang-page.js
// Controller halaman daftar barang (index)
// Menghubungkan: filter UI → service → state → view
// ============================================

async function loadAset(filter) {
  setActiveFilter(filter);
  showLoading(true);
  try {
    const [listData, summaryData] = await Promise.all([
      fetchDaftarAset(filter),
      fetchSummaryAset(filter),
    ]);
    renderTable(listData);
    updateSummary(summaryData);
  } catch (err) {
    showAlert('Gagal memuat data: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function hapusAsetHandler(id, nama) {
  if (!confirm(`Yakin hapus aset "${nama}"? Ini tidak bisa dibatalkan.`)) return;
  showLoading(true);
  try {
    await deleteAset(id);
    showAlert(`Aset "${nama}" berhasil dihapus.`);
    await loadAset(getActiveFilter());
  } catch (err) {
    showAlert('Gagal menghapus: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

function initBarangPage() {
  const filterKIB    = document.getElementById('filter-kib');
  const filterKondisi= document.getElementById('filter-kondisi');
  const searchInput  = document.getElementById('search-input');
  const sortBy       = document.getElementById('sort-by');
  const limitRows    = document.getElementById('limit-rows');

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

  // Load awal
  applyFilter();
}
