/* ============================================================
   SHARED SIDEBAR NAVIGATION + THEME TOGGLE
   Injects the sidebar into <div id="sidebarMount"></div> and wires
   up the mobile drawer + light/dark toggle. Include mentor-shared.js
   before this file is not required, but load this AFTER a tiny
   inline theme-init snippet in <head> to avoid a flash of the wrong
   theme (see any page's <head> for that snippet).
============================================================ */
(function () {
  'use strict';

  const NAV_ITEMS = [
    { href: 'index.html',      icon: '🏠', label: 'Dashboard Home' },
    { href: 'briefing.html',   icon: '🎯', label: 'Weekly Briefing' },
    { href: 'homework.html',   icon: '☀️', label: 'Free Periods & Homework' },
    { href: 'afterschool.html', icon: '🌙', label: 'After School' },
    { href: 'weekend.html',    icon: '🔋', label: 'Weekend Sprint' },
    { href: 'revision.html',   icon: '📘', label: 'Syllabus Checklist' },
    { href: 'analytics.html',  icon: '📊', label: 'Analytics' },
    { href: 'pomodoro.html',   icon: '⏱️', label: 'Pomodoro' },
    { href: 'tutor.html',      icon: '🎓', label: 'AI Tutor' },
  ];

  function currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function getStoredTheme() {
    try { return localStorage.getItem('a_star_theme'); } catch (e) { return null; }
  }

  function setStoredTheme(theme) {
    try { localStorage.setItem('a_star_theme', theme); } catch (e) { /* ignore */ }
  }

  function effectiveTheme() {
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function buildSidebar() {
    const page = currentPage();
    const linksHtml = NAV_ITEMS.map(item => `
      <a class="sidebar-link${item.href === page ? ' active' : ''}" href="${item.href}">
        <span class="ico">${item.icon}</span><span>${item.label}</span>
      </a>
    `).join('');

    return `
      <div class="sidebar-brand">
        <div class="mark">🧠</div>
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
          <span id="themeToggleIcon">🌓</span>
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

    function openDrawer() {
      mountEl.classList.add('open');
      scrim.classList.add('open');
    }
    function closeDrawer() {
      mountEl.classList.remove('open');
      scrim.classList.remove('open');
    }
    hamburger.addEventListener('click', openDrawer);
    scrim.addEventListener('click', closeDrawer);

    function refreshThemeUi() {
      const theme = effectiveTheme();
      const label = document.getElementById('themeToggleLabel');
      const icon = document.getElementById('themeToggleIcon');
      if (label) label.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
      if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
