window.PH = window.PH || {};

(function initApp() {
  // ── Theme ──────────────────────────────────────────────────
  const THEME_KEY = 'ph_theme';

  function getTheme() {
    return localStorage.getItem(THEME_KEY) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = theme === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>`;
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  // ── Saved Panel ────────────────────────────────────────────
  function openSavedPanel() {
    PH.storage.renderSavedPanel();
    const panel = document.getElementById('saved-panel');
    const overlay = document.getElementById('saved-overlay');
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeSavedPanel() {
    const panel = document.getElementById('saved-panel');
    const overlay = document.getElementById('saved-overlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  // ── GSAP Animations ────────────────────────────────────────
  function initAnimations() {
    if (typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance
    gsap.fromTo('.hero-eyebrow',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
    );
    gsap.fromTo('.hero-title',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.2 }
    );
    gsap.fromTo('.hero-sub',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.35 }
    );
    gsap.fromTo('.hero-cta-row',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.5 }
    );

    // Generator panel scroll reveal
    gsap.fromTo('#generator-section',
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: '#generator-section', start: 'top 85%', once: true }
      }
    );

    // Selector labels
    gsap.utils.toArray('.selector-group').forEach((group, i) => {
      gsap.fromTo(group,
        { opacity: 0, x: -16 },
        {
          opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', delay: i * 0.08,
          scrollTrigger: { trigger: '#generator-section', start: 'top 80%', once: true }
        }
      );
    });

    // Stats strip scroll reveal
    gsap.fromTo('.stat-item',
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: '.stats-strip', start: 'top 90%', once: true }
      }
    );

    // Section headings
    gsap.utils.toArray('.section-heading').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        }
      );
    });
  }

  // ── Scroll-to-generator from Hero CTA ─────────────────────
  function initHeroCTA() {
    document.getElementById('hero-cta')?.addEventListener('click', () => {
      document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ── Init everything ────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme
    applyTheme(getTheme());

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

    // Saved panel open/close
    document.getElementById('btn-open-saved')?.addEventListener('click', openSavedPanel);
    document.getElementById('saved-overlay')?.addEventListener('click', closeSavedPanel);
    document.getElementById('btn-close-saved')?.addEventListener('click', closeSavedPanel);

    // Wire storage update callback
    PH.storage.onUpdate = () => {
      const badge = document.getElementById('saved-count-badge');
      if (badge) {
        const cnt = PH.storage.count();
        badge.textContent = cnt;
        badge.style.display = cnt ? 'flex' : 'none';
      }
    };

    // Render selectors
    PH.generator.renderSelectors();

    // Render trending
    PH.trending.render();

    // Generate button
    document.getElementById('generate-btn')?.addEventListener('click', PH.generator.generate);

    // Init badge
    PH.storage.onUpdate();

    // Hero CTA
    initHeroCTA();

    // GSAP
    initAnimations();

    // Init Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Navbar scroll effect
    const nav = document.getElementById('main-nav');
    if (nav) {
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
      }, { passive: true });
    }
  });
})();
