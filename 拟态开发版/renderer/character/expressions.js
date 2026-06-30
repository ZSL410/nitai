// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Character Expressions
//
//  Eye styles: round | arch | wide | closed | closed_arch |
//              half_closed | sparkle | heart
//  Mouth styles: smile | open | grin | o | none
//
//  Extensible: add new expressions here, reference by name
//  in state definitions.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  const EXPRESSIONS = {
    // ── Neutral / default ──────────────────────────────
    neutral: {
      eyes: 'round',
      mouth: 'none',
      cheek: false,
    },

    // ── Happy / smiling ────────────────────────────────
    happy: {
      eyes: 'arch',
      mouth: 'smile',
      cheek: true,
    },

    // ── Surprised ──────────────────────────────────────
    surprised: {
      eyes: 'wide',
      mouth: 'open',
      cheek: false,
    },

    // ── Curious / interested ───────────────────────────
    curious: {
      eyes: 'wide',
      mouth: 'smile',
      cheek: true,
    },

    // ── Sleepy / tired ─────────────────────────────────
    sleepy: {
      eyes: 'half_closed',
      mouth: 'none',
      cheek: false,
    },

    // ── Dizzy / spinning ───────────────────────────────
    dizzy: {
      eyes: 'closed_arch',
      mouth: 'open',
      cheek: false,
    },

    // ── Sparkle / excited ──────────────────────────────
    excited: {
      eyes: 'sparkle',
      mouth: 'grin',
      cheek: true,
    },

    // ── Alert / listening ──────────────────────────────
    alert: {
      eyes: 'wide',
      mouth: 'none',
      cheek: false,
    },

    // ── Grin / big smile ───────────────────────────────
    grin: {
      eyes: 'arch',
      mouth: 'grin',
      cheek: true,
    },

    // ── Closed-eye smile (content) ─────────────────────
    content: {
      eyes: 'closed',
      mouth: 'smile',
      cheek: true,
    },

    // ── Heart eyes (love) ──────────────────────────────
    love: {
      eyes: 'heart',
      mouth: 'smile',
      cheek: true,
    },

    // ── O mouth (shock) ────────────────────────────────
    shock: {
      eyes: 'wide',
      mouth: 'o',
      cheek: false,
    },
  };

  M.EXPRESSIONS = EXPRESSIONS;
  console.log('[expressions] ' + Object.keys(EXPRESSIONS).length + ' expressions loaded');
})();
