// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Walk Controller
//
//  Manages character movement across the desktop.
//  The character has a WORLD POSITION (screen coordinates).
//  Walking = gradually changing worldX/worldY + moving the
//  Electron window to follow.
//
//  Key features:
//   - Step-by-step movement (not teleporting)
//   - Frame-rate-independent speed via damp()
//   - Walk cycle animation during movement
//   - Boundary clamping (stays on screen)
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;
  const E = M.EASING;

  // ── Walk state ──────────────────────────────────────────

  let targetX = 0;
  let targetY = 0;
  let hasTarget = false;
  let onArriveCallback = null;

  // Track previous world position for direction detection
  let prevWorldX = 0;
  let prevWorldY = 0;

  // ── Screen boundary padding ────────────────────────────
  const SCREEN_PAD = 30;

  /**
   * Set a walk target in screen coordinates.
   * The character will walk there step by step.
   *
   * @param {number} screenX - Target X in screen coords (character center)
   * @param {number} screenY - Target Y in screen coords (character center)
   * @param {string} speed - 'walk' | 'run'
   * @param {function} onArrive - Called when character reaches target
   */
  function walkTo(screenX, screenY, speed, onArrive) {
    targetX = screenX;
    targetY = screenY;
    hasTarget = true;
    M.isWalking = true;
    onArriveCallback = onArrive || null;

    // Set speed
    if (speed === 'run') {
      M.walkSpeed = M.runSpeed;
    } else {
      M.walkSpeed = 80; // default walk: 80 px/s
    }

    console.log('[walk] target set: (' +
      Math.round(screenX) + ',' + Math.round(screenY) +
      ') speed=' + M.walkSpeed + 'px/s');
  }

  /**
   * Stop walking immediately.
   */
  function stopWalking() {
    hasTarget = false;
    M.isWalking = false;
    onArriveCallback = null;
    console.log('[walk] stopped');
  }

  /**
   * Update walk movement (called every frame by game loop).
   * Moves world position toward target, updates window position.
   */
  function updateWalk(dt) {
    if (!hasTarget) {
      M.isWalking = false;
      return;
    }

    const dist = E.dist(M.worldX, M.worldY, targetX, targetY);

    // Arrived? (within 2 pixels)
    if (dist < 2) {
      M.worldX = targetX;
      M.worldY = targetY;
      hasTarget = false;
      M.isWalking = false;
      syncWindowToWorld();
      if (onArriveCallback) {
        const cb = onArriveCallback;
        onArriveCallback = null;
        cb();
      }
      console.log('[walk] arrived at (' +
        Math.round(M.worldX) + ',' + Math.round(M.worldY) + ')');
      return;
    }

    // Step toward target using damp (frame-rate-independent)
    // For walking, we use a higher lambda for responsive movement
    // but clamp max speed to walkSpeed
    const maxStep = M.walkSpeed * dt;
    const step = Math.min(maxStep, dist);

    const angle = E.angleTo(M.worldX, M.worldY, targetX, targetY);
    M.worldX += Math.cos(angle) * step;
    M.worldY += Math.sin(angle) * step;

    // Clamp to screen bounds
    clampToScreen();

    // Sync window position to world
    syncWindowToWorld();
  }

  /**
   * Move the Electron window so the character (at worldX, worldY)
   * is centered in the window.
   */
  function syncWindowToWorld() {
    const winLeft = M.worldX - M.winW / 2;
    const winTop  = M.worldY - M.winH / 2;

    // Only send IPC if position changed significantly (>0.5px)
    const dx = Math.abs(winLeft - M.winScreenX);
    const dy = Math.abs(winTop - M.winScreenY);

    if (dx > 0.5 || dy > 0.5) {
      M.winScreenX = winLeft;
      M.winScreenY = winTop;
      M.ipc.send('move-window', Math.round(winLeft), Math.round(winTop));
    }
  }

  /**
   * Clamp world position to stay within screen work area.
   */
  function clampToScreen() {
    // We don't have direct screen access in renderer.
    // Instead, we use reasonable defaults and let the main
    // process handle exact clamping in moveWindowTo().
    // This is a soft clamp.
    const minX = SCREEN_PAD + M.winW / 2;
    const minY = SCREEN_PAD + M.winH / 2;
    const maxX = 3000 - M.winW / 2;  // reasonable max
    const maxY = 2000 - M.winH / 2;

    M.worldX = E.clamp(M.worldX, minX, maxX);
    M.worldY = E.clamp(M.worldY, minY, maxY);
  }

  /**
   * Get the direction character is facing based on movement.
   * Returns -1 (left), 0 (stationary), or 1 (right).
   */
  function getFacingDirection() {
    const dx = M.worldX - prevWorldX;
    prevWorldX = M.worldX;
    prevWorldY = M.worldY;

    if (Math.abs(dx) < 0.1) return 0;
    return dx > 0 ? 1 : -1;
  }

  /**
   * Initialize world position from window screen position.
   * Called on boot to sync world coords with actual window position.
   */
  function initWorldPosition() {
    // Request window position from main process
    // For now, estimate based on reasonable defaults
    // The main process will have positioned the window already
    console.log('[walk] world position init: (' +
      Math.round(M.worldX) + ',' + Math.round(M.worldY) + ')');
  }

  /**
   * Check if currently walking toward a target.
   */
  function isWalkingToTarget() {
    return hasTarget;
  }

  /**
   * Get remaining distance to target.
   */
  function distanceToTarget() {
    if (!hasTarget) return 0;
    return E.dist(M.worldX, M.worldY, targetX, targetY);
  }

  // ── Export ──────────────────────────────────────────────

  M.Walk = {
    walkTo,
    stopWalking,
    update: updateWalk,
    syncWindowToWorld,
    getFacingDirection,
    initWorldPosition,
    isWalkingToTarget,
    distanceToTarget,
    get targetX() { return targetX; },
    get targetY() { return targetY; },
    get hasTarget() { return hasTarget; },
  };

  console.log('[walk-controller] v2.0 — screen-coordinate walking active');
})();
