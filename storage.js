window.PH = window.PH || {};

PH.storage = (() => {
  const KEY = 'ph_saved_ideas';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  }

  function save(idea) {
    const ideas = getAll();
    const entry = {
      id: PH.helpers.uid(),
      savedAt: new Date().toISOString(),
      title: idea.title,
      tagline: idea.tagline,
      difficulty: idea.difficulty,
      buildTime: idea.buildTime,
      techStack: idea.techStack,
      problem: idea.problem,
      solution: idea.solution,
      features: idea.features,
      roadmap: idea.roadmap,
      extensions: idea.extensions,
      repoName: idea.repoName,
    };
    ideas.unshift(entry); // newest first
    localStorage.setItem(KEY, JSON.stringify(ideas));
    PH.storage.onUpdate?.();
    return entry;
  }

  function remove(id) {
    const ideas = getAll().filter(i => i.id !== id);
    localStorage.setItem(KEY, JSON.stringify(ideas));
    PH.storage.onUpdate?.();
  }

  function has(title) {
    return getAll().some(i => i.title === title);
  }

  function count() {
    return getAll().length;
  }

  // Render the saved ideas panel
  function renderSavedPanel() {
    const container = document.getElementById('saved-ideas-list');
    if (!container) return;

    const ideas = getAll();
    const badge = document.getElementById('saved-count-badge');
    if (badge) {
      badge.textContent = ideas.length;
      badge.style.display = ideas.length ? 'flex' : 'none';
    }

    if (!ideas.length) {
      container.innerHTML = `
        <div class="saved-empty">
          <div class="saved-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p class="saved-empty-title">No saved ideas yet</p>
          <p class="saved-empty-sub">Generate an idea and hit Save to keep it here.</p>
        </div>`;
      return;
    }

    container.innerHTML = ideas.map(idea => {
      const dc = PH.helpers.difficultyColor(idea.difficulty);
      const date = new Date(idea.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `
        <div class="saved-card" data-id="${idea.id}">
          <div class="saved-card-header">
            <div class="saved-card-meta">
              <span class="diff-badge" style="background:${dc.bg};color:${dc.text};border-color:${dc.border};">
                ${idea.difficulty}
              </span>
              <span class="saved-card-date">${date}</span>
            </div>
            <button class="saved-delete-btn" data-id="${idea.id}" title="Remove">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <h4 class="saved-card-title">${PH.helpers.escapeHtml(idea.title)}</h4>
          <p class="saved-card-tagline">${PH.helpers.escapeHtml(idea.tagline)}</p>
          <div class="saved-card-stack">
            ${idea.techStack.slice(0, 3).map(t => `<span class="stack-tag">${PH.helpers.escapeHtml(t)}</span>`).join('')}
            ${idea.techStack.length > 3 ? `<span class="stack-tag muted">+${idea.techStack.length - 3}</span>` : ''}
          </div>
          <div class="saved-card-footer">
            <span class="saved-card-time">⏱ ${idea.buildTime}</span>
            <button class="btn-load-idea" data-id="${idea.id}">
              Load Idea
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>`;
    }).join('');

    // Bind delete buttons
    container.querySelectorAll('.saved-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        remove(id);
        renderSavedPanel();
        PH.helpers.showToast('Idea removed', 'info');
      });
    });

    // Bind load buttons
    container.querySelectorAll('.btn-load-idea').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idea = getAll().find(i => i.id === id);
        if (idea) {
          PH.generator.renderResult(idea);
          document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
          // Close saved panel on mobile
          closeSavedPanel();
        }
      });
    });
  }

  function closeSavedPanel() {
    const panel = document.getElementById('saved-panel');
    if (panel) {
      panel.classList.remove('open');
    }
    const overlay = document.getElementById('saved-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  return {
    getAll,
    save,
    remove,
    has,
    count,
    renderSavedPanel,
    onUpdate: null, // set by app.js
  };
})();
