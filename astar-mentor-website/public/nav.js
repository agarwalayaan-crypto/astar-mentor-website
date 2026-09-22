/* ============================================================
   SHARED SIDEBAR NAVIGATION + THEME TOGGLE
   Injects the sidebar into <div id="sidebarMount"></div> and wires
   up the mobile drawer + light/dark toggle. Include a tiny inline
   theme-init snippet in <head> before this file loads, to avoid a
   flash of the wrong theme (see any page's <head> for that snippet).
============================================================ */
(function () {
  'use strict';

  const ICON = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5A1 1 0 0 0 6.5 20.5h11a1 1 0 0 0 1-1V10"/><path d="M10 20.5v-6h4v6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.9-1.9M17.5 6.5l1.9-1.9"/>',
    moon: '<path d="M20.5 13.4A8.8 8.8 0 1 1 10.6 3.5a7 7 0 0 0 9.9 9.9z"/>',
    battery: '<rect x="3" y="8" width="15" height="9" rx="2"/><path d="M20.5 11v3"/><path d="M7 12v3M10.5 12v3"/>',
    book: '<path d="M12 6.2C10.4 4.8 7.7 4 5 4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1c2.7 0 5.4.8 7 2.2"/><path d="M12 6.2C13.6 4.8 16.3 4 19 4a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1c-2.7 0-5.4.8-7 2.2z"/>',
    chart: '<path d="M3.5 3.5v16a1 1 0 0 0 1 1h16"/><rect x="7.5" y="13" width="3" height="5.5" rx="0.6"/><rect x="12.5" y="9" width="3" height="9.5" rx="0.6"/><rect x="17.5" y="6" width="3" height="12.5" rx="0.6"/>',
    cards: '<rect x="4.5" y="6.5" width="12" height="15" rx="2" transform="rotate(-8 10.5 14)"/><rect x="7.5" y="3.5" width="13" height="16.5" rx="2"/>',
    cap: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9z"/><path d="M6.5 10.8v4.6c0 1.6 2.6 3.1 5.5 3.1s5.5-1.5 5.5-3.1v-4.6"/><path d="M21.5 9v6"/>',
  };
  function svg(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`; }

  const NAV_ITEMS = [
    { href: 'index.html', icon: 'home', label: 'Dashboard' },
    { href: 'briefing.html', icon: 'target', label: 'Weekly Briefing' },
    { href: 'homework.html', icon: 'sun', label: 'Free Periods & Homework' },
    { href: 'afterschool.html', icon: 'moon', label: 'After School' },
    { href: 'weekend.html', icon: 'battery', label: 'Weekend Sprint' },
    { href: 'revision.html', icon: 'book', label: 'Syllabus Checklist' },
    { href: 'flashcards.html', icon: 'cards', label: 'Flashcards' },
    { href: 'analytics.html', icon: 'chart', label: 'Analytics' },
    { href: 'tutor.html', icon: 'cap', label: 'AI Tutor' },
  ];

  function currentPage() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
  }
  function getStoredTheme() { try { return localStorage.getItem('a_star_theme'); } catch (e) { return null; } }
  function setStoredTheme(theme) { try { localStorage.setItem('a_star_theme', theme); } catch (e) {} }
  function effectiveTheme() {
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function buildSidebar() {
    const page = currentPage();
    const linksHtml = NAV_ITEMS.map(item => `
      <a class="sidebar-link${item.href === page ? ' active' : ''}" href="${item.href}">
        <span class="ico">${svg(item.icon)}</span><span>${item.label}</span>
      </a>
    `).join('');

    return `
      <div class="sidebar-brand">
        <div class="mark">${svg('target')}</div>
        <div>
          <div class="name">The A* Mentor</div>
          <div class="tag">Year 13 Study Engine</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Sections</div>
        ${linksHtml}
      </nav>
      <div class="sidebar-footer">
        <button type="button" class="theme-toggle" id="themeToggleBtn">
          <span id="themeToggleLabel">Toggle theme</span>
          <span id="themeToggleIcon">◐</span>
        </button>
      </div>
    `;
  }

  function mount() {
    const mountEl = document.getElementById('sidebarMount');
    if (!mountEl) return;
    mountEl.className = 'sidebar';
    mountEl.innerHTML = buildSidebar();

    const scrim = document.createElement('div');
    scrim.className = 'sidebar-scrim';
    scrim.id = 'sidebarScrim';
    document.body.appendChild(scrim);

    let hamburger = document.getElementById('hamburgerBtn');
    if (!hamburger) {
      hamburger = document.createElement('button');
      hamburger.type = 'button';
      hamburger.id = 'hamburgerBtn';
      hamburger.className = 'hamburger';
      hamburger.setAttribute('aria-label', 'Open menu');
      hamburger.textContent = '☰';
      document.body.insertBefore(hamburger, document.body.firstChild);
    }

    function openDrawer() { mountEl.classList.add('open'); scrim.classList.add('open'); }
    function closeDrawer() { mountEl.classList.remove('open'); scrim.classList.remove('open'); }
    hamburger.addEventListener('click', openDrawer);
    scrim.addEventListener('click', closeDrawer);

    function refreshThemeUi() {
      const theme = effectiveTheme();
      const label = document.getElementById('themeToggleLabel');
      const icon = document.getElementById('themeToggleIcon');
      if (label) label.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
      if (icon) icon.textContent = theme === 'dark' ? '●' : '○';
    }
    refreshThemeUi();

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        setStoredTheme(next);
        applyTheme(next);
        refreshThemeUi();
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
