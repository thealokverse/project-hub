window.PH = window.PH || {};

PH.trending = (() => {
  function render() {
    const container = document.getElementById('trending-grid');
    if (!container) return;

    const items = PH.data.trending;

    container.innerHTML = items.map((item, i) => {
      const dc = PH.helpers.difficultyColor(item.difficulty);
      return `
        <div class="trending-card" data-index="${i}" style="animation-delay:${i * 60}ms">
          ${item.hot ? '<div class="trending-hot-badge">🔥 Trending</div>' : ''}
          <div class="trending-card-top">
            <span class="trending-category">${item.category}</span>
            <span class="diff-badge" style="background:${dc.bg};color:${dc.text};border-color:${dc.border};">${item.difficulty}</span>
          </div>
          <h3 class="trending-card-title">${PH.helpers.escapeHtml(item.title)}</h3>
          <p class="trending-card-desc">${PH.helpers.escapeHtml(item.description)}</p>
          <div class="trending-card-tags">
            ${item.tags.map(t => `<span class="tag-pill">${PH.helpers.escapeHtml(t)}</span>`).join('')}
          </div>
        </div>`;
    }).join('');

    // GSAP staggered entrance
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo('.trending-card',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.07,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#trending-section',
            start: 'top 80%',
            once: true,
          },
        }
      );
    }
  }

  return { render };
})();
