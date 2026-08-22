// ============================================
// features/trash/trash-page.js
// Controller halaman Trash aset
// ============================================

function initTrashPage() {
  const searchInput = document.getElementById('trash-search');
  const limitRows = document.getElementById('trash-limit');
  const tbody = document.getElementById('trash-tbody');

  async function loadTrash() {
    showLoading(true);
    try {
      const data = await fetchTrashAset({
        search: searchInput?.value?.trim() || '',
        limit: limitRows?.value || '50',
      });
      renderTrashTable(data);
    } catch (err) {
      showAlert('Gagal memuat Trash: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function restore(id, nama) {
    if (!confirm(`Restore aset "${nama}" ke daftar aktif?`)) return;
    showLoading(true);
    try {
      await restoreTrashAset(id);
      showAlert(`Aset "${nama}" berhasil dipulihkan.`);
      await loadTrash();
    } catch (err) {
      showAlert('Gagal restore aset: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function permanentDelete(id, nama) {
    const confirmed = confirm(
      `Hapus permanen aset "${nama}"?\n\n` +
      'Seluruh riwayat dan dokumen terkait akan dihapus dan tidak dapat dipulihkan.'
    );
    if (!confirmed) return;

    showLoading(true);
    try {
      const warnings = await permanentlyDeleteTrashAset(id);
      if (warnings.length) {
        showAlert(
          `Aset "${nama}" terhapus permanen, tetapi sebagian file ${warnings.join(' dan ')} gagal dibersihkan.`,
          'error'
        );
      } else {
        showAlert(`Aset "${nama}" berhasil dihapus permanen.`);
      }
      await loadTrash();
    } catch (err) {
      showAlert('Gagal menghapus permanen: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  tbody?.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'restore') {
      restore(button.dataset.id, button.dataset.name);
    }
    if (button.dataset.action === 'permanent-delete') {
      permanentDelete(button.dataset.id, button.dataset.name);
    }
  });

  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadTrash, 350);
  });
  limitRows?.addEventListener('change', loadTrash);

  loadTrash();
}

