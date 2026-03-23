// ============================================
// auth.js — Session Guard
// Sertakan di index.html, tambah.html, edit.html
// SEBELUM app.js: <script src="auth.js"></script>
// ============================================

(function () {
  const SESSION_KEY = 'inventaris_auth';

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (s.exp && Date.now() < s.exp) return s;
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  // Redirect ke login kalau belum login
  const session = getSession();
  if (!session) {
    window.location.replace('login.html');
  }

  // Fungsi logout — bisa dipanggil dari tombol logout
  window.logoutAdmin = function () {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace('login.html');
  };

  // Tampilkan nama user di header jika ada elemen #admin-user
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('admin-user');
    if (el && session) el.textContent = session.user;
  });
})();
