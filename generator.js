window.PH = window.PH || {};

PH.generator = (() => {
  let currentIdea = null;
  let selectedCategory = '';
  let selectedDifficulty = '';
  let selectedStack = new Set();

  // ── State getters ──────────────────────────────────────────
  function getState() {
    return { category: selectedCategory, difficulty: selectedDifficulty, stack: [...selectedStack] };
  }

  function getCurrentIdea() { return currentIdea; }

  // ── Render selector UI ─────────────────────────────────────
  function renderSelectors() {
    // Categories
    const catGrid = document.getElementById('category-grid');
    if (catGrid) {
      catGrid.innerHTML = PH.data.categories.map(cat => `
        <button class="selector-chip" data-type="category" data-value="${cat.id}">
          <i data-lucide="${cat.icon}" class="chip-icon"></i>
          <span>${cat.label}</span>
        </button>`).join('');
    }

    // Difficulties
    const diffGrid = document.getElementById('difficulty-grid');
    if (diffGrid) {
      diffGrid.innerHTML = PH.data.difficulties.map(d => `
        <button class="selector-chip diff-chip" data-type="difficulty" data-value="${d.id}">
          <span class="diff-chip-label">${d.label}</span>
          <span class="diff-chip-desc">${d.desc}</span>
        </button>`).join('');
    }

    // Tech Stack
    const stackGrid = document.getElementById('stack-grid');
    if (stackGrid) {
      stackGrid.innerHTML = PH.data.techStacks.map(tech => `
        <button class="selector-chip stack-chip" data-type="stack" data-value="${tech}">
          ${PH.helpers.escapeHtml(tech)}
        </button>`).join('');
    }

    // Re-init Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Bind chip events
    document.querySelectorAll('.selector-chip').forEach(chip => {
      chip.addEventListener('click', () => handleChipClick(chip));
    });
  }

  function handleChipClick(chip) {
    const type = chip.dataset.type;
    const value = chip.dataset.value;

    if (type === 'category') {
      selectedCategory = value;
      document.querySelectorAll('[data-type="category"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    } else if (type === 'difficulty') {
      selectedDifficulty = value;
      document.querySelectorAll('[data-type="difficulty"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    } else if (type === 'stack') {
      if (selectedStack.has(value)) {
        selectedStack.delete(value);
        chip.classList.remove('active');
      } else {
        selectedStack.add(value);
        chip.classList.add('active');
      }
    }
    updateGenerateButton();
  }

  function updateGenerateButton() {
    const btn = document.getElementById('generate-btn');
    if (!btn) return;
    const ready = selectedCategory && selectedDifficulty;
    btn.disabled = !ready;
    btn.classList.toggle('ready', ready);
  }

  // ── Generate flow ──────────────────────────────────────────
  async function generate() {
    if (!selectedCategory || !selectedDifficulty) {
      PH.helpers.showToast('Please select a category and difficulty first', 'warning');
      return;
    }

    const btn = document.getElementById('generate-btn');
    const resultSection = document.getElementById('result-section');

    // Show loading state
    setGenerateLoading(true);
    showResultSkeleton();
    resultSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const categoryLabel = PH.data.categories.find(c => c.id === selectedCategory)?.label || selectedCategory;
      const difficultyLabel = PH.data.difficulties.find(d => d.id === selectedDifficulty)?.label || selectedDifficulty;

      const idea = await PH.ai.generateProjectIdea({
        category: categoryLabel,
        difficulty: difficultyLabel,
        techStack: [...selectedStack],
      });

      currentIdea = idea;
      renderResult(idea);
    } catch (err) {
      hideResultSkeleton();
      PH.helpers.showToast(err.message || 'Generation failed. Try again.', 'error', 4000);
      console.error('[PH.generator] Error:', err);
    } finally {
      setGenerateLoading(false);
    }
  }

  function setGenerateLoading(isLoading) {
    const btn = document.getElementById('generate-btn');
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `
        <span class="btn-spinner"></span>
        Generating...`;
    } else {
      btn.disabled = !(selectedCategory && selectedDifficulty);
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Generate Idea`;
    }
  }

  function showResultSkeleton() {
    const resultSection = document.getElementById('result-section');
    if (!resultSection) return;
    resultSection.style.display = 'block';
    const inner = document.getElementById('result-inner');
    if (!inner) return;
    inner.innerHTML = `
      <div class="result-skeleton">
        <div class="skel-badge"></div>
        <div class="skel-line w-2/3 h-8"></div>
        <div class="skel-line w-1/2"></div>
        <div class="skel-divider"></div>
        <div class="skel-label"></div>
        <div class="skel-line w-full"></div>
        <div class="skel-line w-4/5"></div>
        <div class="skel-divider"></div>
        <div class="skel-label"></div>
        <div class="skel-line w-full"></div>
        <div class="skel-line w-3/4"></div>
        <div class="skel-line w-full"></div>
        <div class="skel-divider"></div>
        <div class="skel-chips">
          <div class="skel-chip"></div><div class="skel-chip"></div><div class="skel-chip"></div>
        </div>
      </div>`;
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(inner, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    } else {
      inner.style.opacity = '1';
    }
  }

  function hideResultSkeleton() {
    const resultSection = document.getElementById('result-section');
    if (resultSection) resultSection.style.display = 'none';
  }

  // ── Render full result ─────────────────────────────────────
  function renderResult(idea) {
    const resultSection = document.getElementById('result-section');
    const inner = document.getElementById('result-inner');
    if (!inner) return;

    currentIdea = idea;
    resultSection.style.display = 'block';

    const dc = PH.helpers.difficultyColor(idea.difficulty);
    const isSaved = PH.storage.has(idea.title);

    inner.innerHTML = `
      <!-- Header -->
      <div class="result-header">
        <div class="result-header-left">
          <div class="result-badges">
            <span class="diff-badge" style="background:${dc.bg};color:${dc.text};border-color:${dc.border};">
              ${PH.helpers.escapeHtml(idea.difficulty)}
            </span>
            ${idea._model ? `<span class="model-badge" title="Generated by ${idea._model}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10" stroke-dasharray="4 2"/>
              </svg>
              ${idea._model}
            </span>` : ''}
          </div>
          <h2 class="result-title">${PH.helpers.escapeHtml(idea.title)}</h2>
          <p class="result-tagline">${PH.helpers.escapeHtml(idea.tagline)}</p>
        </div>
        <div class="result-header-actions">
          <button class="btn-icon-action" id="btn-save-idea" title="${isSaved ? 'Already saved' : 'Save idea'}" ${isSaved ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'var(--accent)' : 'none'}" stroke="${isSaved ? 'var(--accent)' : 'currentColor'}" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            ${isSaved ? 'Saved' : 'Save'}
          </button>
          <button class="btn-icon-action" id="btn-copy-idea" title="Copy full idea">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
        </div>
      </div>

      <!-- Problem & Solution -->
      <div class="result-grid-2">
        <div class="result-card-section">
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Problem
          </div>
          <p class="result-body-text">${PH.helpers.escapeHtml(idea.problem)}</p>
        </div>
        <div class="result-card-section">
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Solution
          </div>
          <p class="result-body-text">${PH.helpers.escapeHtml(idea.solution)}</p>
        </div>
      </div>

      <!-- Build Time -->
      ${PH.roadmap.renderBuildTime(idea.difficulty, idea.buildTime)}

      <!-- Key Features -->
      <div class="result-section-block">
        <div class="section-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Key Features
        </div>
        <ul class="features-list">
          ${idea.features.map(f => `
            <li class="feature-item">
              <span class="feature-dot"></span>
              <span>${PH.helpers.escapeHtml(f)}</span>
            </li>`).join('')}
        </ul>
      </div>

      <!-- Tech Stack -->
      <div class="result-section-block">
        <div class="section-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Tech Stack
        </div>
        <div class="stack-chips">
          ${idea.techStack.map(t => `<span class="stack-tag large">${PH.helpers.escapeHtml(t)}</span>`).join('')}
        </div>
      </div>

      <!-- Roadmap -->
      <div class="result-section-block">
        <div class="section-label-row">
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Project Roadmap
          </div>
          <button class="btn-copy-small" id="btn-copy-roadmap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Roadmap
          </button>
        </div>
        ${PH.roadmap.render(idea.roadmap)}
      </div>

      <!-- Future Extensions -->
      <div class="result-section-block">
        <div class="section-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Future Extensions
        </div>
        <ul class="extensions-list">
          ${idea.extensions.map((e, i) => `
            <li class="extension-item">
              <span class="ext-num">${i + 1}</span>
              <span>${PH.helpers.escapeHtml(e)}</span>
            </li>`).join('')}
        </ul>
      </div>

      <!-- GitHub Repo Generator -->
      <div class="result-section-block github-wrapper" id="github-wrapper">
        <div class="section-label-row">
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            GitHub Repo
          </div>
          <button class="btn-generate-github" id="btn-generate-github">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Generate GitHub Repo
          </button>
        </div>
        <div id="github-artifacts-container">
          <div class="github-prompt-hint">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            <span>Click "Generate GitHub Repo" to create your README.md, folder structure, and .gitignore</span>
          </div>
        </div>
      </div>`;

    // Bind result action buttons
    bindResultEvents(inner, idea);

    // Animate result in
    if (typeof gsap !== 'undefined') {
      gsap.fromTo('#result-inner',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
      gsap.fromTo('.result-section-block, .result-grid-2, .build-time-card, .result-header',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.1, ease: 'power2.out' }
      );
    }
  }

  function bindResultEvents(container, idea) {
    // Save idea
    const saveBtn = container.querySelector('#btn-save-idea');
    if (saveBtn && !saveBtn.disabled) {
      saveBtn.addEventListener('click', () => {
        PH.storage.save(idea);
        saveBtn.disabled = true;
        saveBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Saved`;
        PH.helpers.showToast('Idea saved!', 'success');
        PH.storage.renderSavedPanel();
      });
    }

    // Copy full idea
    container.querySelector('#btn-copy-idea')?.addEventListener('click', () => {
      PH.helpers.copyToClipboard(PH.helpers.formatIdeaAsText(idea), 'Idea');
    });

    // Copy roadmap
    container.querySelector('#btn-copy-roadmap')?.addEventListener('click', () => {
      PH.helpers.copyToClipboard(PH.helpers.formatRoadmapAsText(idea.roadmap), 'Roadmap');
    });

    // Generate GitHub Repo
    const ghBtn = container.querySelector('#btn-generate-github');
    const ghContainer = container.querySelector('#github-artifacts-container');
    if (ghBtn && ghContainer) {
      ghBtn.addEventListener('click', async () => {
        ghBtn.disabled = true;
        ghBtn.innerHTML = `<span class="btn-spinner"></span> Generating...`;
        ghContainer.innerHTML = PH.github.renderSkeleton();

        try {
          const artifacts = await PH.ai.generateGithubArtifacts(idea);
          ghContainer.innerHTML = PH.github.renderArtifacts(artifacts, idea.repoName);
          PH.github.bindTabEvents(ghContainer);
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(ghContainer,
              { opacity: 0, y: 12 },
              { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
            );
          }
          ghBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Regenerate`;
          ghBtn.disabled = false;
          ghBtn.addEventListener('click', async () => {
            // Allow regeneration
            ghBtn.disabled = true;
            ghBtn.innerHTML = `<span class="btn-spinner"></span> Regenerating...`;
            ghContainer.innerHTML = PH.github.renderSkeleton();
            try {
              const newArtifacts = await PH.ai.generateGithubArtifacts(idea);
              ghContainer.innerHTML = PH.github.renderArtifacts(newArtifacts, idea.repoName);
              PH.github.bindTabEvents(ghContainer);
            } catch (err) {
              ghContainer.innerHTML = `<p class="error-text">${err.message}</p>`;
            } finally {
              ghBtn.disabled = false;
              ghBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Regenerate`;
            }
          }, { once: true });
        } catch (err) {
          ghContainer.innerHTML = `<p class="error-text">${PH.helpers.escapeHtml(err.message)}</p>`;
          ghBtn.disabled = false;
          ghBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Retry`;
          PH.helpers.showToast(err.message, 'error', 4000);
        }
      });
    }
  }

  return {
    renderSelectors,
    generate,
    getState,
    getCurrentIdea,
    renderResult,
  };
})();
