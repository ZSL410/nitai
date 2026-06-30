// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Game Loop & Bootstrapper
//
//  This is the heartbeat of the pet. Each frame:
//   1. Calculate delta time (frame-rate independent)
//   2. Tick animation state (life-sense, lerps)
//   3. Update walk controller (desktop movement)
//   4. Update FSM (behavior state machine)
//   5. Update AI (autonomous decisions)
//   6. Update eye tracking (cursor following)
//   7. Render character + particles
//
//  Paradigm: character has WORLD POSITION (screen coords).
//  The window moves to follow. Character always centered.
// ═══════════════════════════════════════════════════════════

const APP_VERSION = '2.0.0';

;(function () {
  const M = window.Mimic;
  M.VERSION = APP_VERSION;

  // ── Bind DOM ────────────────────────────────────────────
  M.canvas   = document.getElementById('pet-canvas');
  M.ctx      = M.canvas.getContext('2d');
  M.bubbleEl = document.getElementById('bubble');

  // ── Init world position ─────────────────────────────────
  // Get initial window position from main process via sync IPC
  // We estimate until first window sync
  function initWorldPosition() {
    // Request initial window position
    // For now, use reasonable defaults — will be corrected
    // when first drag or walk happens
    M.worldX = 800;  // center of a 1600-wide screen
    M.worldY = 450;  // center-ish of a 900-tall screen
    M.winScreenX = M.worldX - M.winW / 2;
    M.winScreenY = M.worldY - M.winH / 2;
  }
  initWorldPosition();

  // ── Game loop ───────────────────────────────────────────

  function gameLoop(now) {
    // ── 1. Delta time ────────────────────────────────────
    const dt = Math.min((now - M.lastFrameTime) / 1000, 0.1); // cap at 100ms
    M.lastFrameTime = now;
    M.deltaTime = dt;

    // ── 2. Animation tick (life-sense, lerps) ─────────────
    if (M.Anim && M.Anim.tick) M.Anim.tick(dt, now);

    // ── 3. Walk controller update ─────────────────────────
    if (M.Walk && M.Walk.update) M.Walk.update(dt);

    // ── 4. FSM update ─────────────────────────────────────
    if (M.FSM) M.FSM.update(now);

    // ── 5. AI autonomous behavior update ──────────────────
    if (M.AI && M.AI.update) M.AI.update(now);

    // ── 6. Eye tracking update ────────────────────────────
    if (M.EyeTracking && M.EyeTracking.update) M.EyeTracking.update();

    // ── 7. Render ─────────────────────────────────────────
    if (M.Rendering && M.Rendering.draw) M.Rendering.draw();

    requestAnimationFrame(gameLoop);
  }

  // ── Boot ────────────────────────────────────────────────

  function boot() {
    console.log('══════════════════════════════════════════');
    console.log('  拟态 Nitai v' + APP_VERSION);
    console.log('  Desktop is the territory.');
    console.log('  Walk | Wander | Summon | Interact');
    console.log('  World-coordinate system active');
    console.log('══════════════════════════════════════════');

    // Init layout (default size 80)
    if (M.Rendering && M.Rendering.updateLayout) {
      M.Rendering.updateLayout(0);
    }
    if (M.Rendering && M.Rendering.applySize) {
      M.Rendering.applySize(M.config.defaultSize || 80);
    }

    // Set up all interactions
    if (M.Interaction) {
      if (M.Interaction.setupDrag) M.Interaction.setupDrag();
      if (M.Interaction.setupContextMenu) M.Interaction.setupContextMenu();
      if (M.Interaction.setupDrop) M.Interaction.setupDrop();
      if (M.Interaction.setupEyeTracking) M.Interaction.setupEyeTracking();
      if (M.Interaction.setupClickReactions) M.Interaction.setupClickReactions();
      if (M.Interaction.setupChat) M.Interaction.setupChat();
      if (M.Interaction.setupMusicDetect) M.Interaction.setupMusicDetect();
    }

    // Init AI controller
    if (M.AI && M.AI.init) M.AI.init();

    // Welcome bubble
    if (M.Bubble) {
      M.Bubble.show('你好！我是拟态~ 👋\n右键菜单可以召唤我！', {
        duration: 3000,
      });
    }

    // Initialize FSM to idle
    if (M.FSM) M.FSM.transitionTo('idle');

    // Start game loop
    requestAnimationFrame(gameLoop);

    console.log('[app] v' + APP_VERSION + ' booted — game loop running');
  }

  // ── Window position sync ────────────────────────────────
  // Periodically verify window position with main process
  // This corrects any drift between world coords and actual window pos
  setInterval(() => {
    if (M.Walk && !M.Walk.hasTarget && !M.isWalking) {
      // Only sync when not actively moving
      M.Walk.syncWindowToWorld();
    }
  }, 5000);

  boot();
})();
