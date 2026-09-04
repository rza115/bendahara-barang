// ============================================
// features/barang/barang-service.js
// Komunikasi dengan Supabase untuk tabel 'aset'
// Tidak melakukan render — hanya mengembalikan data
// ============================================

async function fetchDaftarAset(filter = {}) {
  let query = db.from('aset').select('*').is('deleted_at', null);

  if (filter.kib)    query = query.eq('kib', filter.kib);
  if (filter.kondisi) query = query.eq('kondisi', filter.kondisi);
  if (filter.search) {
    const search = filter.search.trim();
    if (search) query = query.or(`nama_barang.ilike.%${search}%,id_barang.ilike.%${search}%`);
  }

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
  let query = db.from('aset').select('kib, harga').is('deleted_at', null);

  if (filter.kib)    query = query.eq('kib', filter.kib);
  if (filter.kondisi) query = query.eq('kondisi', filter.kondisi);
  if (filter.search) {
    const search = filter.search.trim();
    if (search) query = query.or(`nama_barang.ilike.%${search}%,id_barang.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function deleteAset(id) {
  const { data: { user }, error: userError } = await db.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await db.from('aset')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user?.id || null,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Aset tidak ditemukan atau sudah berada di Trash.');
}

async function fetchAsetById(id) {
  const { data, error } = await db.from('aset')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  return data;
}
