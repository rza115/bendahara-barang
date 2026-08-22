// ============================================
// features/trash/trash-view.js
// Render daftar aset yang berada di Trash
// ============================================

function formatTrashDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function renderTrashTable(data) {
  const tbody = document.getElementById('trash-tbody');
  const count = document.getElementById('trash-count');
  if (count) count.textContent = data.length;
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div><span class="material-symbols-rounded" aria-hidden="true">delete_sweep</span></div>
          <p>Trash masih kosong. <a href="index.html">Kembali ke daftar aset</a></p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data.map((row, index) => `
    <tr>
      <td class="td-no">${index + 1}</td>
      <td>
        <div class="nama-barang">${escapeHtml(row.nama_barang)}</div>
        ${row.kode_barang ? `<div class="kode-info">${escapeHtml(row.kode_barang)}</div>` : ''}
      </td>
      <td>
        ${row.kib
          ? `<span class="kib-badge kib-${row.kib.replace(/ /g, '-').toLowerCase()}">${escapeHtml(row.kib)}</span>`
          : '-'}
      </td>
      <td>${row.tahun_perolehan || '-'}</td>
      <td>${escapeHtml(row.lokasi) || '-'}</td>
      <td class="trash-date">${formatTrashDate(row.deleted_at)}</td>
      <td class="td-action trash-actions">
        <button class="table-action success" data-action="restore" data-id="${row.id}"
          data-name="${escapeHtml(row.nama_barang)}" title="Pulihkan aset">
          <span class="material-symbols-rounded" aria-hidden="true">restore_from_trash</span>Restore
        </button>
        <button class="table-action danger" data-action="permanent-delete" data-id="${row.id}"
          data-name="${escapeHtml(row.nama_barang)}" title="Hapus permanen">
          <span class="material-symbols-rounded" aria-hidden="true">delete_forever</span>Hapus Permanen
        </button>
      </td>
    </tr>`).join('');
}

