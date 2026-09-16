// ============================================
// shared/media/foto-ui.js
// Inisialisasi UI upload foto (preview + tombol hapus)
// ============================================

let _fotoHapus = false;

function initFotoUpload(existingUrl = null) {
  const fileInput  = document.getElementById('foto_file');
  const cameraInput= document.getElementById('foto_camera_file');
  const previewWrap= document.getElementById('foto-preview-wrap');
  const previewImg = document.getElementById('foto-preview');
  const existingWrap=document.getElementById('foto-existing-wrap');
  const existingImg= document.getElementById('foto-existing');

  _fotoHapus = false;

  if (existingUrl && existingImg) {
    existingImg.src = existingUrl;
    if (existingWrap) existingWrap.style.display = 'block';
  }

  function handleFotoChange(input, otherInput) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      showAlert('Pilih foto berformat JPG, PNG, atau WEBP.', 'error');
      input.value = '';
      return;
    }
    if (file.size > FOTO_MAX_INPUT_BYTES) {
      showAlert('Ukuran foto asli melebihi 20 MB!', 'error');
      input.value = '';
      return;
    }
    // Hanya satu sumber yang aktif agar file yang terakhir dipilih yang diunggah.
    if (otherInput) otherInput.value = '';
    _fotoHapus = false;
    const reader = new FileReader();
    reader.onload = e => {
      if (previewImg)   previewImg.src = e.target.result;
      if (previewWrap)  previewWrap.style.display  = 'block';
      if (existingWrap) existingWrap.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  fileInput?.addEventListener('change', () => handleFotoChange(fileInput, cameraInput));
  cameraInput?.addEventListener('change', () => handleFotoChange(cameraInput, fileInput));

  document.getElementById('btn-hapus-foto')?.addEventListener('click', () => {
    _fotoHapus = true;
    if (existingWrap) existingWrap.style.display = 'none';
    if (previewWrap)  previewWrap.style.display  = 'none';
    if (fileInput)    fileInput.value = '';
    if (cameraInput)  cameraInput.value = '';
  });
}

function getFotoFile() {
  return document.getElementById('foto_camera_file')?.files?.[0]
    || document.getElementById('foto_file')?.files?.[0]
    || null;
}

function isFotoHapus() { return _fotoHapus; }
