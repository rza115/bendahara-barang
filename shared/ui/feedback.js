// ============================================
// shared/ui/feedback.js
// showAlert dan showLoading — dipakai lintas halaman
// ============================================

function showAlert(msg, type = 'success') {
  const el = document.getElementById('alert-box');
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function showLoading(show = true) {
  const el = document.getElementById('loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}
