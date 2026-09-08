function groupAsetByLokasi(locations, assets) {
  const groups = locations.map(location => ({ ...location, assets: [] }));
  const byName = new Map(groups.map(group => [normalizeLokasi(group.nama).toLowerCase(), group]));
  const unassigned = { id: 'unassigned', nama: 'Belum ditentukan', assets: [] };
  assets.forEach(asset => {
    const group = byName.get(normalizeLokasi(asset.lokasi).toLowerCase());
    (group || unassigned).assets.push(asset);
  });
  return [...groups, unassigned];
}

function renderMasterLokasi(groups) {
  const tbody = document.getElementById('lokasi-tbody');
  const locations = groups.filter(group => group.id !== 'unassigned');
  tbody.innerHTML = locations.length ? locations.map(location => `
    <tr>
      <td><strong>${escapeHtml(location.nama)}</strong></td>
      <td>${escapeHtml(location.gedung) || '-'}</td><td>${location.assets.length}</td>
      <td><div class="lokasi-actions">
        <button type="button" class="btn btn-secondary btn-sm" data-lokasi-action="view" data-id="${escapeHtml(location.id)}">Kartu</button>
        <button type="button" class="btn btn-secondary btn-sm" data-lokasi-action="edit" data-id="${escapeHtml(location.id)}">Edit</button>
        <button type="button" class="btn btn-danger btn-sm" data-lokasi-action="delete" data-id="${escapeHtml(location.id)}">Hapus</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="4">Belum ada lokasi. Tambahkan ruangan pertama melalui formulir.</td></tr>';
}

function renderKartuRuangan(groups, selected) {
  const visible = selected === 'all'
    ? groups.filter(group => group.id !== 'unassigned' || group.assets.length)
    : groups.filter(group => group.id === selected);
  const text = value => escapeHtml(value == null || value === '' ? '-' : String(value));
  document.getElementById('kir-cards').innerHTML = visible.length ? visible.map(group => {
    const units = group.assets.reduce((sum, asset) => sum + (Number(asset.jumlah ?? 1) || 0), 0);
    const total = group.assets.reduce((sum, asset) => sum + (Number(asset.harga) || 0), 0);
    return `<article class="kir-card">
      <header class="kir-header"><p>Dinas Kebudayaan</p><h2>KARTU INVENTARIS RUANGAN</h2><h3>${text(group.nama)}</h3>
        ${group.gedung ? `<p>${text(group.gedung)}</p>` : ''}
        ${group.keterangan ? `<p>${text(group.keterangan)}</p>` : ''}
      </header>
      <div class="kir-summary"><span>${group.assets.length} data aset · ${units} unit</span><span>Total nilai: ${formatRupiah(total)}</span></div>
      <div class="table-wrap"><table class="kir-table">
        <thead><tr><th>No</th><th>Nama Barang</th><th>Kode / ID / Register</th><th>Merk / Tipe</th><th>Tahun</th><th>Jumlah</th><th>Nilai Perolehan</th><th>Kondisi</th><th>Keterangan</th><th class="kir-no-print">Aksi</th></tr></thead>
        <tbody>${group.assets.length ? group.assets.map((asset, i) => `<tr>
          <td>${i + 1}</td><td>${text(asset.nama_barang)}</td>
          <td>${text(asset.kode_barang)}<br>ID: ${text(asset.id_barang)}<br>Reg: ${text(asset.no_register)}</td>
          <td>${text(asset.merk_type)}</td><td>${text(asset.tahun_perolehan)}</td><td>${text(asset.jumlah ?? 1)}</td>
          <td>${formatRupiah(asset.harga)}</td><td>${text(asset.kondisi)}</td><td>${text(asset.keterangan)}</td>
          <td class="kir-no-print"><a href="edit.html?id=${encodeURIComponent(asset.id)}" class="btn btn-secondary btn-sm">Edit aset</a></td>
        </tr>`).join('') : '<tr><td colspan="10">Belum ada aset di ruangan ini.</td></tr>'}</tbody>
      </table></div>
      <footer class="kir-footer"><p>Dicetak / diperbarui: ${new Date().toLocaleDateString('id-ID')}</p>
        <div class="kir-signatures"><div>Pengurus Barang<br><br><br><br>(........................................)</div><div>Penanggung Jawab Ruangan<br><br><br><br>(........................................)</div></div>
      </footer>
    </article>`;
  }).join('') : '<div class="empty-state"><p>Tambahkan lokasi untuk mulai membuat kartu inventaris ruangan.</p></div>';
  document.getElementById('kir-print').disabled = !visible.length;
}
