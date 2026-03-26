// nav.js — Render navigasi global + burger menu mobile
(function () {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const mainLinks = [
    { href: 'index.html',  icon: '📋', label: 'Daftar Aset' },
    { href: 'tambah.html', icon: '➕', label: 'Tambah' },
    { href: 'barcode.html', icon: '🏷️', label: 'Barcode' },
  ];

  const kelolaLinks = [
    { href: 'peminjaman.html',       icon: '🤝', label: 'Peminjaman' },
    { href: 'penanggung-jawab.html', icon: '🧑‍💼', label: 'PJ Barang' },
    { href: 'pemindahtanganan.html', icon: '🔄', label: 'Pindahtangan' },
  ];

  const kelolaPages = kelolaLinks.map(l => l.href);
  const isKelolaActive = kelolaPages.includes(currentPage);

  const nav = document.querySelector('.header-nav');
  if (!nav) return;

  const mainHTML = mainLinks.map(link => {
    const isActive = currentPage === link.href ? 'class="active"' : '';
    return `<a href="${link.href}" ${isActive}><span>${link.icon}</span> <span>${link.label}</span></a>`;
  }).join('');

  const kelolaItemsHTML = kelolaLinks.map(link => {
    const isActive = currentPage === link.href ? 'style="font-weight:600;color:var(--primary)"' : '';
    return `<a href="${link.href}" class="dropdown-item" ${isActive}><span>${link.icon}</span> ${link.label}</a>`;
  }).join('');

  nav.innerHTML = `
    ${mainHTML}
    <div class="nav-dropdown ${isKelolaActive ? 'active' : ''}">
      <button class="nav-dropdown-btn ${isKelolaActive ? 'active' : ''}">
        ⚙️ Kelola <span class="nav-dropdown-arrow">▾</span>
      </button>
      <div class="nav-dropdown-menu">
        ${kelolaItemsHTML}
      </div>
    </div>
    <span class="nav-user">👤 <span id="admin-user"></span></span>
    <button onclick="logoutAdmin()" class="btn-logout" title="Keluar">🚪 Keluar</button>
  `;

  // ——— Dropdown toggle ———
  const dropdownEl  = nav.querySelector('.nav-dropdown');
  const dropdownBtn = nav.querySelector('.nav-dropdown-btn');
  const dropdownMenu = nav.querySelector('.nav-dropdown-menu');

  dropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdownMenu.classList.contains('open');
    dropdownMenu.classList.toggle('open', !isOpen);
    dropdownBtn.querySelector('.nav-dropdown-arrow').textContent = isOpen ? '▾' : '▴';
  });

  document.addEventListener('click', () => {
    dropdownMenu?.classList.remove('open');
    const arrow = dropdownBtn?.querySelector('.nav-dropdown-arrow');
    if (arrow) arrow.textContent = '▾';
  });

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
