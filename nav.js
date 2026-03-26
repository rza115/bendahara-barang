// nav.js — Dark Sidebar navigasi global
(function () {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const mainLinks = [
    { href: 'index.html',  icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="11" y="3" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="3" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="11" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity=".3"/></svg>`, label: 'Daftar Aset' },
    { href: 'tambah.html', icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`, label: 'Tambah' },
    { href: 'barcode.html', icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="2" height="12" rx="0.5" fill="currentColor"/><rect x="7" y="4" width="1" height="12" rx="0.5" fill="currentColor"/><rect x="10" y="4" width="2" height="12" rx="0.5" fill="currentColor"/><rect x="14" y="4" width="1" height="12" rx="0.5" fill="currentColor"/><rect x="16" y="4" width="1" height="12" rx="0.5" fill="currentColor"/></svg>`, label: 'Barcode' },
  ];

  const kelolaLinks = [
    { href: 'peminjaman.html',       icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10h14M13 6l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`, label: 'Peminjaman' },
    { href: 'penanggung-jawab.html', icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`, label: 'PJ Barang' },
    { href: 'pemindahtanganan.html', icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10h12M4 10l3-3M4 10l3 3M16 10l-3-3M16 10l-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`, label: 'Pindahtangan' },
  ];

  const kelolaPages = kelolaLinks.map(l => l.href);
  const isKelolaActive = kelolaPages.includes(currentPage);

  // Pastikan elemen sidebar ada, jika belum buat struktur layout
  let sidebar = document.getElementById('app-sidebar');
  if (!sidebar) {
    // Bungkus body content dengan layout wrapper
    const existingContent = document.body.innerHTML;
    document.body.innerHTML = `
      <div class="app-layout">
        <aside id="app-sidebar" class="sidebar"></aside>
        <div class="sidebar-main">
          <header class="topbar">
            <button id="sidebar-toggle" class="topbar-toggle" aria-label="Toggle sidebar">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="topbar-breadcrumb">
              <span class="topbar-app">SiAset</span>
              <span class="topbar-sep">›</span>
              <span class="topbar-page" id="topbar-page-name"></span>
            </div>
            <div class="topbar-right">
              <div class="topbar-user">
                <div class="topbar-avatar" id="topbar-avatar">AD</div>
                <span class="topbar-username" id="admin-user"></span>
              </div>
              <button onclick="logoutAdmin()" class="topbar-logout" title="Keluar">
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <path d="M13 3h4v14h-4M9 14l4-4-4-4M13 10H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Keluar
              </button>
            </div>
          </header>
          <main class="main-content">${existingContent}</main>
        </div>
      </div>
    `;
    sidebar = document.getElementById('app-sidebar');
  }

  // Cari nama halaman aktif untuk breadcrumb
  const allLinks = [...mainLinks, ...kelolaLinks];
  const activePage = allLinks.find(l => l.href === currentPage);
  const pageNameEl = document.getElementById('topbar-page-name');
  if (pageNameEl && activePage) pageNameEl.textContent = activePage.label;

  // ——— Render sidebar ———
  const logoHTML = `
    <div class="sidebar-logo">
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <rect x="3" y="3" width="8" height="8" rx="2" fill="white" opacity="0.9"/>
        <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.5"/>
        <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.5"/>
        <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.25"/>
      </svg>
      <span class="sidebar-logo-text">SiAset</span>
    </div>
  `;

  const mainNavHTML = mainLinks.map(link => {
    const isActive = currentPage === link.href;
    return `
      <a href="${link.href}" class="sidebar-item ${isActive ? 'active' : ''}" title="${link.label}">
        <span class="sidebar-item-icon">${link.icon}</span>
        <span class="sidebar-item-label">${link.label}</span>
        ${isActive ? '<span class="sidebar-item-dot"></span>' : ''}
      </a>
    `;
  }).join('');

  const kelolaNavHTML = kelolaLinks.map(link => {
    const isActive = currentPage === link.href;
    return `
      <a href="${link.href}" class="sidebar-item sidebar-sub-item ${isActive ? 'active' : ''}" title="${link.label}">
        <span class="sidebar-item-icon">${link.icon}</span>
        <span class="sidebar-item-label">${link.label}</span>
        ${isActive ? '<span class="sidebar-item-dot"></span>' : ''}
      </a>
    `;
  }).join('');

  sidebar.innerHTML = `
    ${logoHTML}
    <nav class="sidebar-nav">
      <div class="sidebar-section">
        ${mainNavHTML}
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <p class="sidebar-section-label">Kelola</p>
        ${kelolaNavHTML}
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user-info">
        <div class="sidebar-avatar" id="sidebar-avatar">AD</div>
        <div class="sidebar-user-text">
          <span class="sidebar-user-name" id="sidebar-user-name">Admin</span>
          <span class="sidebar-user-role">Administrator</span>
        </div>
      </div>
    </div>
  `;

  // ——— Sidebar Toggle (mobile + collapse) ———
  const toggleBtn = document.getElementById('sidebar-toggle');
  const appLayout = document.querySelector('.app-layout');

  toggleBtn?.addEventListener('click', () => {
    appLayout?.classList.toggle('sidebar-collapsed');
    const isCollapsed = appLayout?.classList.contains('sidebar-collapsed');
    localStorage.setItem('sidebar-collapsed', isCollapsed ? '1' : '0');
  });

  // Restore state dari localStorage
  if (localStorage.getItem('sidebar-collapsed') === '1') {
    appLayout?.classList.add('sidebar-collapsed');
  }

  // ——— Backdrop untuk mobile ———
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  document.body.appendChild(backdrop);

  backdrop.addEventListener('click', () => {
    appLayout?.classList.remove('sidebar-open');
    backdrop.classList.remove('active');
  });

  // Mobile toggle pakai class sidebar-open bukan collapsed
  if (window.innerWidth < 768) {
    toggleBtn?.addEventListener('click', () => {
      appLayout?.classList.toggle('sidebar-open');
      backdrop.classList.toggle('active');
    });
  }
})();
