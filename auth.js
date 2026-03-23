// ============================================
// auth.js — Session Guard (Supabase Auth)
// Sertakan di index.html, tambah.html, edit.html
// SEBELUM app.js: <script src="auth.js"></script>
// ============================================

(async function () {
  const SUPABASE_URL = 'https://ibektroxjjibniwidmpk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b-oL0WNdkqDjUFhepAkADw_uy9coRD6';

  const { createClient } = supabase;
  window._authClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Cek session aktif dari Supabase
  const { data: { session } } = await window._authClient.auth.getSession();

  if (!session) {
    window.location.replace('login.html');
    return;
  }

  // Fungsi logout — dipanggil dari tombol logout
  window.logoutAdmin = async function () {
    await window._authClient.auth.signOut();
    window.location.replace('login.html');
  };

  // Tampilkan nama user di header jika ada elemen #admin-user
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('admin-user');
    if (el && session.user) {
      // Tampilkan bagian sebelum @ dari email
      el.textContent = session.user.email.split('@')[0];
    }
  });
})();
