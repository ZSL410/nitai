// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Particle Effects Engine
//
//  Types: heart (❤), star (✦), spark (·), note (♪)
//  Physics: float upward + drift + fade out.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  let particles = [];

  const TYPES = {
    heart: {
      color: '#FF6B8A', colorAlt: '#FF8FAF',
      size: 1, lifeMin: 0.8, lifeMax: 1.4,
      vyMin: -1.2, vyMax: -2.5, vxRange: 0.8, shape: 'heart',
    },
    star: {
      color: '#FFD700', colorAlt: '#FFEA70',
      size: 1, lifeMin: 1.0, lifeMax: 1.8,
      vyMin: -0.8, vyMax: -2.0, vxRange: 0.6, shape: 'star',
    },
    spark: {
      color: '#FFFFFF', colorAlt: '#FFEECC',
      size: 0.6, lifeMin: 0.4, lifeMax: 0.9,
      vyMin: -1.5, vyMax: -1.0, vxRange: 1.5, shape: 'dot',
    },
    note: {
      color: '#8B5CF6', colorAlt: '#A78BFA',
      size: 1.1, lifeMin: 1.0, lifeMax: 2.0,
      vyMin: -0.8, vyMax: -1.8, vxRange: 1.0, shape: 'note',
    },
  };

  function burst(type, count, origin) {
    const def = TYPES[type];
    if (!def) return;
    const ox = origin ? origin.x : 7.5;
    const oy = origin ? origin.y : 4;

    for (let i = 0; i < count; i++) {
      const life = def.lifeMin + Math.random() * (def.lifeMax - def.lifeMin);
      particles.push({
        type, life, maxLife: life,
        x: ox + (Math.random() - 0.5) * 4,
        y: oy + (Math.random() - 0.5) * 2,
        vx: (Math.random() - 0.5) * def.vxRange * 2,
        vy: -(def.vyMin + Math.random() * (def.vyMax - def.vyMin)),
        color: Math.random() > 0.5 ? def.color : def.colorAlt,
        size: def.size, shape: def.shape,
      });
    }
  }

  function updateAndDraw(ctx, cellSize, gx, gy) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 0.016;
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      p.x += p.vx * 0.05;
      p.y += p.vy * 0.05;
      p.vy += 0.02;
      p.vx *= 0.98;

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      const px = Math.floor(gx + p.x * cellSize);
      const py = Math.floor(gy + p.y * cellSize);
      const s = Math.ceil(cellSize * p.size);

      switch (p.shape) {
        case 'heart':
          ctx.fillStyle = p.color;
          ctx.fillRect(px, py, s, s);
          ctx.fillRect(px + s * 2, py, s, s);
          ctx.fillRect(px - s, py + s, s * 4, s);
          ctx.fillRect(px, py + s * 2, s, s);
          ctx.fillRect(px + s, py + s * 2, s, s);
          break;
        case 'star':
          ctx.fillStyle = p.color;
          ctx.fillRect(px + s, py, s, s);
          ctx.fillRect(px, py + s, s * 3, s);
          ctx.fillRect(px + s, py + s * 2, s, s);
          break;
        case 'note':
          ctx.fillStyle = p.color;
          ctx.fillRect(px + s, py, s * 2, s);
          ctx.fillRect(px + s, py + s * 2, s * 3, s);
          ctx.fillRect(px + s * 2, py + s * 3, s * 2, s);
          ctx.fillRect(px, py + s, s, s * 2);
          break;
        default:
          ctx.fillStyle = p.color;
          ctx.fillRect(px, py, s, s);
      }
      ctx.globalAlpha = 1;
    }
  }

  function clear() { particles.length = 0; }
  function count() { return particles.length; }

  M.Particles = { burst, updateAndDraw, clear, count };
  console.log('[particles] v2.0 — heart|star|spark|note');
})();
