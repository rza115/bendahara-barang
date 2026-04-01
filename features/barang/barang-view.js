// ============================================
// features/barang/barang-view.js
// Render tabel daftar barang dan statistik ringkas
// ============================================

function renderTable(data) {
  const tbody = document.getElementById('aset-tbody');
  if (!tbody) return;

  if (!data?.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div>📭</div>
          <p>Belum ada data aset. <a href="tambah.html">Tambah aset pertama</a></p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data.map((row, i) => `
    <tr class="row-clickable" data-id="${row.id}" style="cursor:pointer" title="Klik untuk lihat detail">
      <td class="td-no">${i + 1}</td>
      <td>
        ${row.foto_url
          ? `<img src="${escapeHtml(row.foto_url)}" alt=""
              style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle">`
          : ''}
        <div class="nama-barang">${escapeHtml(row.nama_barang)}</div>
        ${row.merk_type   ? `<div class="sub-info">${escapeHtml(row.merk_type)}</div>`   : ''}
        ${row.kode_barang ? `<div class="kode-info">${escapeHtml(row.kode_barang)}</div>` : ''}
      </td>
      <td>
        <span class="kib-badge kib-${row.kib?.replace(/ /g, '-').toLowerCase()}">
          ${escapeHtml(row.kib)}
        </span>
      </td>
      <td>${row.tahun_perolehan || '-'}</td>
      <td class="td-harga">${formatRupiah(row.harga)}</td>
      <td>
        ${row.kondisi
          ? `<span class="badge ${getKondisiBadge(row.kondisi)}">${escapeHtml(row.kondisi)}</span>`
          : '-'}
      </td>
      <td>${escapeHtml(row.lokasi || row.penggunaan) || '-'}</td>
      <td class="td-action">
        <a href="detail.html?id=${row.id}" class="btn-edit" title="Detail"
           onclick="event.stopPropagation()">🔍</a>
        <a href="edit.html?id=${row.id}" class="btn-edit" title="Edit"
           onclick="event.stopPropagation()">✏️</a>
        <button class="btn-hapus"
          data-id="${row.id}"
          data-nama="${escapeHtml(row.nama_barang)}"
          title="Hapus"
          onclick="event.stopPropagation()">🗑️</button>
      </td>
    </tr>`).join('');

  tbody.onclick = e => {
    const btn = e.target.closest('.btn-hapus');
    if (btn) { hapusAsetHandler(btn.dataset.id, btn.dataset.nama); return; }
    const row = e.target.closest('.row-clickable');
    if (row) window.location.href = `detail.html?id=${row.dataset.id}`;
  };
}

function updateSummary(data) {
  if (!data) return;
  const totalNilai = data.reduce((s, r) => s + (parseInt(r.harga) || 0), 0);
  const perKIB = { 'KIB A': 0, 'KIB B': 0, 'KIB C': 0, 'KIB E': 0 };
  data.forEach(r => { if (r.kib in perKIB) perKIB[r.kib]++; });

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setText('total-aset',  data.length);
  setText('total-nilai', formatRupiah(totalNilai));
  setText('total-kib-a', perKIB['KIB A']);
  setText('total-kib-b', perKIB['KIB B']);
  setText('total-kib-c', perKIB['KIB C']);
  setText('total-kib-e', perKIB['KIB E']);
}
