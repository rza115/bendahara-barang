// ============================================
// shared/media/foto-service.js
// Upload & hapus foto barang ke Supabase Storage
// ============================================

async function uploadFoto(file) {
  const fileName = `barang_${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await db.storage.from('foto-barang').upload(fileName, file, { upsert: true });
  if (error) throw error;
  return db.storage.from('foto-barang').getPublicUrl(fileName).data.publicUrl;
}

async function hapusFotoStorage(url) {
  if (!url) return;
  try {
    const path = url.split('/foto-barang/')[1];
    if (path) await db.storage.from('foto-barang').remove([path]);
  } catch (_) {}
}
