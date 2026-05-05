// nav.js — Dark Sidebar + Page Transition untuk SiAset
// FIX: Mobile layout, overflow reset, click-through overlay
(function () {
  'use strict';

  const PT_DURATION = 280;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  /* ================================================================
     FIX #1 — INJECT CRITICAL MOBILE CSS
     Memastikan layout mobile benar tanpa bergantung penuh pada sidebar.css
  ================================================================ */
  (function injectMobileStyles() {
    const style = document.createElement('style');
    style.id = 'nav-mobile-critical';
    style.textContent = `
      /* ── Layout dasar ── */
      .app-layout {
        display: flex;
        width: 100%;
        min-height: 100vh;
        overflow-x: hidden;
      }
      .sidebar-main {
        flex: 1;
        min-width: 0;          /* penting: cegah flexbox overflow */
        display: flex;
        flex-direction: column;
      }
      .main-content {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      /* ── Sidebar default (desktop) ── */
      .sidebar {
        flex-shrink: 0;
        width: var(--sidebar-width, 220px);
        transition: width 0.25s ease, transform 0.25s ease;
        overflow: hidden;
      }
      .app-layout.sidebar-collapsed .sidebar {
        width: var(--sidebar-collapsed-width, 60px);
      }

      /* ── Mobile: sidebar menjadi overlay ── */
      @media (max-width: 768px) {
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }
        .sidebar {
          position: fixed !important;
          top: 0;
          left: 0;
          height: 100%;
          width: 240px !important;
          z-index: 300;
          transform: translateX(-100%);
          transition: transform 0.25s ease;
          box-shadow: none;
        }
        .app-layout.sidebar-open .sidebar {
          transform: translateX(0);
          box-shadow: 4px 0 24px rgba(0,0,0,0.35);
        }
        /* sidebar-main harus penuh saat sidebar tertutup */
        .sidebar-main {
          width: 100% !important;
          margin-left: 0 !important;
        }
        /* collapsed tidak berlaku di mobile */
        .app-layout.sidebar-collapsed .sidebar {
          width: 240px !important;
          transform: translateX(-100%);
        }
        .app-layout.sidebar-collapsed.sidebar-open .sidebar {
          transform: translateX(0);
        }
        /* Topbar full width */
        .topbar {
          width: 100% !important;
        }
      }

      /* ── Backdrop ── */
      .sidebar-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 299;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
      }
      .sidebar-backdrop.active {
        display: block;
      }

      /* ── Page transition overlay ── */
      #page-transition-overlay {
        position: fixed;
        inset: 0;
        background: var(--color-bg, #0f1117);
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transform: translateX(0);
      }
      #page-transition-overlay.is-entering {
        animation: ptEnter ${PT_DURATION}ms ease forwards;
      }
      #page-transition-overlay.is-leaving {
        animation: ptLeave ${PT_DURATION}ms ease forwards;
      }
      @keyframes ptEnter {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes ptLeave {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  })();

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
  let sidebar = document.querySelector('.sidebar');
  if (!sidebar) {
    const pageBody = document.getElementById('page-body');
    const existingContent = pageBody ? pageBody.innerHTML : '';
    pageBody?.remove();

    document.querySelectorAll('.loading-overlay, .alert').forEach(el => el.remove());

    const layout = document.createElement('div');
    layout.className = 'app-layout';
    layout.innerHTML = `
      <aside class="sidebar" id="app-sidebar"></aside>
      <div class="sidebar-main">
        <header class="topbar">
          <button class="topbar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="topbar-breadcrumb">
            <span class="topbar-app">SiAset</span>
            <span class="topbar-sep">›</span>
            <span class="topbar-page" id="topbar-page-name"></span>
          </div>
          <div class="topbar-right">
            <div class="topbar-user">
              <div class="topbar-avatar">AD</div>
              <span class="topbar-username">Admin</span>
            </div>
            <button class="topbar-logout">Keluar</button>
          </div>
        </header>
        <main class="main-content" id="page-body">${existingContent}</main>
      </div>`;

    document.body.appendChild(layout);
    sidebar = document.getElementById('app-sidebar');
  }

  /* ================================================================
     RENDER SIDEBAR
  ================================================================ */
  function renderNavItem(link) {
    const isActive = currentPage === link.href;
    return `<a href="${link.href}" class="sidebar-item${isActive ? ' active' : ''}" title="${link.label}">
      <span class="sidebar-item-icon">${link.icon}</span>
      <span class="sidebar-item-label">${link.label}</span>
      ${isActive ? '<span class="sidebar-item-dot"></span>' : ''}
    </a>`;
  }

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      <span class="sidebar-logo-text">SiAset</span>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section">
        ${mainLinks.map(l => renderNavItem(l)).join('')}
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section-label">Kelola</div>
      <div class="sidebar-section">
        ${kelolaLinks.map(l => renderNavItem(l)).join('')}
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user-info">
        <div class="sidebar-avatar">AD</div>
        <div class="sidebar-user-text">
          <span class="sidebar-user-name">Admin</span>
          <span class="sidebar-user-role">Administrator</span>
        </div>
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

  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

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

  if (!isMobile() && localStorage.getItem('sidebar-collapsed') === '1') {
    appLayout?.classList.add('sidebar-collapsed');
  }

  /* ================================================================
     PAGE TRANSITION
  ================================================================ */
  let overlay = document.getElementById('page-transition-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    document.body.appendChild(overlay);
  }

  // FIX #2 — resetPageState yang benar-benar membersihkan semua state
  function resetPageState() {
    overlay.className = '';
    overlay.style.cssText = '';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    document.body.classList.remove('page-transitioning');
    document.body.style.overflow = '';
    document.body.style.minHeight = '';
    document.body.style.pointerEvents = '';
  }

  // FIX #3 — gunakan animationend DAN timeout singkat sebagai jaga-jaga
  overlay.addEventListener('animationend', (e) => {
    if (overlay.classList.contains('is-leaving')) {
      resetPageState();
    }
  });

  function navigateTo(url) {
    if (!url || url === '#') return;
    const targetPage = url.split('/').pop();
    if (targetPage === currentPage) return;

    closeMobileSidebar();

    const clickedItem = document.querySelector(`.sidebar-item[href="${url}"]`);
    clickedItem?.classList.add('is-navigating');
    document.body.classList.add('page-transitioning');
    overlay.style.pointerEvents = 'none'; // overlay tidak boleh blokir klik
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
    closeMobileSidebar();

    // FIX #4 — JANGAN set overflow:hidden saat enter; hanya set opacity overlay
    overlay.style.cssText = 'opacity:1;pointer-events:none;transition:none;';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.className = 'is-leaving';
        document.querySelector('.main-content')?.classList.add('page-content');

        // Fallback: paksa reset jika animationend tidak terpicu (umum di mobile)
        const fallback = setTimeout(resetPageState, PT_DURATION + 200);

        overlay.addEventListener('animationend', function onEnd() {
          clearTimeout(fallback);
          resetPageState();
          overlay.removeEventListener('animationend', onEnd);
        }, { once: true });
      });
    });

    // Safety: reset saat tab kembali aktif
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
