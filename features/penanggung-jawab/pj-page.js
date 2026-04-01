// features/penanggung-jawab/pj-page.js

let _editingPJId = null;

async function loadAndRenderPJ() {
  showLoading(true);
  try {
    const [listPJ, jumlahMap] = await Promise.all([fetchAllPJ(), fetchJumlahAsetPerPJ()]);
    renderPJTable(listPJ, jumlahMap);
  } catch (err) {
    showAlert('Gagal memuat data PJ: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

function renderPJTable(data, jumlahMap) {
  const tbody = document.getElementById('pj-tbody');
  if (!tbody) return;
  if (!data?.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8">
      Belum ada data penanggung jawab.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((pj, i) => `
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:10px 12px;font-size:13px">${i + 1}</td>
      <td style="padding:10px 12px;font-size:13px;font-weight:600">${escapeHtml(pj.nama)}</td>
      <td style="padding:10px 12px;font-size:13px;color:var(--text-muted)">${escapeHtml(pj.nip || '—')}</td>
      <td style="padding:10px 12px;font-size:13px">${escapeHtml(pj.jabatan || '—')}</td>
      <td style="padding:10px 12px;font-size:13px">${escapeHtml(pj.unit_kerja || '—')}</td>
      <td style="padding:10px 12px;font-size:13px">
        <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;
          padding:2px 10px;border-radius:999px;font-weight:600;
          background:${(jumlahMap[pj.id]||0)>0?'#f0fdf4':'#f8fafc'};
          color:${(jumlahMap[pj.id]||0)>0?'#166534':'#94a3b8'}">
          ${jumlahMap[pj.id] || 0} aset
        </span>
      </td>
      <td style="padding:10px 12px">
        <button onclick="editPJ('${pj.id}')" 
          style="padding:3px 10px;font-size:12px;background:#eff6ff;border:1px solid #bfdbfe;
                 border-radius:6px;cursor:pointer;color:#1d4ed8;margin-right:4px">✏️ Edit</button>
        <button onclick="hapusPJHandler('${pj.id}','${escapeHtml(pj.nama)}')"
          style="padding:3px 10px;font-size:12px;background:#fef2f2;border:1px solid #fecaca;
                 border-radius:6px;cursor:pointer;color:#dc2626">🗑️</button>
      </td>
    </tr>`).join('');
}

function openFormPJ(pj = null) {
  _editingPJId = pj?.id || null;
  const modal = document.getElementById('modal-pj');
  const title = document.getElementById('modal-pj-title');
  if (title) title.textContent = pj ? 'Edit Penanggung Jawab' : 'Tambah Penanggung Jawab';
  ['pj-nama','pj-nip','pj-jabatan','pj-unit-kerja','pj-no-hp'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const key = id.replace('pj-','').replace(/-/g,'_');
    el.value = pj ? (pj[key] || pj[id.replace('pj-','')] || '') : '';
  });
  if (modal) modal.style.display = 'flex';
}

window.editPJ = async function(id) {
  showLoading(true);
  try {
    const { data, error } = await db.from('penanggung_jawab').select('*').eq('id', id).single();
    if (error) throw error;
    openFormPJ(data);
  } catch (err) {
    showAlert('Gagal load data: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
};

window.hapusPJHandler = async function(id, nama) {
  if (!confirm(`Yakin hapus "${nama}"? Pastikan tidak ada aset terdaftar atas nama ini.`)) return;
  showLoading(true);
  try {
    await deletePJRecord(id);
    showAlert(`${nama} berhasil dihapus.`);
    await loadAndRenderPJ();
  } catch (err) {
    showAlert('Gagal menghapus: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
};

async function simpanPJ() {
  const nama = document.getElementById('pj-nama')?.value.trim();
  if (!nama) { showAlert('Nama wajib diisi!', 'error'); return; }

  const payload = {
    nama,
    nip:       document.getElementById('pj-nip')?.value.trim()       || null,
    jabatan:   document.getElementById('pj-jabatan')?.value.trim()   || null,
    unit_kerja:document.getElementById('pj-unit-kerja')?.value.trim()|| null,
    no_hp:     document.getElementById('pj-no-hp')?.value.trim()     || null,
  };

  showLoading(true);
  try {
    await savePJRecord(payload, _editingPJId);
    showAlert(_editingPJId ? 'Data berhasil diperbarui!' : 'Penanggung jawab berhasil ditambahkan!');
    tutupModalPJ();
    await loadAndRenderPJ();
  } catch (err) {
    showAlert('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

function tutupModalPJ() {
  const modal = document.getElementById('modal-pj');
  if (modal) modal.style.display = 'none';
  _editingPJId = null;
}

async function initPJPage() {
  document.getElementById('btn-tambah-pj')?.addEventListener('click', () => openFormPJ());
  document.getElementById('btn-simpan-pj')?.addEventListener('click', simpanPJ);
  document.getElementById('btn-batal-pj')?.addEventListener('click', tutupModalPJ);
  document.getElementById('modal-pj')?.addEventListener('click', function(e) {
    if (e.target === this) tutupModalPJ();
  });
  await loadAndRenderPJ();
}


