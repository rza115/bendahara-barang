// ============================================
// features/aset-detail/aset-detail-page.js
// Controller halaman detail aset
// ============================================

async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    showAlert('ID aset tidak ditemukan.', 'error');
    return;
  }

  showLoading(true);
  try {
    const data = await fetchAsetById(id);
    renderDetail(data);
  } catch (err) {
    showAlert('Gagal memuat data aset: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}
