// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Music Detection Renderer
//
//  Listens for 'music-playing' / 'music-stopped' IPC from main.
//  Auto-shows headphones + happy expression when music detected.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  let autoListening = false;

  function setupMusicDetect() {
    if (!M.ipc) return;

    M.ipc.on('music-playing', (_event, playerName) => {
      console.log('[music-detect] detected:', playerName);

      if (M.FSM && M.FSM.state === 'idle') {
        autoListening = true;
        M.Anim.showHeadphones = true;
        M.FSM.transitionTo('happy');
        if (M.Bubble) {
          M.Bubble.show('🎧 检测到音乐~ (' + (playerName || '?') + ')', { duration: 2500 });
        }
      }
    });

    M.ipc.on('music-stopped', () => {
      console.log('[music-detect] stopped');

      if (autoListening) {
        autoListening = false;
        M.Anim.showHeadphones = false;
        if (M.FSM && M.FSM.state === 'happy') {
          M.FSM.transitionTo('idle');
        }
      }
    });

    console.log('[music-detect] v2.0 — auto-detect listener ready');
  }

  M.Interaction = M.Interaction || {};
  M.Interaction.setupMusicDetect = setupMusicDetect;
})();
