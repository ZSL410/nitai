// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Easing & Math Utilities
//
//  Frame-rate-independent damp (exponential decay).
//  Classic Penner easing functions for timed tweens.
//  All functions are pure and stateless.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  /**
   * Frame-rate-independent exponential damping.
   * Converges to `target` at the same speed regardless of framerate.
   *
   * @param {number} current - Current value
   * @param {number} target - Target value
   * @param {number} lambda - Smoothing factor (higher = faster, typical: 3-8)
   * @param {number} dt - Delta time in seconds
   * @returns {number} New value
   */
  function damp(current, target, lambda, dt) {
    return current + (target - current) * (1 - Math.exp(-lambda * dt));
  }

  /**
   * Simple lerp (not frame-rate-independent; use damp() for game loops).
   */
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Clamp a value between min and max.
   */
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /**
   * Distance between two points.
   */
  function dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Angle from (x1,y1) to (x2,y2) in radians.
   */
  function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /**
   * Random float in [min, max).
   */
  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * Random integer in [min, max] inclusive.
   */
  function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  // ── Penner easing functions (t ∈ [0, 1]) ──────────────

  function easeInQuad(t)   { return t * t; }
  function easeOutQuad(t)  { return t * (2 - t); }
  function easeInOutQuad(t){ return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  function easeInCubic(t)  { return t * t * t; }
  function easeOutCubic(t) { return --t * t * t + 1; }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
  }

  function easeOutBounce(t) {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1/d1) return n1*t*t;
    else if (t < 2/d1) return n1*(t-=1.5/d1)*t + 0.75;
    else if (t < 2.5/d1) return n1*(t-=2.25/d1)*t + 0.9375;
    else return n1*(t-=2.625/d1)*t + 0.984375;
  }

  function easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10*t) * Math.sin((t-1)*(2*Math.PI)/0.3) + 1;
  }

  // ── Export ──────────────────────────────────────────────

  M.EASING = {
    damp, lerp, clamp, dist, angleTo,
    randRange, randInt,
    easeInQuad, easeOutQuad, easeInOutQuad,
    easeInCubic, easeOutCubic, easeInOutCubic,
    easeOutBounce, easeOutElastic,
  };

  console.log('[easing] math utilities loaded');
})();
