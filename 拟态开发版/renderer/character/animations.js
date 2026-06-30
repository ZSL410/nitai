// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Animation State Manager
//
//  All animation properties live here. States modify these
//  via M.Anim. The renderer reads them each frame.
//
//  Life-sense animations (always active):
//   - Breathing: subtle scale oscillation
//   - Idle sway: gentle horizontal wobble
//   - Blinking: random interval eye close/open
//
//  Action animations (triggered by states/events):
//   - Walk cycle: leg/arm oscillation
//   - Bob: vertical bounce
//   - Head tilt: angled head
//   - Body squash/stretch: scale deformation
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  // ── Animation state (single source of truth) ────────────

  const Anim = {
    // Smooth bob (vertical offset, lerped each frame)
    bobOffset: 0,
    _smoothBob: 0,

    // Body scale (squash & stretch)
    bodyScale: 1,
    bodySquash: 0,       // horizontal squash factor
    targetScale: 1,

    // Head
    headTilt: 0,         // angle offset for head

    // Limbs (offsets from rest position in grid units)
    leftArm:  { dx: 0, dy: 0 },
    rightArm: { dx: 0, dy: 0 },
    leftLeg:  { dx: 0, dy: 0 },
    rightLeg: { dx: 0, dy: 0 },
    feetY: 0,

    // Eyes
    eyePupilX: 0,        // pupil offset from eye tracking
    eyePupilY: 0,
    eyeOpen: true,

    // Mouth
    mouthOpen: 0,        // 0-1, for talking/eating

    // Walk cycle
    walkPhase: 0,        // 0 to 2*PI, advances during walking
    walkFrame: 0,        // 0-3, discrete walk frames

    // Yawn
    yawnPhase: 0,

    // Eating
    eatingProgress: 0,
    eatingNomCount: 0,

    // Accessories
    showHeadphones: false,

    // Life-sense (automatic, always running)
    _breathPhase: Math.random() * Math.PI * 2,
    _swayPhase: Math.random() * Math.PI * 2,
    _nextBlinkTime: 0,
    _blinkDuration: 0.1,
    _blinkTimer: 0,
    _isBlinking: false,
    _idleActionTimer: 0,
    _idleActionCooldown: 0,
  };

  // ── Life-sense update (called every frame) ──────────────

  function updateLifeSense(dt, now) {
    // Breathing: subtle scale oscillation (~3 second period)
    Anim._breathPhase += dt * 2.1; // ~3s cycle
    const breathScale = 1 + Math.sin(Anim._breathPhase) * 0.02;

    // Idle sway: gentle horizontal wobble (~5 second period)
    Anim._swayPhase += dt * 1.26; // ~5s cycle
    const swayOffset = Math.sin(Anim._swayPhase) * 0.3;

    // Apply breathing to target scale (only when idle)
    if (M.behaviorState === 'idle') {
      Anim.targetScale = breathScale;
      Anim.headTilt = swayOffset * 0.1;
    }

    // Blinking: random intervals
    if (Anim._isBlinking) {
      Anim._blinkTimer -= dt;
      if (Anim._blinkTimer <= 0) {
        Anim._isBlinking = false;
        Anim.eyeOpen = true;
        Anim._nextBlinkTime = now + M.EASING.randRange(1500, 5000);
      }
    } else if (now >= Anim._nextBlinkTime) {
      Anim._isBlinking = true;
      Anim.eyeOpen = false;
      Anim._blinkTimer = Anim._blinkDuration;
    }

    // Initialize blink timer on first frame
    if (Anim._nextBlinkTime === 0) {
      Anim._nextBlinkTime = now + M.EASING.randRange(1000, 4000);
    }
  }

  // ── Tick (called once per frame by game loop) ───────────

  function tickAnim(dt, now) {
    // Update life-sense
    updateLifeSense(dt, now);

    // Smooth bob lerp
    if (Anim._smoothBob === undefined) Anim._smoothBob = 0;
    Anim._smoothBob += (Anim.bobOffset - Anim._smoothBob) * 0.22;

    // Smooth scale lerp (body size transitions)
    if (Anim.bodyScale === undefined) Anim.bodyScale = 1;
    Anim.bodyScale += ((Anim.targetScale || 1) - Anim.bodyScale) * 0.15;

    // Walk cycle advance
    if (M.isWalking) {
      Anim.walkPhase += dt * 10; // speed of walk animation
      if (Anim.walkPhase > Math.PI * 2) Anim.walkPhase -= Math.PI * 2;
      Anim.walkFrame = Math.floor((Anim.walkPhase / (Math.PI * 2)) * 4) % 4;
    } else {
      // Decay walk phase back to 0
      Anim.walkPhase *= 0.9;
      if (Math.abs(Anim.walkPhase) < 0.01) Anim.walkPhase = 0;
    }
  }

  // ── Walk animation pose (called by renderer) ────────────

  function getWalkPose() {
    const phase = Anim.walkPhase;
    // Leg swing: alternate left/right
    const legSwing = Math.sin(phase) * 2;
    const armSwing = Math.sin(phase + Math.PI) * 1.5;

    return {
      leftLeg:  { dx: 0, dy: legSwing },
      rightLeg: { dx: 0, dy: -legSwing },
      leftArm:  { dx: armSwing, dy: 0 },
      rightArm: { dx: -armSwing, dy: 0 },
      feetY: Math.abs(Math.sin(phase)) * 1,
      bobOffset: Math.abs(Math.sin(phase * 2)) * -3,
    };
  }

  // ── Reset all animation state (called on state change) ──

  function resetAnimations() {
    Anim.bobOffset = 0;
    Anim.headTilt = 0;
    Anim.leftArm  = { dx: 0, dy: 0 };
    Anim.rightArm = { dx: 0, dy: 0 };
    Anim.leftLeg  = { dx: 0, dy: 0 };
    Anim.rightLeg = { dx: 0, dy: 0 };
    Anim.feetY = 0;
    Anim.mouthOpen = 0;
    Anim.bodySquash = 0;
    Anim.yawnPhase = 0;
  }

  // ── Export ──────────────────────────────────────────────

  M.Anim = Anim;
  M.Anim.tick = tickAnim;
  M.Anim.getWalkPose = getWalkPose;
  M.Anim.reset = resetAnimations;

  console.log('[animations] state manager + life-sense loaded');
})();
