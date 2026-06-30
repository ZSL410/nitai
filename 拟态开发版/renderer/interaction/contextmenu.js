// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Right-Click Context Menu
//
//  Size switching, summon mode, wander toggle, passthrough.
//  Listens for IPC events from main process menu actions.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  function setupContextMenu() {
    const canvas = M.canvas;
    if (!canvas) return;

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      M.lastActivity = performance.now();
      M.ipc.send('show-context-menu', M.petSize, M.VERSION);
    });

    // Size change from main process menu
    M.ipc.on('size-changed', (_event, size) => {
      const s = Number(size);
      if (isNaN(s) || s <= 0) return;
      console.log('[size] changing to', s);
      if (M.Rendering && M.Rendering.applySize) {
        M.Rendering.applySize(s);
      }
    });

    // Summon target from overlay
    M.ipc.on('summon-target', (_event, screenX, screenY) => {
      const nx = Number(screenX), ny = Number(screenY);
      if (isNaN(nx) || isNaN(ny)) return;
      console.log('[summon] target:', nx, ny);

      if (M.Walk) M.Walk.stopWalking();
      M.FSM.transitionTo('walking');
      M.Walk.walkTo(nx, ny, 'run', () => {
        M.FSM.transitionTo('curious');
        if (M.Bubble) M.Bubble.show('我来啦！✨', { duration: 2000 });
        setTimeout(() => {
          if (M.FSM.state === 'curious') M.FSM.transitionTo('idle');
        }, 3000);
      });
    });

    // Summon cancelled
    M.ipc.on('summon-cancelled', () => {
      console.log('[summon] cancelled');
    });

    // Wander toggle from menu
    M.ipc.on('toggle-wander', () => {
      if (M.AI) M.AI.toggleWander();
    });

    console.log('[contextmenu] v2.0 — summon + wander + size channels');
  }

  M.Interaction = M.Interaction || {};
  M.Interaction.setupContextMenu = setupContextMenu;
})();
