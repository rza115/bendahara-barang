async function initLokasiPage() {
  const form = document.getElementById('lokasi-form');
  const select = document.getElementById('kir-lokasi');
  const save = document.getElementById('lokasi-save');
  const cancel = document.getElementById('lokasi-cancel');
  const errorBox = document.getElementById('lokasi-error');
  let groups = [];
  let editingId = null;
  let busy = false;
  let loaded = false;

  function resetForm() {
    editingId = null;
    form.reset();
    cancel.hidden = true;
    document.getElementById('lokasi-form-title').textContent = 'Tambah lokasi';
  }

  function showError(error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }

  async function reload() {
    loaded = false;
    save.disabled = true;
    select.disabled = true;
    document.getElementById('kir-print').disabled = true;
    try {
      const [locations, assets] = await Promise.all([fetchMasterLokasi(), fetchAsetRuangan()]);
      groups = groupAsetByLokasi(locations, assets);
      const previous = select.value;
      select.replaceChildren(new Option('Semua ruangan', 'all'));
      groups.forEach(group => select.add(new Option(`${group.nama} (${group.assets.length} aset)`, group.id)));
      select.value = groups.some(group => group.id === previous) ? previous : 'all';
      renderMasterLokasi(groups);
      renderKartuRuangan(groups, select.value);
      errorBox.hidden = true;
      loaded = true;
      save.disabled = false;
      select.disabled = false;
    } catch (error) {
      groups = [];
      document.getElementById('lokasi-tbody').innerHTML = '<tr><td colspan="4">Data lokasi gagal dimuat. Klik Muat ulang untuk mencoba kembali.</td></tr>';
      document.getElementById('kir-cards').replaceChildren();
      showError(error);
    }
  }

  async function perform(action) {
    if (busy) return;
    busy = true;
    showLoading(true);
    try { await action(); }
    catch (error) { showError(error); }
    finally { busy = false; showLoading(false); }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!loaded) return;
    perform(async () => {
      save.disabled = true;
      try {
        await saveMasterLokasi(editingId, {
          nama: document.getElementById('lokasi-nama').value,
          gedung: document.getElementById('lokasi-gedung').value,
          keterangan: document.getElementById('lokasi-keterangan').value,
        });
        resetForm();
        showAlert('Lokasi berhasil disimpan.');
        await reload();
      } finally { save.disabled = !loaded; }
    });
  });
  cancel.addEventListener('click', () => { if (!busy) resetForm(); });
  select.addEventListener('change', () => renderKartuRuangan(groups, select.value));
  document.getElementById('kir-print').addEventListener('click', () => { if (loaded && !busy) window.print(); });
  document.getElementById('lokasi-refresh').addEventListener('click', () => perform(reload));
  document.getElementById('lokasi-tbody').addEventListener('click', event => {
    const button = event.target.closest('[data-lokasi-action]');
    if (!button || busy || !loaded) return;
    const location = groups.find(group => group.id === button.dataset.id);
    if (!location) return;
    if (button.dataset.lokasiAction === 'view') {
      select.value = location.id;
      renderKartuRuangan(groups, select.value);
      select.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (button.dataset.lokasiAction === 'edit') {
      editingId = location.id;
      document.getElementById('lokasi-nama').value = location.nama;
      document.getElementById('lokasi-gedung').value = location.gedung || '';
      document.getElementById('lokasi-keterangan').value = location.keterangan || '';
      document.getElementById('lokasi-form-title').textContent = 'Edit lokasi';
      cancel.hidden = false;
      document.getElementById('lokasi-nama').focus();
    } else if (button.dataset.lokasiAction === 'delete') {
      if (!confirm(`Hapus lokasi "${location.nama}"? Lokasi yang masih digunakan aset tidak dapat dihapus.`)) return;
      perform(async () => {
        await deleteMasterLokasi(location.id);
        if (editingId === location.id) resetForm();
        showAlert('Lokasi berhasil dihapus.');
        await reload();
      });
    }
  });
  await perform(reload);
}
