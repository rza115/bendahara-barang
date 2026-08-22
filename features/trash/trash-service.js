// ============================================
// features/trash/trash-service.js
// Query dan mutasi aset yang berada di Trash
// ============================================

const TRASH_DOK_URL_FIELDS = [
  'dok_spk_url',
  'dok_penawaran_url',
  'dok_baphp_url',
  'dok_bast_url',
  'dok_kuitansi_url',
];

async function fetchTrashAset(filter = {}) {
  let query = db.from('aset')
    .select('id, nama_barang, kode_barang, kib, tahun_perolehan, lokasi, foto_url, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (filter.search) {
    query = query.ilike('nama_barang', `%${filter.search}%`);
  }

  const limit = Number.parseInt(filter.limit, 10);
  if (Number.isFinite(limit) && limit > 0) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function restoreTrashAset(id) {
  const { data, error } = await db.from('aset')
    .update({ deleted_at: null, deleted_by: null })
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Aset tidak ditemukan di Trash.');
}

function getStoragePath(url, bucket) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const rawPath = String(url).split(marker)[1];
  if (!rawPath) return null;
  try {
    return decodeURIComponent(rawPath.split('?')[0]);
  } catch (_) {
    return rawPath.split('?')[0];
  }
}

async function getPermanentDeleteFiles(id) {
  const assetFields = ['foto_url', ...TRASH_DOK_URL_FIELDS].join(', ');
  const [assetResult, docsResult] = await Promise.all([
    db.from('aset')
      .select(assetFields)
      .eq('id', id)
      .not('deleted_at', 'is', null)
      .single(),
    db.from('dokumen_aset').select('file_path').eq('aset_id', id),
  ]);

  if (assetResult.error) throw assetResult.error;
  if (docsResult.error) throw docsResult.error;

  const fotoPaths = [getStoragePath(assetResult.data?.foto_url, 'foto-barang')]
    .filter(Boolean);
  const dokPaths = [
    ...(docsResult.data || []).map(row => row.file_path),
    ...TRASH_DOK_URL_FIELDS.map(key =>
      getStoragePath(assetResult.data?.[key], 'dokumen-pengadaan')
    ),
  ].filter(Boolean);

  return {
    fotoPaths: [...new Set(fotoPaths)],
    dokPaths: [...new Set(dokPaths)],
  };
}

async function cleanupPermanentDeleteFiles(files) {
  const warnings = [];
  if (files.fotoPaths.length) {
    const { error } = await db.storage.from('foto-barang').remove(files.fotoPaths);
    if (error) warnings.push('foto');
  }
  if (files.dokPaths.length) {
    const { error } = await db.storage.from('dokumen-pengadaan').remove(files.dokPaths);
    if (error) warnings.push('dokumen');
  }
  return warnings;
}

async function permanentlyDeleteTrashAset(id) {
  const files = await getPermanentDeleteFiles(id);
  const { error } = await db.rpc('hapus_aset_permanen', { p_aset_id: id });
  if (error) throw error;
  return cleanupPermanentDeleteFiles(files);
}

