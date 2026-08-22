// nav.js — Shared Material 3 application shell for SiAset
(function () {
  'use strict';

  const PT_DURATION = 280;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  /* ================================================================
     DATA NAVIGASI
  ================================================================ */
  const mainLinks = [
    { href: 'index.html', label: 'Daftar Aset', icon: 'inventory_2' },
    { href: 'tambah.html', label: 'Tambah', icon: 'add_box' },
    { href: 'bulk-tambah.html', label: 'Impor CSV/XLSX', icon: 'upload_file' },
    { href: 'barcode.html', label: 'Barcode', icon: 'qr_code_2' },
    { href: 'trash.html', label: 'Trash', icon: 'delete_sweep' },
  ];

  const kelolaLinks = [
    { href: 'peminjaman.html', label: 'Peminjaman', icon: 'assignment_return' },
    { href: 'penanggung-jawab.html', label: 'PJ Barang', icon: 'person_pin' },
    { href: 'pemindahtanganan.html', label: 'Pindahtangan', icon: 'swap_horiz' },
  ];

  /* ================================================================
     BANGUN LAYOUT (jika belum ada)
  ================================================================ */
  let sidebar = document.querySelector('.sidebar');
  if (!sidebar) {
    const pageBody = document.getElementById('page-body');
    const existingContent = pageBody ? pageBody.innerHTML : '';
    pageBody?.remove();

    // Preserve utility elements used by shared feedback helpers.
    const utilityElements = Array.from(
      document.querySelectorAll('.loading-overlay, .alert')
    );

    const layout = document.createElement('div');
    layout.className = 'app-layout';
    layout.innerHTML = `
      <aside class="sidebar" id="app-sidebar"></aside>
      <div class="sidebar-main">
        <header class="topbar">
          <button class="topbar-toggle" id="sidebar-toggle" aria-label="Buka atau tutup navigasi">
            <span class="material-symbols-rounded" aria-hidden="true">menu</span>
          </button>
          <div class="topbar-breadcrumb">
            <span class="topbar-app">Inventaris</span>
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
    utilityElements.forEach(el => document.body.appendChild(el));
    sidebar = document.getElementById('app-sidebar');
  }

  /* ================================================================
     RENDER SIDEBAR
  ================================================================ */
  function renderNavItem(link) {
    const isActive = currentPage === link.href;
    return `<a href="${link.href}" class="sidebar-item${isActive ? ' active' : ''}" title="${link.label}"${isActive ? ' aria-current="page"' : ''}>
      <span class="sidebar-item-icon"><span class="material-symbols-rounded" aria-hidden="true">${link.icon}</span></span>
      <span class="sidebar-item-label">${link.label}</span>
      ${isActive ? '<span class="sidebar-item-dot"></span>' : ''}
    </a>`;
  }

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <span class="sidebar-brand-mark" aria-hidden="true"><span class="material-symbols-rounded filled">inventory_2</span></span>
      <span class="sidebar-logo-text">SiAset<small>Kecamatan Tenjo</small></span>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Inventaris</div>
      <div class="sidebar-section">
        ${mainLinks.map(l => renderNavItem(l)).join('')}
      </div>
      <div class="sidebar-section-label">Operasional</div>
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
  const utilityPages = {
    'detail.html': 'Detail Aset',
    'edit.html': 'Edit Aset',
    'trash.html': 'Trash Aset',
  };
  const activePage = allLinks.find(l => l.href === currentPage);
  const pageNameEl = document.getElementById('topbar-page-name');
  if (pageNameEl) {
    pageNameEl.textContent = activePage?.label || utilityPages[currentPage] || 'SiAset';
  }

  function bindLogout() {
    document.querySelectorAll('.topbar-logout').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (typeof window.logoutAdmin === 'function') {
          await window.logoutAdmin();
          return;
        }
        // Sign out dari Supabase sebelum redirect
        if (window.authClient?.auth) {
          await window.authClient.auth.signOut();
        }
        window.location.replace('../login.html');
      });
    });
  }

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

  /** Selaras dengan @media (max-width: 768px) — innerWidth saja bisa beda dari viewport CSS (devtools, zoom). */
  const mqMobile = window.matchMedia('(max-width: 768px)');

  function isMobile() {
    try {
      return mqMobile.matches;
    } catch (e) {
      return window.innerWidth <= 768;
    }
  }

  let resizeTimer;
  function syncLayoutForViewport() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isMobile()) {
        appLayout?.classList.remove('sidebar-collapsed');
        closeMobileSidebar();
      } else {
        closeMobileSidebar();
        if (localStorage.getItem('sidebar-collapsed') === '1') {
          appLayout?.classList.add('sidebar-collapsed');
        }
      }
    }, 100);
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

  window.addEventListener('resize', syncLayoutForViewport);
  if (typeof mqMobile.addEventListener === 'function') {
    mqMobile.addEventListener('change', syncLayoutForViewport);
  } else if (typeof mqMobile.addListener === 'function') {
    mqMobile.addListener(syncLayoutForViewport);
  }

  if (!isMobile() && localStorage.getItem('sidebar-collapsed') === '1') {
    appLayout?.classList.add('sidebar-collapsed');
  }
  /* Pastikan mode mobile tidak membawa class collapsed dari sesi desktop (edge case devtools / resize). */
  if (isMobile()) {
    appLayout?.classList.remove('sidebar-collapsed');
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
  bindLogout();
  playPageEnter();

  window.SiAsetNav = { go: navigateTo };
})();
