// nav.js — Render navigasi global
(function () {
  const navLinks = [
    { href: 'index.html',          icon: '📋', label: 'Daftar Aset' },
    { href: 'tambah.html',         icon: '➕', label: 'Tambah' },
    { href: 'barcode.html',        icon: '🏷️', label: 'Barcode' },
    { href: 'peminjaman.html',     icon: '🤝', label: 'Peminjaman' },
    { href: 'pengguna-barang.html',icon: '👤', label: 'Pengguna' },
  ];

  // Deteksi halaman aktif dari URL sekarang
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const nav = document.querySelector('.header-nav');
  if (!nav) return;

  // Render link-link navigasi
  const linksHTML = navLinks.map(link => {
    const isActive = currentPage === link.href ? 'class="active"' : '';
    return `<a href="${link.href}" ${isActive}>
      <span>${link.icon}</span> <span>${link.label}</span>
    </a>`;
  }).join('');

  // Render user info + logout
  nav.innerHTML = `
    ${linksHTML}
    <span class="nav-user">👤 <span id="admin-user"></span></span>
    <button onclick="logoutAdmin()" class="btn-logout" title="Keluar">🚪 Keluar</button>
  `;
})();