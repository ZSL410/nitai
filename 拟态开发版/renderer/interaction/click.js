// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Click Reactions
//
//  Click head → happy (bounce + smile)
//  Click body → surprised (jump + wide eyes)
//  Double-click → excited (sparkle + spin)
//  Triple-click → summon mode
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  let lastClickTime = 0;
  let clickCount = 0;

  function setupClickReactions() {
    const canvas = M.canvas;
    if (!canvas) return;

    canvas.addEventListener('click', (e) => {
      M.lastActivity = performance.now();

      const now = performance.now();
      if (now - lastClickTime < 400) {
        clickCount++;
      } else {
        clickCount = 1;
      }
      lastClickTime = now;

      const part = M.Rendering ? M.Rendering.hitTest(e.offsetX, e.offsetY) : 'other';

      if (clickCount >= 3) {
        handleTripleClick();
        return;
      }

      if (clickCount >= 2) {
        handleDoubleClick();
        return;
      }

      switch (part) {
        case 'head': handleHeadClick(); break;
        case 'body': handleBodyClick(); break;
        default:    handleBoop();
      }
    });
  }

  function handleHeadClick() {
    M.Anim.headTilt = -0.6;
    setTimeout(() => { M.Anim.headTilt = 0; }, 400);
    M.Anim.bobOffset = -4;
    setTimeout(() => { M.Anim.bobOffset = 0; }, 200);

    if (M.Audio) M.Audio.play('chirp');
    if (M.Particles) M.Particles.burst('note', 3, { x: 8, y: 3 });
    if (M.Bubble) M.Bubble.show('好痒~  (*/ω＼*)', { duration: 1500 });

    if (M.FSM.state === 'idle') {
      M.FSM.transitionTo('happy');
      setTimeout(() => {
        if (M.FSM.state === 'happy') M.FSM.transitionTo('idle');
      }, 1500);
    }
  }

  function handleBodyClick() {
    M.Anim.bobOffset = -4;
    M.Anim.bodySquash = -0.1;
    setTimeout(() => { M.Anim.bobOffset = 0; M.Anim.bodySquash = 0; }, 300);

    if (M.Audio) M.Audio.play('boing');
    if (M.Particles) M.Particles.burst('spark', 4, { x: 8, y: 7 });
    if (M.Bubble) M.Bubble.show('嘿！别戳我肚子！', { duration: 1500 });

    if (M.FSM.state === 'idle') {
      M.FSM.transitionTo('surprised');
      setTimeout(() => {
        if (M.FSM.state === 'surprised') M.FSM.transitionTo('idle');
      }, 1500);
    }
  }

  function handleDoubleClick() {
    M.Anim.bobOffset = -12;
    M.Anim.bodySquash = -0.2;
    M.Anim.rightArm = { dx: 2, dy: -5 };
    setTimeout(() => {
      M.Anim.bobOffset = 0;
      M.Anim.bodySquash = 0;
      M.Anim.rightArm = { dx: 0, dy: 0 };
    }, 500);

    if (M.Audio) M.Audio.play('boing');
    if (M.Particles) M.Particles.burst('spark', 10, { x: 8, y: 6 });
    if (M.Bubble) M.Bubble.show('(*´▽`*) 你戳我干嘛~', { duration: 2000 });

    M.FSM.transitionTo('happy');
    setTimeout(() => {
      if (M.FSM.state === 'happy') M.FSM.transitionTo('idle');
    }, 2500);
  }

  function handleTripleClick() {
    // Summon mode: click anywhere on desktop → pet walks there
    if (M.Bubble) M.Bubble.show('🔮 点一下你想让我去的地方~', { duration: 2000 });
    M.ipc.send('start-summon');
  }

  function handleBoop() {
    M.Anim.bobOffset = -2;
    setTimeout(() => { M.Anim.bobOffset = 0; }, 150);
  }

  M.Interaction = M.Interaction || {};
  M.Interaction.setupClickReactions = setupClickReactions;
  console.log('[click] v2.0 — hit-test + triple-click summon');
})();
