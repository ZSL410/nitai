// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Web Audio Synthesizer
//
//  Pure Web Audio API synthesis — no external audio files.
//  Sounds: chirp, yawn, boing, nom, bongo, footstep
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  let ctx = null;

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('[audio] AudioContext not available:', e.message);
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playChirp() {
    const ac = getCtx(); if (!ac) return;
    const now = ac.currentTime, dur = 0.15;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + dur * 0.6);
    osc.frequency.linearRampToValueAtTime(900, now + dur);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(now); osc.stop(now + dur);
  }

  function playBoing() {
    const ac = getCtx(); if (!ac) return;
    const now = ac.currentTime, dur = 0.2;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + dur * 0.3);
    osc.frequency.linearRampToValueAtTime(400, now + dur);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(now); osc.stop(now + dur);
  }

  function playNom() {
    const ac = getCtx(); if (!ac) return;
    const now = ac.currentTime, dur = 0.05;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + dur);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(now); osc.stop(now + dur);
  }

  function playFootstep() {
    const ac = getCtx(); if (!ac) return;
    const now = ac.currentTime, dur = 0.04;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(40, now + dur);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(now); osc.stop(now + dur);
  }

  const sounds = {
    chirp: playChirp,
    boing: playBoing,
    nom: playNom,
    footstep: playFootstep,
  };

  function play(name) {
    const fn = sounds[name];
    if (fn) { try { fn(); } catch (e) {} }
  }

  M.Audio = { play, sounds, getCtx };
  console.log('[audio] v2.0 Web Audio synthesizer ready');
})();
