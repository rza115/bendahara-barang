// ============================================
// main.js — Entry point aplikasi
// Menentukan halaman aktif dan memanggil init yang sesuai
// ============================================

(async () => {
  const ready = await window._appReady;
  if (!ready) return;

  // db dipakai oleh semua service — ambil dari auth client
  db = window._authClient;

  const page = document.body.dataset.page;

  if (page === 'index') {
    initBarangPage();
  }

  // Tahap berikutnya akan ditambahkan di sini:
  // if (page === 'tambah')         { ... }
  // if (page === 'edit')           { ... }
  // if (page === 'detail')         { ... }
  // if (page === 'pemindahtanganan') { ... }
})();
