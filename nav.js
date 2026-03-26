// nav.js — Render navigasi global + burger menu mobile
(function () {
  const navLinks = [
    { href: 'index.html',           icon: '📋', label: 'Daftar Aset' },
    { href: 'tambah.html',          icon: '➕', label: 'Tambah' },
    { href: 'barcode.html',         icon: '🏷️', label: 'Barcode' },
    { href: 'peminjaman.html',      icon: '🤝', label: 'Peminjaman' },
    { href: 'pengguna-barang.html', icon: '👤', label: 'Pengguna' },
        { href: 'penanggung-jawab.html', icon: '🧑‍💼', label: 'PJ Barang' },
        { href: 'pemindahtanganan.html', icon: '🔄', label: 'Pindahtangan' },
  ];

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const nav = document.querySelector('.header-nav');
  if (!nav) return;

  const linksHTML = navLinks.map(link => {
    const isActive = currentPage === link.href ? 'class="active"' : '';
    return `<a href="${link.href}" ${isActive}>
      <span>${link.icon}</span> <span>${link.label}</span>
    </a>`;
  }).join('');

  nav.innerHTML = `
    ${linksHTML}
    <span class="nav-user">👤 <span id="admin-user"></span></span>
    <button onclick="logoutAdmin()" class="btn-logout" title="Keluar">🚪 Keluar</button>
  `;

  // ——— Burger Menu ———
  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return;

  const burger = document.createElement('button');
  burger.className = 'burger-btn';
  burger.setAttribute('aria-label', 'Buka menu');
  burger.innerHTML = '<span></span><span></span><span></span>';
  headerInner.appendChild(burger);

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  function openMenu() {
    nav.classList.add('nav-open');
    backdrop.classList.add('active');
    burger.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    nav.classList.remove('nav-open');
    backdrop.classList.remove('active');
    burger.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    nav.classList.contains('nav-open') ? closeMenu() : openMenu();
  });

  backdrop.addEventListener('click', closeMenu);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
})();
