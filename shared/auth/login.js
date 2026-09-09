(function () {
  'use strict';
  const authClient = window.createSupabaseClient();
  const btn = document.getElementById('btn-login');
  const errorEl = document.getElementById('error-msg');
  const status = document.getElementById('captcha-status');
  const passwordInput = document.getElementById('password');
  let checkingSession = true;
  let submitting = false;
  let redirecting = false;
  let captchaToken = '';
  let widgetId = null;

  function updateButton() {
    btn.disabled = checkingSession || submitting || redirecting || !captchaToken;
    btn.classList.toggle('loading', checkingSession || submitting || redirecting);
  }

  function showError(message) {
    document.getElementById('error-text').textContent = message;
    errorEl.classList.add('show');
  }

  function invalidateCaptcha(message) {
    captchaToken = '';
    status.textContent = message;
    updateButton();
  }

  function resetCaptcha() {
    invalidateCaptcha('Silakan selesaikan verifikasi keamanan.');
    if (widgetId !== null) {
      try { window.hcaptcha.reset(widgetId); }
      catch (_) { status.textContent = 'Verifikasi gagal dimuat. Muat ulang halaman untuk mencoba lagi.'; }
    }
  }

  function loadCaptcha() {
    const sitekey = (window.HCAPTCHA_SITEKEY || '').trim();
    if (!sitekey) {
      invalidateCaptcha('Verifikasi keamanan belum tersedia. Hubungi administrator sistem.');
      return;
    }
    const timeout = setTimeout(() => {
      if (widgetId === null) invalidateCaptcha('Verifikasi terlalu lama dimuat. Periksa koneksi lalu muat ulang halaman.');
    }, 15000);
    window.onLoginCaptchaLoad = function () {
      clearTimeout(timeout);
      try {
        widgetId = window.hcaptcha.render('login-captcha', {
          sitekey,
          size: document.getElementById('login-captcha').clientWidth < 304 ? 'compact' : 'normal',
          theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
          callback(token) {
            captchaToken = token;
            status.textContent = 'Verifikasi berhasil. Anda dapat masuk.';
            updateButton();
          },
          'expired-callback': () => invalidateCaptcha('Verifikasi kedaluwarsa. Silakan selesaikan kembali.'),
          'chalexpired-callback': () => invalidateCaptcha('Waktu verifikasi habis. Silakan coba kembali.'),
          'error-callback': () => invalidateCaptcha('Verifikasi gagal. Coba kembali atau muat ulang halaman.'),
        });
        status.textContent = 'Silakan selesaikan verifikasi keamanan.';
      } catch (_) {
        invalidateCaptcha('Verifikasi gagal dimuat. Muat ulang halaman untuk mencoba lagi.');
      }
    };
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?onload=onLoginCaptchaLoad&render=explicit&hl=id';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(timeout);
      invalidateCaptcha('Verifikasi gagal dimuat. Periksa koneksi lalu muat ulang halaman.');
    };
    document.head.appendChild(script);
  }

  document.getElementById('toggle-pw').addEventListener('click', function () {
    const hidden = passwordInput.type === 'password';
    passwordInput.type = hidden ? 'text' : 'password';
    this.querySelector('.material-symbols-rounded').textContent = hidden ? 'visibility_off' : 'visibility';
    this.title = hidden ? 'Sembunyikan password' : 'Tampilkan password';
    this.setAttribute('aria-label', this.title);
  });

  document.getElementById('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (checkingSession || submitting || redirecting) return;
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    if (!email || !password) return showError('Email dan password wajib diisi.');
    if (!captchaToken) return showError('Selesaikan verifikasi keamanan terlebih dahulu.');
    submitting = true;
    updateButton();
    errorEl.classList.remove('show');
    try {
      const { error } = await authClient.auth.signInWithPassword({
        email, password, options: { captchaToken },
      });
      if (error) {
        const messages = {
          invalid_credentials: 'Email atau password salah.',
          email_not_confirmed: 'Email belum dikonfirmasi. Cek inbox email Anda.',
          over_request_rate_limit: 'Terlalu banyak percobaan. Tunggu beberapa menit.',
          over_email_send_rate_limit: 'Terlalu banyak percobaan. Tunggu beberapa menit.',
          captcha_failed: 'Verifikasi keamanan ditolak. Silakan selesaikan CAPTCHA kembali.',
          user_not_found: 'Akun tidak ditemukan.',
          'Invalid login credentials': 'Email atau password salah.',
          'Email not confirmed': 'Email belum dikonfirmasi. Cek inbox email Anda.',
          'Too many requests': 'Terlalu banyak percobaan. Tunggu beberapa menit.',
        };
        showError(messages[error.code || error.message] || 'Login gagal. Silakan coba kembali.');
        document.querySelector('.card').classList.add('shake');
        setTimeout(() => document.querySelector('.card').classList.remove('shake'), 400);
      } else {
        redirecting = true;
        window.location.replace('pages/index.html');
      }
    } catch (_) {
      showError('Tidak dapat terhubung. Periksa koneksi lalu coba kembali.');
    } finally {
      submitting = false;
      // Token hanya sekali pakai, termasuk setelah kredensial ditolak.
      resetCaptcha();
    }
  });

  updateButton();
  (async function () {
    try {
      const { data: { session }, error } = await authClient.auth.getSession();
      if (error) throw error;
      if (session) {
        redirecting = true;
        window.location.replace('pages/index.html');
        return;
      }
    } catch (_) {
      showError('Sesi tidak dapat diperiksa. Silakan masuk kembali.');
    } finally {
      checkingSession = false;
      updateButton();
    }
    loadCaptcha();
  })();
})();
