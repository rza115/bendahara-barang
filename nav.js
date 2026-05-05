// nav.js — Dark Sidebar + Page Transition untuk SiAset
(function () {
  'use strict';

  const PT_DURATION = 280;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  /* ================================================================
     DATA NAVIGASI
  ================================================================ */
  const mainLinks = [
    { href: 'index.html', label: 'Daftar Aset', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
    { href: 'tambah.html', label: 'Tambah', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` },
    { href: 'barcode.html', label: 'Barcode', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="7" x2="8" y2="17"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="16" y1="7" x2="16" y2="17"/></svg>` },
  ];

  const kelolaLinks = [
    { href: 'peminjaman.html', label: 'Peminjaman', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>` },
    { href: 'penanggung-jawab.html', label: 'PJ Barang', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    { href: 'pemindahtanganan.html', label: 'Pindahtangan', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>` },
  ];

  /* ================================================================
     BANGUN LAYOUT (jika belum ada)
  ================================================================ */
  let sidebar = document.getElementById('app-sidebar');
  if (!sidebar) {
    const pageBody = document.getElementById('page-body');
    const existingContent = pageBody ? pageBody.outerHTML : '';
    pageBody?.remove();
    document.body.innerHTML = `
      <div class="app-layout">
        <aside class="app-sidebar" id="app-sidebar"></aside>
        <div class="main-wrapper">
          <header class="topbar">
            <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span class="topbar-title">SiAset &nbsp;›&nbsp; <span id="topbar-page-name"></span></span>
            <div class="topbar-right">
              <div class="topbar-avatar">AD</div>
              <button class="topbar-logout">Keluar</button>
            </div>
          </header>
          <main class="main-content" id="page-body">
            ${existingContent}
          </main>
        </div>
      </div>`;
    sidebar = document.getElementById('app-sidebar');
  }

  /* ================================================================
     RENDER SIDEBAR
  ================================================================ */
  function renderNavItem(link) {
    const isActive = currentPage === link.href;
    return `<a href="${link.href}" class="sidebar-item${isActive ? ' active' : ''}">
      ${link.icon}
      <span>${link.label}</span>
      ${isActive ? '<span class="active-dot"></span>' : ''}
    </a>`;
  }

  sidebar.innerHTML = `
    <div class="sidebar-brand">SiAset</div>
    <nav class="sidebar-nav">
      ${mainLinks.map(l => renderNavItem(l)).join('')}
      <div class="sidebar-section-label">Kelola</div>
      ${kelolaLinks.map(l => renderNavItem(l)).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-avatar">AD</div>
      <div class="sidebar-user-info">
        <span class="sidebar-user-name">Admin</span>
        <span class="sidebar-user-role">Administrator</span>
      </div>
    </div>`;

  const allLinks = [...mainLinks, ...kelolaLinks];
  const activePage = allLinks.find(l => l.href === currentPage);
  const pageNameEl = document.getElementById('topbar-page-name');
  if (pageNameEl && activePage) pageNameEl.textContent = activePage.label;

  /* ================================================================
     SIDEBAR TOGGLE
  ================================================================ */
  const toggleBtn = document.getElementById('sidebar-toggle');
  const appLayout = document.querySelector('.app-layout');

  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  document.body.appendChild(backdrop);

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function closeMobileSidebar() {
    appLayout?.classList.remove('sidebar-open');
    backdrop.classList.remove('active');
  }

  toggleBtn?.addEventListener('click', () => {
    if (isMobile()) {
      appLayout?.classList.toggle('sidebar-open');
      backdrop.classList.toggle('active');
    } else {
      appLayout?.classList.toggle('sidebar-collapsed');
      localStorage.setItem(
        'sidebar-collapsed',
        appLayout?.classList.contains('sidebar-collapsed') ? '1' : '0'
      );
    }
  });

  backdrop.addEventListener('click', closeMobileSidebar);

  // FIX: Reset layout saat resize dari mobile ke desktop (atau sebaliknya)
  window.addEventListener('resize', () => {
    if (isMobile()) {
      appLayout?.classList.remove('sidebar-collapsed');
      closeMobileSidebar();
    } else {
      closeMobileSidebar();
      if (localStorage.getItem('sidebar-collapsed') === '1') {
        appLayout?.classList.add('sidebar-collapsed');
      }
    }
  });

  // Restore collapsed state (desktop only)
  if (!isMobile() && localStorage.getItem('sidebar-collapsed') === '1') {
    appLayout?.classList.add('sidebar-collapsed');
  }

  /* ================================================================
     PAGE TRANSITION
  ================================================================ */
  const overlay = document.createElement('div');
  overlay.id = 'page-transition-overlay';
  document.body.appendChild(overlay);

  function resetPageState() {
    overlay.className = '';
    overlay.style.cssText = '';
    document.body.classList.remove('page-transitioning');
    document.body.style.minHeight = '';
    document.body.style.overflow = '';
    // FIX: Pastikan konten selalu bisa diklik setelah transisi
    document.body.style.pointerEvents = '';
    overlay.style.pointerEvents = 'none';
  }

  overlay.addEventListener('animationend', () => {
    if (overlay.classList.contains('is-entering')) {
      resetPageState();
    }
  });

  function navigateTo(url) {
    if (!url || url === '#') return;
    const targetPage = url.split('/').pop();
    if (targetPage === currentPage) return;

    // FIX: Tutup sidebar mobile sebelum navigasi
    closeMobileSidebar();

    const clickedItem = document.querySelector(`.sidebar-item[href="${url}"]`);
    clickedItem?.classList.add('is-navigating');
    document.body.classList.add('page-transitioning');
    overlay.className = 'is-entering';

    setTimeout(() => {
      window.location.href = url;
    }, PT_DURATION);
  }

  function bindSidebarLinks() {
    document.querySelectorAll('.sidebar-item[href]').forEach(link => {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (
          !href ||
          href.startsWith('http') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          this.target === '_blank' ||
          e.ctrlKey || e.metaKey || e.shiftKey
        ) return;
        e.preventDefault();
        navigateTo(href);
      });
    });
  }

  function playPageEnter() {
    // FIX: Reset backdrop/sidebar mobile saat halaman baru dimuat
    closeMobileSidebar();

    document.body.style.minHeight = '100vh';
    document.body.style.overflow = 'hidden';

    const mainContent = document.querySelector('.main-content');
    mainContent?.classList.add('page-content');

    overlay.style.cssText = 'opacity:1;transform:translateX(0);transition:none';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.cssText = '';
        overlay.className = 'is-leaving';

        setTimeout(() => {
          mainContent?.classList.add('page-content');
        }, 40);

        // FIX: Hard reset — buffer tambahan 300ms untuk browser mobile lambat
        setTimeout(resetPageState, PT_DURATION + 300);
      });
    });

    // FIX: Safety reset saat tab kembali aktif (browser mobile throttle)
    document.addEventListener('visibilitychange', function onVisible() {
      if (!document.hidden) {
        resetPageState();
        document.removeEventListener('visibilitychange', onVisible);
      }
    });
  }

  bindSidebarLinks();
  playPageEnter();

  window.SiAsetNav = { go: navigateTo };
})();
