// ============================================
// shared/auth/auth-guard.js
// Session guard — dipindah dari auth.js (root)
// Dipanggil SETELAH supabase.js, SEBELUM main.js
// ============================================

document.documentElement.style.visibility = 'hidden';

const SUPABASE_URL = 'https://ibektroxjjibniwidmpk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_b-oL0WNdkqDjUFhepAkADw_uy9coRD6';

window._appReady = (async function () {
  try {
    window._authClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

    document.documentElement.style.visibility = '';

    const el = document.getElementById('admin-user');
    if (el) el.textContent = session.user.email;

    window.logoutAdmin = async function () {
      await window._authClient.auth.signOut();
      window.location.replace('login.html');
    };

    window._authClient.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        window.location.replace('login.html');
      }
    });

    return true;
  } catch (err) {
    console.error('[auth-guard.js] Error:', err.message);
    window.location.replace('login.html');
    return false;
  }
})();
