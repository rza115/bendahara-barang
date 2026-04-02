// features/aset-detail/aset-detail-page.js
async function initDetailPage() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    window.location.href = 'index.html';
    return;
  }
  showLoading(true);
  try {
    // Query langsung — tidak bergantung nama fungsi di barang-service.js
    const { data, error } = await db
      .from('aset')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) throw new Error('Data tidak ditemukan');
    renderDetail(data);
    renderDokumenDetail(data.id);
  } catch (err) {
    const errEl = document.getElementById('detail-error');
    if (errEl) errEl.style.display = 'block';
    showAlert('Gagal memuat data: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}
