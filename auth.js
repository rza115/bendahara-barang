// ============================================
// auth.js — Session Guard (Supabase Auth)
// Sertakan di index.html, tambah.html, edit.html
// SETELAH supabase.js (lokal), SEBELUM app.js
// ============================================

window._appReady = (async function () {
  const SUPABASE_URL = 'https://ibektroxjjibniwidmpk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b-oL0WNdkqDjUFhepAkADw_uy9coRD6';

  // FIX #1: Bungkus seluruhnya dengan try/catch
  // Jika supabase.js gagal load atau getSession() throw network error,
  // tangkap errornya dan redirect ke login — bukan biarkan app hang
  try {
    // Satu client, dipakai bersama oleh auth dan app.js
    window._authClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // FIX #2: Tambah timeout — jika getSession() tidak respond dalam 8 detik,
    // anggap gagal dan redirect ke login daripada halaman stuck selamanya
    const sessionPromise = window._authClient.auth.getSession();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: koneksi terlalu lambat')), 8000)
    );
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

    if (!session) {
      window.location.replace('login.html');
      return false;
    }

    // Tampilkan email user
    const el = document.getElementById('admin-user');
    if (el) el.textContent = session.user.email;

    // Fungsi logout global
    window.logoutAdmin = async function () {
      await window._authClient.auth.signOut();
      window.location.replace('login.html');
    };

    // FIX #3: Pantau perubahan sesi secara realtime
    // Jika token expired saat halaman sedang dibuka → langsung redirect ke login
    window._authClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
        window.location.replace('login.html');
      }
    });

    return true;

  } catch (err) {
    // FIX #1 lanjutan: network error / supabase.js tidak load / timeout
    console.error('[auth.js] Error:', err.message);
    window.location.replace('login.html');
    return false;
  }
})();
