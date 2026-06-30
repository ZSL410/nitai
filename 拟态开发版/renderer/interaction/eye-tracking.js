// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Eye Tracking
//
//  Pupils follow mouse cursor relative to character head.
//  Uses getBounds() for head center position.
//  Smooth lerp avoids jitter. Only active in idle state.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  let mouseX = 0, mouseY = 0;
  let mouseOnWindow = false;
  const PUPIL_MAX_DX = 1.5, PUPIL_MAX_DY = 1.0;
  const LERP_SPEED = 0.28;

  function setupEyeTracking() {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseOnWindow = true;
      M.lastActivity = performance.now();
    });
    window.addEventListener('mouseleave', () => { mouseOnWindow = false; });
    window.addEventListener('mouseenter', () => { mouseOnWindow = true; });

    M.EyeTracking = {
      update() {
        const A = M.Anim;
        if (!A) return;

        if (!mouseOnWindow || (M.FSM && M.FSM.state !== 'idle')) {
          A.eyePupilX += (0 - A.eyePupilX) * 0.12;
          A.eyePupilY += (0 - A.eyePupilY) * 0.12;
          return;
        }

        const B = M.Rendering ? M.Rendering.getBounds() : null;
        if (!B) return;

        const headCX = B.headCX || (B.gx + 8 * B.cellSize);
        const headCY = B.headCY || (B.gy + 3.5 * B.cellSize);

        const dx = mouseX - headCX;
        const dy = mouseY - headCY;
        const radius = Math.max(B.petSize * 1.2, 60);
        const tx = M.EASING.clamp(dx / radius, -PUPIL_MAX_DX, PUPIL_MAX_DX);
        const ty = M.EASING.clamp(dy / radius, -PUPIL_MAX_DY, PUPIL_MAX_DY);

        A.eyePupilX += (tx - A.eyePupilX) * LERP_SPEED;
        A.eyePupilY += (ty - A.eyePupilY) * LERP_SPEED;
      },
    };

    console.log('[eye-tracking] v2.0 — head-center tracking active');
  }

  M.Interaction = M.Interaction || {};
  M.Interaction.setupEyeTracking = setupEyeTracking;
})();
