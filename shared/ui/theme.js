// Apply the saved appearance before rendering, then mount the shared icon button.
(function () {
  'use strict';
  const storageKey = 'siaset-theme';
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['light', 'dark', 'system'].includes(value);
  let preference = 'system';
  try {
    const saved = localStorage.getItem(storageKey);
    if (valid(saved)) preference = saved;
  } catch (_) { /* Appearance remains usable when storage is unavailable. */ }

  let control;
  let icon;

  function applyTheme() {
    root.dataset.theme = preference === 'system'
      ? (systemTheme.matches ? 'dark' : 'light') : preference;
    if (control) {
      const isDark = root.dataset.theme === 'dark';
      icon.textContent = isDark ? 'light_mode' : 'dark_mode';
      const label = isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap';
      control.setAttribute('aria-label', label);
      control.title = label;
    }
  }
  applyTheme();
  systemTheme.addEventListener('change', applyTheme);

  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system';
    applyTheme();
  });

  function mountToggle() {
    control = document.createElement('button');
    control.type = 'button';
    control.className = 'theme-toggle';
    icon = document.createElement('span');
    icon.className = 'material-symbols-rounded';
    icon.setAttribute('aria-hidden', 'true');
    control.appendChild(icon);
    applyTheme();
    control.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      try { localStorage.setItem(storageKey, preference); } catch (_) { /* Session only. */ }
    });
    const topbar = document.querySelector('.topbar-right');
    if (topbar) topbar.prepend(control);
    else {
      const toolbar = document.createElement('div');
      toolbar.className = 'theme-toolbar';
      toolbar.appendChild(control);
      (document.querySelector('.wrapper') || document.body).prepend(toolbar);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountToggle, { once: true });
  else mountToggle();
})();
