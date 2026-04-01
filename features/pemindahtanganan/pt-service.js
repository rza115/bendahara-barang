// ============================================
// features/pemindahtanganan/pt-service.js
// Operasi Supabase untuk tabel pemindahtanganan
// ============================================

async function fetchRiwayatPT(filter = {}) {
  let q = db.from('pemindahtanganan').select('*').order('tanggal', { ascending: false });
  if (filter.barangId) q = q.eq('barang_id', filter.barangId);
  if (filter.pjId)     q = q.or(`dari_pj_id.eq.${filter.pjId},ke_pj_id.eq.${filter.pjId}`);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function savePT(payload) {
  const { error } = await db.from('pemindahtanganan').insert(payload);
  if (error) throw error;
}

async function updatePJAset(barangId, kePjId) {
  const { error } = await db.from('aset').update({ penanggungjawab_id: kePjId }).eq('id', barangId);
  if (error) throw error;
}

async function deletePT(id) {
  const { error } = await db.from('pemindahtanganan').delete().eq('id', id);
  if (error) throw error;
}
