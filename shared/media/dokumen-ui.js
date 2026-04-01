// ============================================
// shared/media/dokumen-ui.js
// Preview dokumen baru & existing di form tambah/edit
// ============================================

// State dokumen yang akan diupload (diisi oleh event listener)
const _uploadedDokumen = {};

function renderDokPreview(wrap, file) {
  if (!wrap) return;
  const isImage = file.type.startsWith('image/');
  if (isImage) {
    const reader = new FileReader();
    reader.onload = e => {
      wrap.innerHTML = `<img src="${e.target.result}" alt="Preview"
        style="max-width:200px;max-height:200px;border-radius:8px;border:1px solid #e2e8f0">
        <p style="font-size:12px;color:#64748b;margin-top:4px">${escapeHtml(file.name)}</p>`;
      wrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    wrap.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:#f1f5f9;border-radius:8px;border:1px solid #e2e8f0">
        <span style="font-size:20px">📎</span>
        <span style="font-size:13px;color:#334155">${escapeHtml(file.name)}</span>
      </div>`;
    wrap.style.display = 'block';
  }
}

function initDokumenUpload() {
  DOK_INPUTS.forEach(({ id, key, previewId }) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('change', function () {
      const file = this.files[0];
      const previewWrap = document.getElementById(previewId);
      if (previewWrap) { previewWrap.innerHTML = ''; previewWrap.style.display = 'none'; }
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Ukuran file melebihi 5 MB!', 'error');
        this.value = '';
        return;
      }
      _uploadedDokumen[key] = file;
      renderDokPreview(previewWrap, file);
    });
  });
}

function initDokumenPreview(data) {
  DOK_FIELDS.forEach(({ key, existingId, previewId }) => {
    const url = data[key];
    if (!url) return;
    const existingWrap = document.getElementById(existingId);
    const previewEl    = document.getElementById(previewId);
    if (!existingWrap || !previewEl) return;
    existingWrap.dataset.url = url;
    const ext = url.split('?')[0].split('.').pop().toLowerCase();
    const isImage = ['jpg','jpeg','png','webp','gif'].includes(ext);
    if (isImage) {
      previewEl.innerHTML = `<img src="${escapeHtml(url)}" alt="Dokumen"
        style="max-width:200px;max-height:200px;border-radius:8px;border:1px solid #e2e8f0">`;
    } else {
      const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]);
      previewEl.innerHTML = `
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:#f1f5f9;
                 border-radius:8px;border:1px solid #cbd5e1;text-decoration:none;color:#1e40af;font-size:13px">
          <span style="font-size:18px">📎</span>
          <span>${escapeHtml(fileName)}</span>
          <span style="font-size:11px;color:#64748b">Buka</span>
        </a>`;
    }
    existingWrap.style.display = 'block';
  });
}

function hapusDokumenField(key, existingId) {
  const el = document.getElementById(existingId);
  if (el) el.style.display = 'none';
  _uploadedDokumen[key] = null;
}

function getUploadedDokumen() {
  return _uploadedDokumen;
}
