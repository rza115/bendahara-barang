// ============================================
// auth.js — Session Guard (Supabase Auth)
// Sertakan di index.html, tambah.html, edit.html
// SETELAH supabase CDN, SEBELUM app.js
// ============================================

(async function () {
  const SUPABASE_URL = 'https://ibektroxjjibniwidmpk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b-oL0WNdkqDjUFhepAkADw_uy9coRD6';

  const { createClient } = supabase;
  // Buat client khusus auth (db utama dibuat di app.js)
  window._authClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Cek sesi aktif
  const { data: { session } } = await window._authClient.auth.getSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }

  // Tampilkan email user di elemen #admin-user jika ada
  const el = document.getElementById('admin-user');
  if (el) el.textContent = session.user.email;

  // Fungsi logout global
  window.logoutAdmin = async function () {
    await window._authClient.auth.signOut();
    window.location.replace('login.html');
  };
})();
