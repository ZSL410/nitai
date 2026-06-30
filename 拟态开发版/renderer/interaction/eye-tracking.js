// ═══════════════════════════════════════════════════════════
//  Mimic v1.0.0 — Enhanced Eye Tracking
//
//  Pupils follow the mouse cursor relative to the character's
//  head centre. All coordinates from M.Layout.getPetBounds().
//  Smooth lerp avoids jitter.
//  Pupil offset clamped to stay within head boundary.
//  Active only in idle state. Mouse leave → return to centre.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  let mouseX = 0, mouseY = 0;
  let mouseOnWindow = false;

  // Max pupil displacement (grid cells)
  const PUPIL_MAX_DX = 1.5;
  const PUPIL_MAX_DY = 1.0;
  const LERP_SPEED = 0.28;

  function setupEyeTracking() {
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseenter', onMouseEnter);

    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseOnWindow = true;
      M.lastActivity = performance.now();
    }

    function onMouseLeave() {
      mouseOnWindow = false;
    }

    function onMouseEnter() {
      mouseOnWindow = true;
    }

    M._updateEyeTracking = function () {
      const A = M.Anim;
      if (!A) return;

      if (!mouseOnWindow || M.FSM.state !== 'idle') {
        A.eyePupilX += (0 - A.eyePupilX) * 0.12;
        A.eyePupilY += (0 - A.eyePupilY) * 0.12;
        return;
      }

      // All coordinates from getPetBounds() — single source of truth
      const B = M.Layout.getPetBounds();
      const headCX = B.headCX;
      const headCY = B.headCY;

      const dx = mouseX - headCX;
      const dy = mouseY - headCY;

      const sensitivityRadius = Math.max(B.petSize * 1.2, 60);
      const rawPX = dx / sensitivityRadius;
      const rawPY = dy / sensitivityRadius;

      const tx = Math.max(-PUPIL_MAX_DX, Math.min(PUPIL_MAX_DX, rawPX));
      const ty = Math.max(-PUPIL_MAX_DY, Math.min(PUPIL_MAX_DY, rawPY));

      A.eyePupilX += (tx - A.eyePupilX) * LERP_SPEED;
      A.eyePupilY += (ty - A.eyePupilY) * LERP_SPEED;
    };

    console.log('[eye-tracking v1.0.0] head-centre from getPetBounds(), max ±' +
                PUPIL_MAX_DX + '×' + PUPIL_MAX_DY + ' cells');
  }

  M.lastActivity = performance.now();

  M.Interaction = M.Interaction || {};
  M.Interaction.setupEyeTracking = setupEyeTracking;
})();
