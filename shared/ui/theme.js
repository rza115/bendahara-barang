// Apply the saved appearance before rendering, then mount the shared selector.
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

  function applyTheme() {
    root.dataset.theme = preference === 'system'
      ? (systemTheme.matches ? 'dark' : 'light') : preference;
  }
  applyTheme();
  systemTheme.addEventListener('change', applyTheme);

  let select;
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system';
    applyTheme();
    if (select) select.value = preference;
  });

  function mountSelector() {
    const control = document.createElement('label');
    control.className = 'theme-picker';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-rounded';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'contrast';
    const caption = document.createElement('span');
    caption.className = 'theme-picker-label';
    caption.textContent = 'Tema';
    select = document.createElement('select');
    select.setAttribute('aria-label', 'Tema tampilan');
    for (const [value, text] of [['light', 'Terang'], ['dark', 'Gelap'], ['system', 'Sistem']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    }
    select.value = preference;
    select.addEventListener('change', () => {
      preference = select.value;
      applyTheme();
      try { localStorage.setItem(storageKey, preference); } catch (_) { /* Session only. */ }
    });
    control.append(icon, caption, select);
    const topbar = document.querySelector('.topbar-right');
    if (topbar) topbar.prepend(control);
    else {
      const toolbar = document.createElement('div');
      toolbar.className = 'theme-toolbar';
      toolbar.appendChild(control);
      (document.querySelector('.wrapper') || document.body).prepend(toolbar);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountSelector, { once: true });
  else mountSelector();
})();
