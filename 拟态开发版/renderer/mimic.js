// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Global Namespace & World State
//
//  Core paradigm: the character has a WORLD POSITION
//  (screen coordinates). The window follows the character.
//  This is the opposite of v1 where the character was
//  confined to a static window.
//
//  World coordinate system:
//   - worldX, worldY = character CENTER in screen pixels
//   - Window top-left = (worldX - winW/2, worldY - winH/2)
// ═══════════════════════════════════════════════════════════

;(function () {
  const { ipcRenderer } = require('electron');
  const path = require('path');
  const fs   = require('fs');

  const VERSION = '2.0.0';

  // ── Config ──────────────────────────────────────────────
  let config = {
    targetDir: '../02_数据输入',
    backendUrl: 'http://127.0.0.1:5001',
    apiEnabled: false,
    defaultSize: 80,
    passthrough: false,
  };
  try {
    config = Object.assign(config, require('../config.json'));
    console.log('[mimic] config loaded');
  } catch (err) {
    console.warn('[mimic] config.json not found, using defaults');
  }

  const TARGET = path.resolve(__dirname, '..', config.targetDir);

  // ── World state (screen coordinates) ────────────────────
  // These are the SINGLE SOURCE OF TRUTH for character position.
  // worldX, worldY = character center in screen pixels.
  // Initialized from window position (sent by main process or estimated).
  let worldX = 200;
  let worldY = 200;
  let petSize = 80;
  let winW = 120;
  let winH = 120;

  // ── Last known window screen position (from main process) ──
  let _winScreenX = 0;
  let _winScreenY = 0;

  // ── Animation & movement state ──────────────────────────
  let deltaTime = 0.016;       // seconds since last frame
  let lastFrameTime = performance.now();
  let lastActivity = performance.now();

  // ── Walk target (for summon / autonomous movement) ──────
  let walkTarget = null;       // { x, y } in screen coords, or null
  let isWalking = false;
  let walkSpeed = 80;          // pixels per second (default walk)
  let runSpeed = 160;          // pixels per second (run)

  // ── Behavior state ──────────────────────────────────────
  let wanderEnabled = true;    // autonomous wandering on/off
  let behaviorState = 'idle';  // idle | walking | curious | happy | surprised

  // ── DOM refs ────────────────────────────────────────────
  let canvas = null;
  let ctx = null;
  let bubbleEl = null;

  // ── Exports ─────────────────────────────────────────────
  const M = {
    VERSION,
    config,
    TARGET,
    ipc: ipcRenderer,
    path,
    fs,

    // World position (screen coords) — getters/setters
    get worldX() { return worldX; },
    set worldX(v) { worldX = v; },
    get worldY() { return worldY; },
    set worldY(v) { worldY = v; },

    // Window dimensions
    get petSize() { return petSize; },
    set petSize(v) { petSize = v; },
    get winW() { return winW; },
    set winW(v) { winW = v; },
    get winH() { return winH; },
    set winH(v) { winH = v; },

    // Window screen position (top-left)
    get winScreenX() { return _winScreenX; },
    set winScreenX(v) { _winScreenX = v; },
    get winScreenY() { return _winScreenY; },
    set winScreenY(v) { _winScreenY = v; },

    // Delta time
    get deltaTime() { return deltaTime; },
    get lastFrameTime() { return lastFrameTime; },
    set lastFrameTime(v) { lastFrameTime = v; },

    // Activity tracking
    get lastActivity() { return lastActivity; },
    set lastActivity(v) { lastActivity = v; },

    // Walk target & movement
    get walkTarget() { return walkTarget; },
    set walkTarget(v) { walkTarget = v; },
    get isWalking() { return isWalking; },
    set isWalking(v) { isWalking = v; },
    get walkSpeed() { return walkSpeed; },
    get runSpeed() { return runSpeed; },

    // Behavior
    get wanderEnabled() { return wanderEnabled; },
    set wanderEnabled(v) { wanderEnabled = v; },
    get behaviorState() { return behaviorState; },
    set behaviorState(v) { behaviorState = v; },

    // DOM
    get canvas() { return canvas; },
    set canvas(v) { canvas = v; },
    get ctx() { return ctx; },
    set ctx(v) { ctx = v; },
    get bubbleEl() { return bubbleEl; },
    set bubbleEl(v) { bubbleEl = v; },

    // Module placeholders (populated by loaded scripts)
    EASING: null,
    EXPRESSIONS: null,
    Anim: null,
    Rendering: null,
    Walk: null,
    FSM: null,
    AI: null,
    Bubble: null,
    Audio: null,
    Particles: null,
    Interaction: null,
    EyeTracking: null,
  };

  window.Mimic = M;
  console.log('[mimic] v2.0 namespace initialized — world coordinate system active');

  // ── Keyboard shortcuts ──────────────────────────────────
  window.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'q') {
      e.preventDefault();
      ipcRenderer.send('quit-app');
    }
    if (mod && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      ipcRenderer.send('toggle-passthrough');
    }
    // Ctrl+W toggles autonomous wandering
    if (mod && e.key === 'w') {
      e.preventDefault();
      M.wanderEnabled = !M.wanderEnabled;
      console.log('[mimic] wander:', M.wanderEnabled ? 'ON' : 'OFF');
    }
  });
})();
