// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Speech Bubble
//
//  Message queue with mouth positioning.
//  Shows text/thought bubbles above character.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  const queue = [];
  let active = null;
  let hideTimer = null;

  const MIN_DISPLAY = 1800;
  const PER_CHAR_TIME = 50;

  /**
   * Show a speech/thought bubble (queued).
   * @param {string} text - Text to display
   * @param {object} opts - { duration, thought, kaomoji }
   */
  function show(text, opts = {}) {
    const duration = opts.duration || 0;
    const kaomoji = opts.kaomoji || null;
    const thought = opts.thought || false;
    const fullText = kaomoji ? kaomoji + ' ' + text : text;

    // Deduplicate
    if (queue.length > 0 && queue[queue.length - 1].text === fullText) return;
    if (active && active.text === fullText) return;

    queue.push({ text: fullText, duration, thought });
    if (queue.length > 8) queue.shift();
    processQueue();
  }

  function showImmediate(text, opts = {}) {
    clearActive();
    queue.length = 0;
    queue.push({ text, duration: opts.duration || 2000, thought: false });
    processQueue();
  }

  function clearActive() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    const el = M.bubbleEl;
    if (el) { el.classList.remove('on'); el.textContent = ''; }
    active = null;
  }

  function processQueue() {
    if (active || queue.length === 0) return;
    active = queue.shift();
    displayMessage(active);
  }

  function displayMessage(msg) {
    const el = M.bubbleEl;
    if (!el) { active = null; processQueue(); return; }

    // Remove old progress bar
    const oldBar = el.querySelector('.nom-progress');
    if (oldBar) oldBar.remove();

    el.textContent = msg.text;

    // Position above character mouth
    positionBubble(el);

    el.classList.add('on');

    const autoDuration = Math.max(MIN_DISPLAY, msg.text.length * PER_CHAR_TIME);
    const duration = msg.duration > 0 ? msg.duration : autoDuration;

    hideTimer = setTimeout(() => {
      el.classList.remove('on');
      clearActive();
      setTimeout(() => { active = null; processQueue(); }, 250);
    }, duration);
  }

  function positionBubble(el) {
    const mouthPos = M._mouthCanvasPos || { x: M.winW / 2, y: M.winH * 0.35 };
    const fontSize = Math.max(8, Math.min(16, Math.round(M.petSize * 0.15)));
    const padV = Math.max(3, Math.round(fontSize * 0.55));
    const padH = Math.max(5, Math.round(fontSize * 0.9));

    el.style.fontSize = fontSize + 'px';
    el.style.padding = padV + 'px ' + padH + 'px';
    el.style.maxWidth = Math.round(M.winW * 0.85) + 'px';
    el.style.whiteSpace = 'normal';
    el.style.wordWrap = 'break-word';
    el.style.position = 'absolute';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';

    const bubbleH = el.offsetHeight || 40;
    el.style.top = Math.max(2, mouthPos.y - bubbleH - 14) + 'px';

    // Update window layout if needed
    updateWindowForBubble(el.textContent);
  }

  function updateWindowForBubble(text) {
    if (!M.Rendering || !M.Rendering.updateLayout) return;
    const fontSize = Math.max(8, Math.min(16, Math.round(M.petSize * 0.15)));
    const padV = Math.max(3, Math.round(fontSize * 0.55));
    const m = document.createElement('div');
    m.style.cssText = 'position:absolute;visibility:hidden;font-family:sans-serif;' +
      'font-size:' + fontSize + 'px;padding:' + padV + 'px;' +
      'max-width:' + Math.round(M.winW * 0.8) + 'px;white-space:normal;';
    m.textContent = text;
    document.body.appendChild(m);
    const h = m.offsetHeight;
    document.body.removeChild(m);

    // overhead = bubbleH + arrowGap(6) + gap(5) ≈ bubbleH + 11
    M.Rendering.updateLayout(h > 0 ? h + 11 : 0);
  }

  function hide() {
    clearActive();
    queue.length = 0;
    if (M.Rendering && M.Rendering.updateLayout) {
      M.Rendering.updateLayout(0);
    }
  }

  function isVisible() {
    return active !== null;
  }

  // ── Progress bar (for file copy) ────────────────────────

  function showProgress(text, fraction) {
    const el = M.bubbleEl;
    if (!el) return;

    if (!active || active.text !== text) {
      clearActive();
      active = { text, duration: 0, thought: false };
      el.textContent = text;
      positionBubble(el);
      el.classList.add('on');
    }

    let bar = el.querySelector('.nom-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'nom-progress';
      bar.style.cssText = 'height:4px;background:#eee;border-radius:2px;margin-top:5px;overflow:hidden;';
      const fill = document.createElement('div');
      fill.className = 'nom-progress-fill';
      fill.style.cssText = 'height:100%;background:#FFB347;border-radius:2px;transition:width 0.2s ease;';
      bar.appendChild(fill);
      el.appendChild(bar);
    }
    const fill = bar.querySelector('.nom-progress-fill');
    if (fill) fill.style.width = Math.round(Math.max(0, Math.min(1, fraction)) * 100) + '%';
    positionBubble(el);
  }

  // ── Export ──────────────────────────────────────────────

  M.Bubble = { show, showImmediate, showProgress, hide, isVisible };

  console.log('[bubble] v2.0 — message queue + mouth positioning loaded');
})();
