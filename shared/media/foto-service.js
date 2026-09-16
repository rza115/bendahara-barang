// ============================================
// shared/media/foto-service.js
// Kompres, upload, dan hapus foto barang di Supabase Storage
// ============================================

const FOTO_MAX_INPUT_BYTES = 20 * 1024 * 1024;
const FOTO_MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const FOTO_MAX_DIMENSION = 1600;

function loadFotoImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Foto tidak dapat dibaca. Gunakan format JPG, PNG, atau WEBP.'));
    };
    image.src = objectUrl;
  });
}

async function compressFoto(file) {
  if (!file?.type?.startsWith('image/') || file.type === 'image/svg+xml') {
    throw new Error('File yang dipilih bukan foto yang didukung.');
  }
  if (file.size > FOTO_MAX_INPUT_BYTES) {
    throw new Error('Ukuran foto asli melebihi 20 MB.');
  }

  const image = await loadFotoImage(file);
  const scale = Math.min(1, FOTO_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser tidak mendukung kompresi foto.');
  // Latar putih mencegah area transparan PNG berubah hitam saat dikonversi ke JPEG.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const toBlob = quality => new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Foto gagal dikompres.')),
      'image/jpeg',
      quality,
    );
  });

  let quality = 0.82;
  let blob = await toBlob(quality);
  while (blob.size > FOTO_MAX_OUTPUT_BYTES && quality > 0.42) {
    quality -= 0.1;
    blob = await toBlob(quality);
  }
  if (blob.size > FOTO_MAX_OUTPUT_BYTES) {
    throw new Error('Foto masih melebihi 2 MB setelah dikompres. Coba ambil foto dengan resolusi lebih rendah.');
  }

  const baseName = (file.name || 'foto').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '_');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

async function uploadFoto(file) {
  const compressedFile = await compressFoto(file);
  const fileName = `barang_${Date.now()}.jpg`;
  const { error } = await db.storage.from('foto-barang').upload(fileName, compressedFile, {
    upsert: true,
    contentType: 'image/jpeg',
  });
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
