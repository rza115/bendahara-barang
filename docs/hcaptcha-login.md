# hCaptcha untuk login

Login mengirim token hCaptcha melalui `options.captchaToken` ke Supabase Auth.
Verifikasi server dilakukan oleh Supabase setelah perlindungan CAPTCHA diaktifkan.
Pemeriksaan di browser saja tidak melindungi endpoint login dari permintaan langsung.

## Aktivasi

1. Buat site di dashboard hCaptcha dan daftarkan hostname aplikasi yang digunakan, termasuk domain produksi atau staging.
2. Isi `window.HCAPTCHA_SITEKEY` di `shared/auth/captcha-config.js` dengan **sitekey publik** dari site tersebut.
3. Pada Supabase Dashboard, buka pengaturan Authentication → Bot and Abuse Protection. Aktifkan **Enable CAPTCHA protection**, pilih **hCaptcha**, masukkan **secret key** dari akun hCaptcha yang sama, lalu simpan.
4. Deploy file aplikasi dengan sitekey yang sudah diisi. Koordinasikan aktivasi Supabase dan deployment agar pengguna tidak menemui konfigurasi yang belum lengkap.

Secret key hanya disimpan di Supabase Dashboard; jangan masukkan ke HTML, JavaScript, atau Git. Aplikasi statis ini tidak membaca `.env` untuk konfigurasi frontend. Sitekey kosong membuat login baru diblokir dengan pesan konfigurasi belum tersedia; sesi yang sudah aktif tetap diarahkan ke dashboard.

## Pengujian

- Jalankan `node --test tests/*.test.cjs` untuk pengujian otomatis dengan Supabase dan SDK hCaptcha tiruan.
- Di staging, pastikan CAPTCHA tampil pada desktop dan ponsel. Login dengan CAPTCHA valid dan kredensial benar harus menuju dashboard.
- Coba password salah, token kedaluwarsa, dan koneksi gagal: percobaan berikutnya harus meminta verifikasi baru.
- Pastikan permintaan langsung ke Supabase Auth tanpa token atau dengan token palsu ditolak setelah proteksi diaktifkan. Ini diperlukan untuk memastikan perlindungan server, bukan hanya tombol browser.
- hCaptcha tidak mendukung hostname `localhost`/`127.0.0.1`; gunakan domain pengembangan yang dipetakan lewat hosts atau URL tunnel yang didaftarkan di hCaptcha.
- Jika memakai test keys resmi hCaptcha, gunakan hanya proyek staging terpisah dengan pasangan sitekey/secret pengujian yang sesuai, lalu ganti dengan key produksi sebelum rilis.
- Bila hosting menerapkan CSP, izinkan `https://hcaptcha.com` dan `https://*.hcaptcha.com` pada `script-src`, `frame-src`, `style-src`, serta `connect-src`.

Referensi: [integrasi hCaptcha](https://docs.hcaptcha.com/integrations), [panduan hCaptcha](https://docs.hcaptcha.com/), dan [CAPTCHA Supabase Auth](https://supabase.com/docs/guides/auth/auth-captcha).
