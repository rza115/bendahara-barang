// ============================================
// features/pemindahtanganan/pt-page.js
// Controller halaman pemindahtanganan
// ============================================

let _allPJ   = [];
let _allAset = [];

function getNamaPJ(id) {
  if (!id) return 'Tidak ada';
  const pj = _allPJ.find(p => p.id == id);
  return pj ? `${pj.nama}${pj.jabatan ? ' — ' + pj.jabatan : ''}` : id;
}

function getNamaAset(id) {
  const a = _allAset.find(a => a.id == id);
  return a ? `${a.nama_barang}${a.kode_barang ? ' (' + a.kode_barang + ')' : ''}` : id;
}

async function loadMasterData() {
  try {
    const [resPJ, resAset] = await Promise.all([
      db.from('penanggungjawab').select('id, nama, jabatan').neq('aktif', false).order('nama'),
      db.from('aset').select('id, nama_barang, kode_barang').order('nama_barang'),
    ]);
    if (resPJ.error)   throw new Error('Gagal load PJ: '   + resPJ.error.message);
    if (resAset.error) throw new Error('Gagal load aset: ' + resAset.error.message);
    _allPJ   = resPJ.data;
    _allAset = resAset.data;
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

function populatePTDropdowns() {
  const selBarang  = document.getElementById('pt-barang-id');
  const filterBarang = document.getElementById('filter-pt-barang');
  const selKePJ    = document.getElementById('pt-ke-pj-id');
  const filterPJ   = document.getElementById('filter-pt-pj');

  _allAset.forEach(a => {
    const label = `${a.nama_barang}${a.kode_barang ? ' (' + a.kode_barang + ')' : ''}`;
    [selBarang, filterBarang].forEach(sel => {
      if (!sel) return;
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = label;
      sel.appendChild(opt);
    });
  });

  _allPJ.forEach(pj => {
    const label = pj.nama + (pj.jabatan ? ` — ${pj.jabatan}` : '');
    [selKePJ, filterPJ].forEach(sel => {
      if (!sel) return;
      const opt = document.createElement('option');
      opt.value = pj.id;
      opt.textContent = label;
      sel.appendChild(opt);
    });
  });

  // Auto-isi PJ lama saat barang dipilih
  selBarang?.addEventListener('change', async function () {
    const display = document.getElementById('pt-pj-lama-display');
    const hidden  = document.getElementById('pt-dari-pj-id');
    if (!this.value) {
      if (display) display.value = '';
      if (hidden)  hidden.value = '';
      return;
    }
    try {
      const { data } = await db.from('aset')
        .select('penanggungjawab_id, nama_penanggungjawab')
        .eq('id', this.value)
        .single();
      const namaPJ = data?.penanggungjawab_id
        ? getNamaPJ(data.penanggungjawab_id)
        : (data?.nama_penanggungjawab || 'Tidak ada');
      if (display) display.value = namaPJ;
      if (hidden)  hidden.value  = data?.penanggungjawab_id || '';
    } catch (_) {}
  });
}

async function loadRiwayatPT() {
  showLoading(true);
  try {
    const filter = {
      barangId: document.getElementById('filter-pt-barang')?.value || '',
      pjId:     document.getElementById('filter-pt-pj')?.value     || '',
    };
    const data = await fetchRiwayatPT(filter);
    renderRiwayatPT(data);
  } catch (err) {
    showAlert('Gagal memuat riwayat: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

function renderRiwayatPT(data) {
  const tbody = document.getElementById('pt-tbody');
  if (!tbody) return;

  if (!data?.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8">
      Belum ada data pemindahtanganan.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((row, i) => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px;font-size:13px">${i + 1}</td>
      <td style="padding:10px 12px;font-size:13px;font-weight:500">${escapeHtml(getNamaAset(row.barang_id))}</td>
      <td style="padding:10px 12px;font-size:13px;color:#64748b">${escapeHtml(getNamaPJ(row.dari_pj_id))}</td>
      <td style="padding:10px 12px;font-size:13px;color:#166534;font-weight:500">${escapeHtml(getNamaPJ(row.ke_pj_id))}</td>
      <td style="padding:10px 12px;font-size:13px">${row.tanggal || '-'}</td>
      <td style="padding:10px 12px;font-size:12px;color:#64748b;font-family:monospace">${escapeHtml(row.no_dokumen) || '-'}</td>
      <td style="padding:10px 12px">
        ${row.dokumen_url
          ? `<a href="${escapeHtml(row.dokumen_url)}" target="_blank" rel="noopener"
               style="font-size:12px;color:#1d4ed8">Dokumen&nbsp;↗</a> `
          : ''}
        <button onclick="hapusPTHandler('${row.id}')"
          style="padding:3px 8px;font-size:12px;background:#fef2f2;border:1px solid #fecaca;
                 border-radius:6px;cursor:pointer;color:#dc2626">
          🗑️ Hapus
        </button>
      </td>
    </tr>`).join('');
}

async function simpanPT() {
  const barangId = document.getElementById('pt-barang-id')?.value;
  const dariPjId = document.getElementById('pt-dari-pj-id')?.value || null;
  const kePjId   = document.getElementById('pt-ke-pj-id')?.value;
  const tanggal  = document.getElementById('pt-tanggal')?.value;

  if (!barangId) { showAlert('Pilih barang terlebih dahulu!', 'error'); return; }
  if (!kePjId)   { showAlert('Pilih penanggung jawab baru!', 'error'); return; }
  if (!tanggal)  { showAlert('Tanggal wajib diisi!', 'error'); return; }
  if (dariPjId && dariPjId === kePjId) {
    showAlert('Penanggung jawab baru harus berbeda dengan yang lama!', 'error');
    return;
  }

  showLoading(true);
  try {
    // Upload dokumen jika ada
    let dokumenUrl = null;
    const dokFile = document.getElementById('pt-dokumen-file')?.files?.[0];
    if (dokFile) {
      if (dokFile.size > 5 * 1024 * 1024) {
        showAlert('Ukuran file melebihi 5 MB!', 'error');
        return;
      }
      dokumenUrl = await uploadDokumen(dokFile, 'pemindahtanganan');
    }

    const payload = {
      barang_id:    barangId,
      dari_pj_id:   dariPjId || null,
      ke_pj_id:     kePjId,
      tanggal,
      no_dokumen:   document.getElementById('pt-no-dokumen')?.value.trim() || null,
      keterangan:   document.getElementById('pt-keterangan')?.value.trim() || null,
      dokumen_url:  dokumenUrl,
    };

    await savePT(payload);
    await updatePJAset(barangId, kePjId);

    showAlert('Pemindahtanganan berhasil dicatat! Penanggung jawab barang diperbarui.');
    resetFormPT();
    await loadRiwayatPT();
  } catch (err) {
    showAlert('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

window.hapusPTHandler = async function (id) {
  if (!confirm('Yakin hapus riwayat pemindahtanganan ini? Penanggung jawab barang TIDAK akan dikembalikan ke PJ lama.')) return;
  showLoading(true);
  try {
    await deletePT(id);
    showAlert('Riwayat berhasil dihapus.');
    await loadRiwayatPT();
  } catch (err) {
    showAlert('Gagal menghapus: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
};

function resetFormPT() {
  ['pt-barang-id','pt-ke-pj-id','pt-tanggal','pt-no-dokumen','pt-keterangan',
   'pt-pj-lama-display','pt-dari-pj-id','pt-dokumen-file']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
}

async function initPemindahtangananPage() {
  await loadMasterData();
  populatePTDropdowns();

  // Filter change → reload
  ['filter-pt-barang','filter-pt-pj'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', loadRiwayatPT);
  });

  // Tombol simpan
  document.getElementById('btn-simpan-pt')?.addEventListener('click', simpanPT);

  await loadRiwayatPT();
}
