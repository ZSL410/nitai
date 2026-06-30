// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Window Drag (document-level tracking)
//
//  Drag the pet window around the desktop.
//  Updates world position to match after drag.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  let dragging = false;
  let dragSX = 0, dragSY = 0;

  function setupDrag() {
    const canvas = M.canvas;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      dragSX = Math.round(Number(e.screenX));
      dragSY = Math.round(Number(e.screenY));
      if (isNaN(dragSX)) dragSX = 0;
      if (isNaN(dragSY)) dragSY = 0;
      M.lastActivity = performance.now();

      // Stop any autonomous walking when grabbed
      if (M.Walk) M.Walk.stopWalking();
      if (M.FSM && M.FSM.state === 'walking') M.FSM.transitionTo('idle');
    });

    document.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const sx = Math.round(Number(e.screenX));
      const sy = Math.round(Number(e.screenY));
      if (isNaN(sx) || isNaN(sy)) return;

      let dx = sx - dragSX, dy = sy - dragSY;
      if (isNaN(dx)) dx = 0;
      if (isNaN(dy)) dy = 0;
      dragSX = sx;
      dragSY = sy;

      if (dx !== 0 || dy !== 0) {
        try {
          M.ipc.send('window-drag', dx, dy);
          // Update world position to track window movement
          M.worldX += dx;
          M.worldY += dy;
          M.winScreenX += dx;
          M.winScreenY += dy;
        } catch (err) {
          console.error('[drag] IPC error:', err.message);
        }
      }
    });

    document.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      M.ipc.send('save-position');
    });
  }

  M.Interaction = M.Interaction || {};
  M.Interaction.setupDrag = setupDrag;
  console.log('[drag] v2.0 — document-level tracking + world sync');
})();
