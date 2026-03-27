// nav.js — Dark Sidebar + Page Transition untuk SiAset
(function () {
  'use strict';

  /* ================================================================
     KONSTANTA & STATE
  ================================================================ */
  const PT_DURATION = 280; // harus sesuai --pt-duration di sidebar.css
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  /* ================================================================
     DATA NAVIGASI
  ================================================================ */
  const mainLinks = [
    {
      href: 'index.html',
      label: 'Daftar Aset',
      icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3"  y="3"  width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
        <rect x="11" y="3"  width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/>
        <rect x="3"  y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/>
        <rect x="11" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity=".3"/>
      </svg>`,
    },
    {
      href: 'tambah.html',
      label: 'Tambah',
      icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'barcode.html',
      label: 'Barcode',
      icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3"  y="4" width="2" height="12" rx="0.5" fill="currentColor"/>
        <rect x="7"  y="4" width="1" height="12" rx="0.5" fill="currentColor"/>
        <rect x="10" y="4" width="2" height="12" rx="0.5" fill="currentColor"/>
        <rect x="14" y="4" width="1" height="12" rx="0.5" fill="currentColor"/>
        <rect x="16" y="4" width="1" height="12" rx="0.5" fill="currentColor"/>
      </svg>`,
    },
  ];

  const kelolaLinks = [
    {
      href: 'peminjaman.html',
      label: 'Peminjaman',
      icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 10h14M13 6l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    },
    {
      href: 'penanggung-jawab.html',
      label: 'PJ Barang',
      icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'pemindahtanganan.html',
      label: 'Pindahtangan',
      icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10h12M4 10l3-3M4 10l3 3M16 10l-3-3M16 10l-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    },
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
          <main class="main-content" id="main-content">${existingContent}</main>
        </div>
      </div>
    `;
    sidebar = document.getElementById('app-sidebar');
  }

  /* ================================================================
     RENDER SIDEBAR
  ================================================================ */
  function renderNavItem(link, isSubItem) {
    const isActive = currentPage === link.href;
    return `
      <a href="${link.href}"
         class="sidebar-item${isSubItem ? ' sidebar-sub-item' : ''}${isActive ? ' active' : ''}"
         title="${link.label}">
        <span class="sidebar-item-icon">${link.icon}</span>
        <span class="sidebar-item-label">${link.label}</span>
        ${isActive ? '<span class="sidebar-item-dot"></span>' : ''}
      </a>`;
  }

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <rect x="3"  y="3"  width="8" height="8" rx="2" fill="white" opacity="0.9"/>
        <rect x="13" y="3"  width="8" height="8" rx="2" fill="white" opacity="0.5"/>
        <rect x="3"  y="13" width="8" height="8" rx="2" fill="white" opacity="0.5"/>
        <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.25"/>
      </svg>
      <span class="sidebar-logo-text">SiAset</span>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section">
        ${mainLinks.map(l => renderNavItem(l, false)).join('')}
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <p class="sidebar-section-label">Kelola</p>
        ${kelolaLinks.map(l => renderNavItem(l, true)).join('')}
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

  // Breadcrumb — set nama halaman aktif
  const allLinks = [...mainLinks, ...kelolaLinks];
  const activePage = allLinks.find(l => l.href === currentPage);
  const pageNameEl = document.getElementById('topbar-page-name');
  if (pageNameEl && activePage) pageNameEl.textContent = activePage.label;

  /* ================================================================
     SIDEBAR TOGGLE
     Satu listener, bedakan mobile vs desktop di dalam.
  ================================================================ */
  const toggleBtn  = document.getElementById('sidebar-toggle');
  const appLayout  = document.querySelector('.app-layout');

  // Buat backdrop (sekali)
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  document.body.appendChild(backdrop);

  function isMobile() { return window.innerWidth <= 768; }

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

  backdrop.addEventListener('click', () => {
    appLayout?.classList.remove('sidebar-open');
    backdrop.classList.remove('active');
  });

  // Restore state collapsed (desktop only)
  if (!isMobile() && localStorage.getItem('sidebar-collapsed') === '1') {
    appLayout?.classList.add('sidebar-collapsed');
  }

  /* ================================================================
     PAGE TRANSITION
  ================================================================ */

  // Buat overlay (sekali)
  const overlay = document.createElement('div');
  overlay.id = 'page-transition-overlay';
  document.body.appendChild(overlay);

  function navigateTo(url) {
    // Abaikan link kosong, anchor, atau halaman yang sama
    if (!url || url === '#') return;

    // Bandingkan hanya nama file (tanpa path penuh)
    const targetPage = url.split('/').pop();
    if (targetPage === currentPage) return;

    // Feedback visual pada item yang diklik
    const clickedItem = document.querySelector(`.sidebar-item[href="${url}"]`);
    clickedItem?.classList.add('is-navigating');

    document.body.classList.add('page-transitioning');
    overlay.className = 'is-entering';

    setTimeout(() => { window.location.href = url; }, PT_DURATION);
  }

  function bindSidebarLinks() {
    document.querySelectorAll('.sidebar-item[href]').forEach(link => {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Biarkan link eksternal / tab baru / modifier key lewat normal
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
  // 1. Kunci viewport height SEBELUM apapun terlihat
  document.body.style.minHeight = '100vh';
  document.body.style.overflow = 'hidden'; // cegah scrollbar shift

  // 2. Tambah .page-content SEKARANG, sebelum overlay mulai fade
  const mainContent = document.querySelector('.main-content');
  mainContent?.classList.add('page-content');

  // 3. Pastikan overlay solid dulu
  overlay.style.cssText = 'opacity:1;transform:translateX(0);transition:none';

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    overlay.style.cssText = '';
    overlay.className = 'is-leaving';

    // Delay sedikit agar overlap antara overlay out & content in
    setTimeout(() => {
      mainContent?.classList.add('page-content');
    }, 40); // 40ms overlap sudah cukup

    setTimeout(() => {
      overlay.className = '';
      document.body.classList.remove('page-transitioning');
      document.body.style.minHeight = '';
      document.body.style.overflow = '';
    }, PT_DURATION);
  });
});
}

  // Sidebar sudah dirender sync di atas, langsung bind — tidak perlu DOMContentLoaded
  bindSidebarLinks();
  playPageEnter();

  /* ================================================================
     API PUBLIK
  ================================================================ */
  window.SiAsetNav = { go: navigateTo };
})();
