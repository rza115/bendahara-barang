// ============================================
// auth.js — Session Guard (Supabase Auth)
// Sertakan di index.html, tambah.html, edit.html
// SETELAH supabase.js (lokal), SEBELUM app.js
// ============================================

// Sembunyikan halaman sampai auth selesai — cegah kilatan konten
document.documentElement.style.visibility = 'hidden';

window._appReady = (async function () {
  const SUPABASE_URL = 'https://ibektroxjjibniwidmpk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b-oL0WNdkqDjUFhepAkADw_uy9coRD6';

  try {
    window._authClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Timeout 8 detik — jika getSession() tidak respond, redirect ke login
    const { data: { session } } = await Promise.race([
      window._authClient.auth.getSession(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: koneksi terlalu lambat')), 8000)
      ),
    ]);

    if (!session) {
      window.location.replace('login.html');
      return false;
    }

    // Auth OK — tampilkan halaman
    document.documentElement.style.visibility = '';

    // Tampilkan email user di nav jika ada
    const el = document.getElementById('admin-user');
    if (el) el.textContent = session.user.email;

    // Fungsi logout global
    window.logoutAdmin = async function () {
      await window._authClient.auth.signOut();
      window.location.replace('login.html');
    };

    // Pantau perubahan sesi — jika logout atau token expired, redirect ke login
    window._authClient.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        window.location.replace('login.html');
      }
    });

    return true;

  } catch (err) {
    console.error('[auth.js] Error:', err.message);
    window.location.replace('login.html');
    return false;
  }
})();
