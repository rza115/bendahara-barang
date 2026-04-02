// ============================================
// main.js — Entry point aplikasi
// ============================================

(async () => {
  const ready = await window._appReady;
  if (!ready) return;

  db = window._authClient;

  const page = document.body.dataset.page;

  if (page === 'index')             { initBarangPage();           }
  if (page === 'tambah')            { initTambahPage();           }
  if (page === 'edit')              { initEditPage();             }
  if (page === 'detail')            { initDetailPage();           }
  if (page === 'pemindahtanganan')  { initPemindahtangananPage(); }
  if (page === 'pj')                { initPJPage();               }
  if (page === 'peminjaman')        { initPeminjaman();           }
  if (page === 'barcode')           { initBarcodePage();          }
})();
