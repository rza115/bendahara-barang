// features/penanggung-jawab/pj-service.js

async function fetchAllPJ() {
  const { data, error } = await db.from('penanggung_jawab')
    .select('*').order('nama');
  if (error) throw error;
  return data;
}

async function savePJRecord(payload, id = null) {
  if (id) {
    const { error } = await db.from('penanggung_jawab').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await db.from('penanggung_jawab').insert(payload);
    if (error) throw error;
  }
}

async function deletePJRecord(id) {
  const { error } = await db.from('penanggung_jawab').delete().eq('id', id);
  if (error) throw error;
}

async function fetchJumlahAsetPerPJ() {
  const { data, error } = await db.from('aset')
    .select('penanggung_jawab_id');
  if (error) return {};
  const map = {};
  data.forEach(r => {
    if (r.penanggung_jawab_id) map[r.penanggung_jawab_id] = (map[r.penanggung_jawab_id] || 0) + 1;
  });
  return map;
}
