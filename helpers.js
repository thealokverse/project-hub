window.PH = window.PH || {};

PH.helpers = (() => {
  // Toast notification system
  let toastQueue = [];
  let toastContainer = null;

  function initToast() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed; bottom: 24px; right: 24px;
        display: flex; flex-direction: column; gap: 8px;
        z-index: 9999; pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function showToast(message, type = 'success', duration = 2800) {
    const container = initToast();
    const toast = document.createElement('div');
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const colors = {
      success: 'var(--accent)',
      error: '#ef4444',
      info: '#737373',
      warning: '#f59e0b',
    };

    toast.innerHTML = `
      <span style="
        display:inline-flex;align-items:center;justify-content:center;
        width:18px;height:18px;border-radius:50%;
        background:${colors[type]};color:white;font-size:10px;font-weight:700;
        flex-shrink:0;
      ">${icons[type]}</span>
      <span>${message}</span>
    `;
    toast.style.cssText = `
      display: flex; align-items: center; gap: 10px;
      background: var(--bg-card); color: var(--text);
      border: 1px solid var(--border);
      padding: 12px 16px; border-radius: 10px;
      font-size: 13.5px; font-family: var(--font-body);
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      pointer-events: all; cursor: default;
      animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
      max-width: 300px;
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.25s ease forwards';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // Copy text to clipboard
  async function copyToClipboard(text, label = 'Copied') {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} to clipboard`, 'success');
      return true;
    } catch (err) {
      // Fallback for older browsers
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast(`${label} to clipboard`, 'success');
        return true;
      } catch {
        showToast('Copy failed — try manually', 'error');
        return false;
      }
    }
  }

  // Format project idea as plain text for copying
  function formatIdeaAsText(idea) {
    return `# ${idea.title}
${idea.tagline}

## Problem
${idea.problem}

## Solution
${idea.solution}

## Key Features
${idea.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Tech Stack
${idea.techStack.join(', ')}

## Difficulty
${idea.difficulty} — ${idea.buildTime}

## Roadmap
${idea.roadmap.map(r => `Step ${r.step}: ${r.title}\n  ${r.description}`).join('\n\n')}

## Future Extensions
${idea.extensions.map((e, i) => `${i + 1}. ${e}`).join('\n')}
`;
  }

  // Format roadmap as plain text
  function formatRoadmapAsText(roadmap) {
    return roadmap.map(r =>
      `Step ${r.step}: ${r.title}\n${r.description}`
    ).join('\n\n');
  }

  // Escape HTML entities
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Generate unique ID
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Debounce
  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  // Difficulty badge color
  function difficultyColor(difficulty) {
    const map = {
      beginner:     { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
      intermediate: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
      advanced:     { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
    };
    return map[difficulty?.toLowerCase()] || map.beginner;
  }

  return {
    showToast,
    copyToClipboard,
    formatIdeaAsText,
    formatRoadmapAsText,
    escapeHtml,
    uid,
    debounce,
    difficultyColor,
  };
})();
