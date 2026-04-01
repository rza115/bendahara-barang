// ============================================
// features/barang/barang-service.js
// Komunikasi dengan Supabase untuk tabel 'aset'
// Tidak melakukan render — hanya mengembalikan data
// ============================================

async function fetchDaftarAset(filter = {}) {
  let query = db.from('aset').select('*');

  if (filter.kib)    query = query.eq('kib', filter.kib);
  if (filter.kondisi) query = query.eq('kondisi', filter.kondisi);
  if (filter.search)  query = query.ilike('nama_barang', `%${filter.search}%`);

  const sortOpt = SORT_MAP[filter.sort];
  query = sortOpt
    ? query.order(sortOpt.column, { ascending: sortOpt.ascending })
    : query.order('kib').order('nama_barang');

  const limitVal = filter.limit && filter.limit !== 'all'
    ? parseInt(filter.limit)
    : null;
  if (limitVal) query = query.limit(limitVal);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function fetchSummaryAset(filter = {}) {
  let query = db.from('aset').select('kib, harga');

  if (filter.kib)    query = query.eq('kib', filter.kib);
  if (filter.kondisi) query = query.eq('kondisi', filter.kondisi);
  if (filter.search)  query = query.ilike('nama_barang', `%${filter.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function deleteAset(id) {
  const { error } = await db.from('aset').delete().eq('id', id);
  if (error) throw error;
}

async function fetchAsetById(id) {
  const { data, error } = await db.from('aset').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
