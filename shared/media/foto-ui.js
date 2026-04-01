// ============================================
// shared/media/foto-ui.js
// Inisialisasi UI upload foto (preview + tombol hapus)
// ============================================

let _fotoHapus = false;

function initFotoUpload(existingUrl = null) {
  const fileInput  = document.getElementById('foto_file');
  const previewWrap= document.getElementById('foto-preview-wrap');
  const previewImg = document.getElementById('foto-preview');
  const existingWrap=document.getElementById('foto-existing-wrap');
  const existingImg= document.getElementById('foto-existing');

  _fotoHapus = false;

  if (existingUrl && existingImg) {
    existingImg.src = existingUrl;
    if (existingWrap) existingWrap.style.display = 'block';
  }

  fileInput?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Ukuran foto melebihi 2 MB!', 'error');
      this.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      if (previewImg)   previewImg.src = e.target.result;
      if (previewWrap)  previewWrap.style.display  = 'block';
      if (existingWrap) existingWrap.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-hapus-foto')?.addEventListener('click', () => {
    _fotoHapus = true;
    if (existingWrap) existingWrap.style.display = 'none';
    if (previewWrap)  previewWrap.style.display  = 'none';
    if (fileInput)    fileInput.value = '';
  });
}

function isFotoHapus() { return _fotoHapus; }
