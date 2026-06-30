// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Behavior State Machine
//
//  Manages character behavioral states. Each state defines:
//   - expression: face to show
//   - enter/update/exit: lifecycle hooks
//
//  States: idle | walking | curious | happy | surprised | sleepy
//
//  Extensible: add new state files in behavior/states/
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  const FSM = {
    state: 'idle',
    prevState: null,
    context: {},
    stateStartTime: 0,
    stateTimer: 0,

    // State handlers (populated by state definitions)
    _handlers: {},

    /**
     * Transition to a new state.
     * @param {string} newState - State name
     * @param {object} ctx - Context to pass to the new state
     */
    transitionTo(newState, ctx = {}) {
      if (this.state === newState && newState !== 'idle') {
        // Re-enter same non-idle state: restart timer
        this.stateStartTime = performance.now();
        this.context = { ...this.context, ...ctx };
        return;
      }

      // Exit old state
      this._exit(this.state);

      // Enter new state
      this.prevState = this.state;
      this.state = newState;
      this.context = ctx;
      this.stateStartTime = performance.now();
      this.stateTimer = 0;

      this._enter(newState);

      // Sync behavior state
      M.behaviorState = newState;

      console.log('[fsm]', this.prevState, '→', newState,
        Object.keys(ctx).length ? JSON.stringify(ctx) : '');
    },

    /**
     * Update current state (called every frame).
     */
    update(now) {
      this.stateTimer = now - this.stateStartTime;
      this._update(this.state, now);
    },

    /**
     * Get the expression name for the current state.
     */
    getExpression() {
      const h = this._handlers[this.state];
      if (h && h.expression) {
        const name = (typeof h.expression === 'function')
          ? h.expression()
          : h.expression;
        return M.EXPRESSIONS[name] ? name : 'neutral';
      }
      return 'neutral';
    },

    // ── Internal helpers ──────────────────────────────────

    _data: {},

    _enter(state) {
      const h = this._handlers[state];
      if (h && h.enter) h.enter.call(this);
    },

    _update(state, now) {
      const h = this._handlers[state];
      if (h && h.update) h.update.call(this, now);
    },

    _exit(state) {
      const h = this._handlers[state];
      if (h && h.exit) h.exit.call(this);
    },

    _clearTimer(key) {
      if (this._data[key]) {
        clearTimeout(this._data[key]);
        this._data[key] = null;
      }
    },

    _clearAllTimers() {
      Object.keys(this._data).forEach(k => {
        if (this._data[k]) {
          clearTimeout(this._data[k]);
          this._data[k] = null;
        }
      });
    },
  };

  // ── Register built-in states ────────────────────────────

  // --- IDLE ---
  FSM._handlers.idle = {
    expression: 'neutral',
    enter() {
      M.Anim.reset();
      M.Anim.targetScale = 1;
    },
    update(now) {
      // Idle behaviors handled by AI controller
    },
    exit() {
      // Cleanup
    },
  };

  // --- WALKING ---
  FSM._handlers.walking = {
    expression: 'neutral',
    enter() {
      M.isWalking = true;
      M.Anim.targetScale = 1;
    },
    update(now) {
      // If no longer walking, go back to idle
      if (!M.isWalking && !M.Walk.hasTarget) {
        this.transitionTo('idle');
      }
    },
    exit() {
      M.isWalking = false;
      M.Anim.reset();
    },
  };

  // --- CURIOUS ---
  FSM._handlers.curious = {
    expression: 'curious',
    enter() {
      M.Anim.headTilt = -0.5;
      M.Anim.mouthOpen = 0.3;
      if (M.Audio) M.Audio.play('chirp');
    },
    update(now) {
      // Auto-recover after 3 seconds
      if (this.stateTimer > 3000) {
        this.transitionTo('idle');
      }
    },
    exit() {
      M.Anim.headTilt = 0;
      M.Anim.mouthOpen = 0;
    },
  };

  // --- HAPPY ---
  FSM._handlers.happy = {
    expression: 'happy',
    enter() {
      M.Anim.bobOffset = -8;
      M.Anim.headTilt = -0.3;
      M.Anim.rightArm = { dx: 2, dy: -4 };
      if (M.Audio) M.Audio.play('boing');
      if (M.Particles) M.Particles.burst('spark', 5, { x: 8, y: 3 });
    },
    update(now) {
      // Bob up and down
      const t = this.stateTimer / 1000;
      M.Anim.bobOffset = Math.sin(t * 8) * 6 - 2;

      // Auto-recover after 2.5 seconds
      if (this.stateTimer > 2500) {
        this.transitionTo('idle');
      }
    },
    exit() {
      M.Anim.bobOffset = 0;
      M.Anim.headTilt = 0;
      M.Anim.rightArm = { dx: 0, dy: 0 };
    },
  };

  // --- SURPRISED ---
  FSM._handlers.surprised = {
    expression: 'surprised',
    enter() {
      M.Anim.bobOffset = -10;
      M.Anim.bodySquash = -0.15;
      M.Anim.mouthOpen = 1;
      if (M.Audio) M.Audio.play('boing');
      if (M.Particles) M.Particles.burst('spark', 4, { x: 8, y: 7 });
    },
    update(now) {
      // Settle down
      if (this.stateTimer > 300) {
        M.Anim.bobOffset *= 0.8;
        M.Anim.bodySquash *= 0.8;
      }
      // Auto-recover after 2 seconds
      if (this.stateTimer > 2000) {
        this.transitionTo('idle');
      }
    },
    exit() {
      M.Anim.reset();
    },
  };

  // --- SLEEPY ---
  FSM._handlers.sleepy = {
    expression: 'sleepy',
    enter() {
      M.Anim.headTilt = 0.3;
      M.Anim.targetScale = 0.95;
    },
    update(now) {
      // Occasional yawn
      if (this.stateTimer > 5000 && Math.random() < 0.002) {
        M.Anim.yawnPhase = 2;
        setTimeout(() => { M.Anim.yawnPhase = 0; }, 1500);
      }
      // Wake up on activity
      const idleTime = now - M.lastActivity;
      if (idleTime < 2000) {
        this.transitionTo('idle');
      }
    },
    exit() {
      M.Anim.headTilt = 0;
      M.Anim.targetScale = 1;
      M.Anim.yawnPhase = 0;
    },
  };

  // ── Export ──────────────────────────────────────────────

  M.FSM = FSM;
  console.log('[fsm] v2.0 state machine with ' +
    Object.keys(FSM._handlers).length + ' states');
})();
