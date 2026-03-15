window.PH = window.PH || {};

PH.roadmap = (() => {
  function render(steps) {
    if (!steps || !steps.length) return '';

    return `
      <div class="roadmap-steps">
        ${steps.map((step, i) => `
          <div class="roadmap-step" style="animation-delay:${i * 80}ms">
            <div class="roadmap-step-left">
              <div class="roadmap-step-num">${step.step}</div>
              ${i < steps.length - 1 ? '<div class="roadmap-connector"></div>' : ''}
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-step-title">${PH.helpers.escapeHtml(step.title)}</div>
              <div class="roadmap-step-desc">${PH.helpers.escapeHtml(step.description)}</div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  function renderBuildTime(difficulty, buildTime) {
    const icons = {
      beginner: '🌱',
      intermediate: '⚡',
      advanced: '🚀',
    };
    const dc = PH.helpers.difficultyColor(difficulty);
    const icon = icons[difficulty?.toLowerCase()] || '⏱';
    return `
      <div class="build-time-card">
        <div class="build-time-icon">${icon}</div>
        <div class="build-time-info">
          <div class="build-time-label">Estimated Build Time</div>
          <div class="build-time-value">${PH.helpers.escapeHtml(buildTime)}</div>
        </div>
        <div class="build-time-badge" style="background:${dc.bg};color:${dc.text};border:1px solid ${dc.border};">
          ${PH.helpers.escapeHtml(difficulty)}
        </div>
      </div>`;
  }

  return { render, renderBuildTime };
})();
