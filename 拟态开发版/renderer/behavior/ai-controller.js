// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Autonomous Behavior AI Controller
//
//  Makes the pet feel alive by autonomously:
//   - Wandering to random locations on screen
//   - Investigating mouse cursor (curiosity)
//   - Idle micro-behaviors (stretch, look around)
//   - Transitioning to sleepy when inactive for long periods
//
//  The AI runs as a "decision layer" above the FSM:
//   Every few seconds, it evaluates what to do next.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;
  const E = M.EASING;

  // ── AI state ─────────────────────────────────────────────

  const AI = {
    _nextDecisionTime: 0,
    _decisionInterval: 3000,    // Decide every 3 seconds
    _wanderCooldown: 0,
    _wanderMinInterval: 5000,   // Min 5s between wanders
    _wanderMaxInterval: 15000,  // Max 15s between wanders
    _curiosityCheckTimer: 0,
    _lastMouseX: 0,
    _lastMouseY: 0,
    _mouseMoved: false,
    _idleActionTimer: 0,
    _stretchTimer: 0,
    _sleepyThreshold: 60000,    // 60s inactivity → sleepy
  };

  // ── Initialize ──────────────────────────────────────────

  function init() {
    // Schedule first decision
    AI._nextDecisionTime = performance.now() + 2000;
    AI._wanderCooldown = performance.now() + 3000;

    // Track mouse movement for curiosity
    document.addEventListener('mousemove', (e) => {
      AI._lastMouseX = e.screenX;
      AI._lastMouseY = e.screenY;
      AI._mouseMoved = true;
    });

    console.log('[ai] autonomous controller initialized');
  }

  // ── Main update (called every frame) ────────────────────

  function update(now) {
    if (!M.wanderEnabled) return;

    // Only make decisions when idle
    if (M.FSM.state !== 'idle') return;

    // Periodic decision-making
    if (now >= AI._nextDecisionTime) {
      makeDecision(now);
      AI._nextDecisionTime = now + AI._decisionInterval;
    }

    // Check for curiosity (mouse moved nearby)
    checkCuriosity(now);

    // Check for sleepy transition
    checkSleepy(now);

    // Micro-behaviors during idle
    updateIdleMicroBehaviors(now);
  }

  // ── Decision engine ─────────────────────────────────────

  function makeDecision(now) {
    const idleTime = now - M.lastActivity;

    // If recently interacted with, don't interrupt
    if (idleTime < 2000) return;

    // Roll for autonomous behavior
    const roll = Math.random();
    const canWander = now >= AI._wanderCooldown && !M.Walk.hasTarget;

    if (canWander && roll < 0.35) {
      // 35% chance: wander to random location
      startWander();
    } else if (roll < 0.15) {
      // 15% chance: micro-animation (stretch, look around)
      doMicroAction();
    }
    // 50% chance: do nothing, keep idling
  }

  // ── Wander: walk to a random screen location ────────────

  function startWander() {
    // Pick a random target within reasonable bounds
    // We estimate screen dimensions — the main process clamps anyway
    const targetX = E.randRange(150, 1700);
    const targetY = E.randRange(100, 900);

    console.log('[ai] wandering to (' +
      Math.round(targetX) + ',' + Math.round(targetY) + ')');

    M.FSM.transitionTo('walking');

    M.Walk.walkTo(targetX, targetY, 'walk', () => {
      // On arrival: look curious for a moment, then idle
      M.FSM.transitionTo('curious');
      setTimeout(() => {
        if (M.FSM.state === 'curious') M.FSM.transitionTo('idle');
      }, 2500);
    });

    // Set cooldown for next wander
    AI._wanderCooldown = performance.now() +
      E.randRange(AI._wanderMinInterval, AI._wanderMaxInterval);

    // Show a thought bubble
    if (M.Bubble) {
      const thoughts = [
        '那里有什么呢？👀',
        '走一走~ 🚶',
        '换个地方！',
        '探索一下 🔍',
        '嗯…去那边看看',
      ];
      M.Bubble.show(thoughts[E.randInt(0, thoughts.length - 1)], {
        duration: 2000,
      });
    }

    M.lastActivity = performance.now();
  }

  // ── Curiosity: investigate mouse cursor ─────────────────

  function checkCuriosity(now) {
    if (!AI._mouseMoved) return;
    if (M.FSM.state !== 'idle') return;
    if (M.Walk.hasTarget) return;
    if (now - M.lastActivity < 3000) return;
    if (now < AI._curiosityCheckTimer) return;

    AI._curiosityCheckTimer = now + 5000; // Check every 5s
    AI._mouseMoved = false;

    // How far is the mouse from the pet?
    const dist = E.dist(M.worldX, M.worldY, AI._lastMouseX, AI._lastMouseY);

    // If mouse is within 200-400px, occasionally walk toward it
    if (dist > 150 && dist < 500 && Math.random() < 0.3) {
      console.log('[ai] curious about mouse at distance', Math.round(dist));

      // Walk partway toward mouse
      const angle = E.angleTo(M.worldX, M.worldY, AI._lastMouseX, AI._lastMouseY);
      const approachDist = dist * 0.6; // Go 60% of the way
      const tx = M.worldX + Math.cos(angle) * approachDist;
      const ty = M.worldY + Math.sin(angle) * approachDist;

      M.FSM.transitionTo('walking');
      M.Walk.walkTo(tx, ty, 'walk', () => {
        M.FSM.transitionTo('curious');
        if (M.Bubble) M.Bubble.show('嗯？', { duration: 1500 });
        setTimeout(() => {
          if (M.FSM.state === 'curious') M.FSM.transitionTo('idle');
        }, 3000);
      });
      M.lastActivity = performance.now();
    }
  }

  // ── Sleepy transition ───────────────────────────────────

  function checkSleepy(now) {
    if (M.FSM.state !== 'idle') return;
    const idleTime = now - M.lastActivity;

    if (idleTime > AI._sleepyThreshold && M.FSM.state === 'idle') {
      M.FSM.transitionTo('sleepy');
      console.log('[ai] entering sleepy mode after', Math.round(idleTime/1000), 's');
    }
  }

  // ── Idle micro-behaviors ────────────────────────────────

  function updateIdleMicroBehaviors(now) {
    if (M.FSM.state !== 'idle') return;

    // Occasional stretch (every 20-40s)
    if (now - AI._stretchTimer > E.randRange(20000, 40000)) {
      AI._stretchTimer = now;
      doMicroAction();
    }
  }

  function doMicroAction() {
    const roll = Math.random();

    if (roll < 0.33) {
      // Stretch: raise arms
      M.Anim.rightArm = { dx: 2, dy: -6 };
      M.Anim.leftArm = { dx: -1, dy: -4 };
      M.Anim.headTilt = -0.2;
      setTimeout(() => {
        M.Anim.rightArm = { dx: 0, dy: 0 };
        M.Anim.leftArm = { dx: 0, dy: 0 };
        M.Anim.headTilt = 0;
      }, 800);
    } else if (roll < 0.66) {
      // Look around: tilt head
      M.Anim.headTilt = E.randRange(-0.6, 0.6);
      setTimeout(() => { M.Anim.headTilt = 0; }, 1200);
    } else {
      // Tiny hop
      M.Anim.bobOffset = -6;
      setTimeout(() => { M.Anim.bobOffset = 0; }, 300);
    }
  }

  // ── Public: trigger wander manually ─────────────────────

  function toggleWander() {
    M.wanderEnabled = !M.wanderEnabled;
    console.log('[ai] wander:', M.wanderEnabled ? 'ON' : 'OFF');
    if (M.Bubble) {
      M.Bubble.show(M.wanderEnabled ? '开始闲逛~ 🚶' : '不逛了，休息一会 💤', {
        duration: 1500,
      });
    }
  }

  // ── Export ──────────────────────────────────────────────

  M.AI = {
    init,
    update,
    toggleWander,
    forceWander: startWander,
    get _nextDecisionTime() { return AI._nextDecisionTime; },
  };

  console.log('[ai-controller] v2.0 — wander + curiosity + sleepy logic loaded');
})();
