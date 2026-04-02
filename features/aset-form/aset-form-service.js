// ============================================
// features/aset-form/aset-form-service.js
// Operasi Supabase untuk tambah & edit aset
// ============================================

async function saveAset(isEdit, id, data) {
  if (isEdit) {
    const { error } = await db.from('aset').update(data).eq('id', id);
    if (error) throw error;
    return id;
  } else {
    const { data: inserted, error } = await db.from('aset').insert(data).select('id').single();
    if (error) throw error;
    return inserted.id;
  }
}

async function loadPenanggungJawabDropdown(selectedId = null) {
  const sel = document.getElementById('penanggung_jawab_id');
  if (!sel) return;
  try {
    const { data, error } = await db.from('penanggung_jawab')
      .select('id, nama, jabatan, unit_kerja')
      .neq('aktif', false)
      .order('nama', { ascending: true });
    if (error) throw error;
    sel.innerHTML = `<option value="">— Pilih Penanggung Jawab —</option>`;
    data.forEach(pj => {
      const opt = document.createElement('option');
      opt.value = pj.id;
      opt.textContent = pj.nama + (pj.jabatan ? ` — ${pj.jabatan}` : '');
      if (String(pj.id) === String(selectedId)) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.warn('loadPenanggungJawabDropdown error:', err.message);
  }
}
