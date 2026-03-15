window.PH = window.PH || {};

PH.github = (() => {
  let currentArtifacts = null;

  function renderSkeleton() {
    return `
      <div class="github-skeleton">
        <div class="skel-line w-40"></div>
        <div class="skel-line w-full"></div>
        <div class="skel-line w-3/4"></div>
        <div class="skel-line w-full"></div>
        <div class="skel-line w-1/2"></div>
      </div>`;
  }

  function renderArtifacts(artifacts, repoName) {
    currentArtifacts = artifacts;
    return `
      <div class="github-section">
        <!-- Tabs -->
        <div class="github-tabs">
          <button class="github-tab active" data-tab="readme">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            README.md
          </button>
          <button class="github-tab" data-tab="structure">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            Folder Structure
          </button>
          <button class="github-tab" data-tab="gitignore">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            .gitignore
          </button>
        </div>

        <!-- Tab Contents -->
        <div class="github-tab-content active" id="gh-tab-readme">
          <div class="code-block-header">
            <span class="code-block-label">README.md</span>
            <button class="btn-copy-small" data-copy="readme">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
          </div>
          <pre class="code-block"><code>${PH.helpers.escapeHtml(artifacts.readme)}</code></pre>
        </div>

        <div class="github-tab-content" id="gh-tab-structure">
          <div class="code-block-header">
            <span class="code-block-label">${PH.helpers.escapeHtml(repoName || 'project')}/</span>
            <button class="btn-copy-small" data-copy="structure">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
          </div>
          <pre class="code-block"><code>${PH.helpers.escapeHtml(artifacts.folderStructure)}</code></pre>
        </div>

        <div class="github-tab-content" id="gh-tab-gitignore">
          <div class="code-block-header">
            <span class="code-block-label">.gitignore</span>
            <button class="btn-copy-small" data-copy="gitignore">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
          </div>
          <pre class="code-block"><code>${PH.helpers.escapeHtml(artifacts.gitignore)}</code></pre>
        </div>
      </div>`;
  }

  function bindTabEvents(container) {
    const tabs = container.querySelectorAll('.github-tab');
    const contents = container.querySelectorAll('.github-tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const targetId = `gh-tab-${tab.dataset.tab}`;
        const target = container.querySelector(`#${targetId}`);
        if (target) target.classList.add('active');
      });
    });

    // Copy buttons
    container.querySelectorAll('.btn-copy-small[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!currentArtifacts) return;
        const key = btn.dataset.copy;
        const textMap = {
          readme:    currentArtifacts.readme,
          structure: currentArtifacts.folderStructure,
          gitignore: currentArtifacts.gitignore,
        };
        const labels = { readme: 'README', structure: 'Folder structure', gitignore: '.gitignore' };
        PH.helpers.copyToClipboard(textMap[key], labels[key]);
      });
    });
  }

  function getCurrent() { return currentArtifacts; }

  return { renderSkeleton, renderArtifacts, bindTabEvents, getCurrent };
})();
