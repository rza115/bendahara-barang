// ============================================
// shared/media/dokumen-service.js
// Upload dokumen pengadaan & dokumen penanggung jawab
// ============================================

async function uploadDokumen(file, jenisDok) {
  const fileName = `${jenisDok}_${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await db.storage.from('dokumen-pengadaan').upload(fileName, file, { upsert: true });
  if (error) throw error;
  return db.storage.from('dokumen-pengadaan').getPublicUrl(fileName).data.publicUrl;
}

async function uploadDokumenPJ(asetId) {
  const uploads = [];
  for (const { id, jenis } of DOK_PJ_INPUTS) {
    const file = document.getElementById(id)?.files?.[0];
    if (!file) continue;
    if (file.size > 5 * 1024 * 1024) {
      showAlert(`File "${jenis}" melebihi 5 MB, dilewati.`, 'error');
      continue;
    }
    const fileName = `pj_${jenis.replace(/\s+/g, '_')}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadErr } = await db.storage
      .from('dokumen-pengadaan')
      .upload(fileName, file, { upsert: true });
    if (uploadErr) {
      showAlert(`Gagal upload "${jenis}": ${uploadErr.message}`, 'error');
      continue;
    }
    uploads.push({
      aset_id: asetId,
      jenis_dokumen: jenis,
      nama_file: file.name,
      file_path: fileName,
      file_size: file.size,
    });
  }
  if (uploads.length) {
    const { error } = await db.from('dokumen_aset').insert(uploads);
    if (error) showAlert('Gagal simpan record dokumen PJ: ' + error.message, 'error');
  }
}

async function loadDokumenPJExisting(asetId) {
  const wrap = document.getElementById('dok-pj-existing');
  const list = document.getElementById('dok-pj-list');
  if (!wrap || !list) return;
  try {
    const { data, error } = await db.from('dokumen_aset')
      .select('*')
      .eq('aset_id', asetId)
      .order('created_at');
    if (error || !data?.length) return;
    wrap.style.display = 'block';
    list.innerHTML = data.map(d => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px;font-size:13px">
        <span>
          <span style="font-weight:500">📄 ${escapeHtml(d.jenis_dokumen)}</span>
          <span style="color:#94a3b8;margin-left:8px;font-size:12px">${escapeHtml(d.nama_file)}</span>
        </span>
        <button onclick="hapusDokumenPJ('${d.id}','${asetId}')"
          style="padding:3px 8px;font-size:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;cursor:pointer;color:#dc2626">
          Hapus
        </button>
      </div>`).join('');
  } catch (_) {}
}

window.hapusDokumenPJ = async function (dokId, asetId) {
  if (!confirm('Hapus dokumen ini?')) return;
  showLoading(true);
  try {
    const { data } = await db.from('dokumen_aset').select('file_path').eq('id', dokId).single();
    if (data?.file_path) await db.storage.from('dokumen-pengadaan').remove([data.file_path]);
    const { error } = await db.from('dokumen_aset').delete().eq('id', dokId);
    if (error) throw error;
    showAlert('Dokumen berhasil dihapus.');
    await loadDokumenPJExisting(asetId);
  } catch (err) {
    showAlert('Gagal hapus dokumen: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
};
