// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Pixel Art Character Renderer
//
//  16×20 logical grid. Separable body parts.
//  Character is always drawn CENTERED in the canvas.
//  Window moves for desktop roaming — character stays centered.
//
//  Extension: swap PARTS or palette for different skins.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  // ── Palette (extensible — swap for skin variants) ─────
  const C = {
    skin:      '#FFB347',
    skinLight: '#FFD299',
    skinDark:  '#E8983E',
    eye:       '#2C2C2C',
    eyeWhite:  '#FFFFFF',
    eyeSpark:  '#FFD700',
    mouth:     '#2C2C2C',
    tongue:    '#FF6B6B',
    tongue2:   '#FF8888',
    cheek:     '#FFAAAA',
    belly:     '#FFE0BD',
    hair:      '#E8983E',
    tooth:     '#FFFFFF',
  };

  // ── Grid constants ────────────────────────────────────
  const GW = 16, GH = 20;

  // ── Body part definitions (grid coords [col, row]) ────
  const PARTS = {
    head: [
      [6,1],[7,1],[8,1],[9,1],
      [4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],
      [4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],
      [4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],
      [4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],
      [5,6],[6,6],[7,6],[8,6],[9,6],[10,6],
    ],
    hair: [[7,0],[8,0],[6,1],[7,1],[8,1],[9,1]],
    hairShadow: [[7,0]],
    neck: [[7,7],[8,7]],

    torso: [5,6,7,8,9,10].flatMap(c => [8,9,10,11,12].map(r => [c,r])),
    belly: [6,7,8,9].flatMap(c => [9,10,11].map(r => [c,r])),

    leftUpperArm:  [3,4].flatMap(c => [8,9,10].map(r => [c,r])),
    leftLowerArm:  [3,4].flatMap(c => [11,12].map(r => [c,r])),
    leftHand:      [[3,13],[4,13]],

    rightUpperArm: [11,12].flatMap(c => [8,9,10].map(r => [c,r])),
    rightLowerArm: [11,12].flatMap(c => [11,12].map(r => [c,r])),
    rightHand:     [[11,13],[12,13]],

    leftUpperLeg:  [5,6].flatMap(c => [14,15,16].map(r => [c,r])),
    leftLowerLeg:  [5,6].flatMap(c => [17,18].map(r => [c,r])),
    leftFoot:      [4,5,6].flatMap(c => [19].map(r => [c,r])),

    rightUpperLeg: [9,10].flatMap(c => [14,15,16].map(r => [c,r])),
    rightLowerLeg: [9,10].flatMap(c => [17,18].map(r => [c,r])),
    rightFoot:     [9,10,11].flatMap(c => [19].map(r => [c,r])),
  };

  // ── Drawing helpers ────────────────────────────────────

  function drawCell(ctx, col, row, color, S, gx, gy) {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(gx + col * S),
      Math.floor(gy + row * S),
      Math.ceil(S),
      Math.ceil(S)
    );
  }

  function fillCells(ctx, cells, offsetX, offsetY, color, S, gx, gy) {
    ctx.fillStyle = color;
    const s = Math.ceil(S);
    for (const [c, r] of cells) {
      ctx.fillRect(
        Math.floor(gx + (c + offsetX) * S),
        Math.floor(gy + (r + offsetY) * S),
        s, s
      );
    }
  }

  // ── Draw body (head, torso, limbs) ────────────────────

  function drawBody(ctx, S, gx, gy) {
    const A = M.Anim;
    const P = PARTS;

    // Get walk pose if walking
    let walkPose = null;
    if (M.isWalking && A.getWalkPose) {
      walkPose = A.getWalkPose();
    }

    const la = walkPose ? walkPose.leftArm  : A.leftArm;
    const ra = walkPose ? walkPose.rightArm : A.rightArm;
    const ll = walkPose ? walkPose.leftLeg  : A.leftLeg;
    const rl = walkPose ? walkPose.rightLeg : A.rightLeg;
    const fy = walkPose ? walkPose.feetY    : (A.feetY || 0);

    // Legs (behind body)
    fillCells(ctx, P.leftUpperLeg,  ll.dx, ll.dy, C.skin, S, gx, gy);
    fillCells(ctx, P.rightUpperLeg, rl.dx, rl.dy, C.skin, S, gx, gy);
    fillCells(ctx, P.leftLowerLeg,  ll.dx, ll.dy, C.skin, S, gx, gy);
    fillCells(ctx, P.rightLowerLeg, rl.dx, rl.dy, C.skin, S, gx, gy);

    // Feet
    for (const [c, r] of P.leftFoot)  drawCell(ctx, c, r + fy, C.skinDark, S, gx, gy);
    for (const [c, r] of P.rightFoot) drawCell(ctx, c, r + fy, C.skinDark, S, gx, gy);

    // Torso
    fillCells(ctx, P.torso, 0, 0, C.skin, S, gx, gy);
    fillCells(ctx, P.belly, 0, 0, C.belly, S, gx, gy);

    // Left arm (behind torso)
    fillCells(ctx, P.leftUpperArm, la.dx, la.dy, C.skin, S, gx, gy);
    fillCells(ctx, P.leftLowerArm, la.dx, la.dy, C.skin, S, gx, gy);
    fillCells(ctx, P.leftHand,     la.dx, la.dy, C.skinLight, S, gx, gy);

    // Neck
    fillCells(ctx, P.neck, 0, 0, C.skinLight, S, gx, gy);

    // Head
    const tilt = A.headTilt || 0;
    fillCells(ctx, P.head, tilt * 0.5, 0, C.skin, S, gx, gy);

    // Hair
    fillCells(ctx, P.hair, tilt * 0.5, 0, C.hair, S, gx, gy);
    fillCells(ctx, P.hairShadow, tilt * 0.5, 0, C.skinDark, S, gx, gy);

    // Right arm (in front of body)
    fillCells(ctx, P.rightUpperArm, ra.dx, ra.dy, C.skin, S, gx, gy);
    fillCells(ctx, P.rightLowerArm, ra.dx, ra.dy, C.skin, S, gx, gy);
    fillCells(ctx, P.rightHand,     ra.dx, ra.dy, C.skinLight, S, gx, gy);
  }

  // ── Draw face (eyes, mouth, cheeks) ───────────────────

  function drawFace(ctx, expr, S, gx, gy) {
    const A = M.Anim;
    const eyeOpen = A.eyeOpen !== false;

    // Pupil tracking offset (eye tracking)
    const px = Math.round(M.EASING.clamp(A.eyePupilX || 0, -2, 2));
    const py = Math.round(M.EASING.clamp(A.eyePupilY || 0, -1, 1));

    // ── Cheeks ─────────────────────────────────────────
    if (expr.cheek) {
      drawCell(ctx, 4, 3, C.cheek, S, gx, gy);
      drawCell(ctx, 5, 3, C.cheek, S, gx, gy);
      drawCell(ctx, 10, 3, C.cheek, S, gx, gy);
      drawCell(ctx, 11, 3, C.cheek, S, gx, gy);
    }

    // ── Eyes ───────────────────────────────────────────
    const eyeStyle = expr.eyes || 'round';
    const lx = 5 + px, rx = 9 + px;
    const ey = 2 + py;

    function e(c, r, color) { drawCell(ctx, c, r, color || C.eye, S, gx, gy); }
    function w(c, r)        { drawCell(ctx, c, r, C.eyeWhite, S, gx, gy); }
    function sp(c, r)       { drawCell(ctx, c, r, C.eyeSpark, S, gx, gy); }

    switch (eyeStyle) {
      case 'round':
        if (eyeOpen) {
          e(lx, ey); e(lx+1, ey); e(lx, ey+1); e(lx+1, ey+1);
          e(rx, ey); e(rx+1, ey); e(rx, ey+1); e(rx+1, ey+1);
          w(lx, ey); w(rx, ey);
        }
        break;
      case 'arch':
        e(lx, ey); e(lx+1, ey);
        e(rx, ey); e(rx+1, ey);
        break;
      case 'wide':
        for (let c = lx-1; c <= lx+1; c++) for (let r = ey-1; r <= ey+1; r++) e(c, r);
        for (let c = rx-1; c <= rx+1; c++) for (let r = ey-1; r <= ey+1; r++) e(c, r);
        w(lx, ey); w(rx, ey);
        break;
      case 'closed':
        e(lx-1, ey+1); e(lx, ey+1); e(lx+1, ey+1);
        e(rx-1, ey+1); e(rx, ey+1); e(rx+1, ey+1);
        break;
      case 'closed_arch':
        e(lx-1, ey); e(lx, ey+1); e(lx+1, ey);
        e(rx-1, ey); e(rx, ey+1); e(rx+1, ey);
        break;
      case 'half_closed':
        e(lx, ey+1); e(lx+1, ey+1); e(lx, ey); e(lx+1, ey);
        e(rx, ey+1); e(rx+1, ey+1); e(rx, ey); e(rx+1, ey);
        break;
      case 'sparkle':
        [lx+1, rx].forEach(cx => {
          sp(cx, ey+1);
          sp(cx-1, ey+1); sp(cx+1, ey+1);
          sp(cx, ey); sp(cx, ey+2);
        });
        break;
      case 'heart':
        // ♥ ♥ — heart-shaped eyes using small pixel pattern
        [lx, rx].forEach(hx => {
          drawCell(ctx, hx,   ey,   C.eye, S, gx, gy);
          drawCell(ctx, hx+1, ey,   C.eye, S, gx, gy);
          drawCell(ctx, hx-1, ey+1, C.eye, S, gx, gy);
          drawCell(ctx, hx,   ey+1, C.eyeSpark, S, gx, gy);
          drawCell(ctx, hx+1, ey+1, C.eye, S, gx, gy);
          drawCell(ctx, hx+2, ey+1, C.eye, S, gx, gy);
          drawCell(ctx, hx,   ey+2, C.eye, S, gx, gy);
          drawCell(ctx, hx+1, ey+2, C.eye, S, gx, gy);
        });
        break;
      default:
        e(lx, ey); e(lx+1, ey); e(lx, ey+1); e(lx+1, ey+1);
        e(rx, ey); e(rx+1, ey); e(rx, ey+1); e(rx+1, ey+1);
    }

    // Blink override for 'round' eyes
    if (eyeStyle === 'round' && !eyeOpen) {
      e(lx-1, ey+1); e(lx, ey+1); e(lx+1, ey+1);
      e(rx-1, ey+1); e(rx, ey+1); e(rx+1, ey+1);
    }

    // ── Mouth ──────────────────────────────────────────
    const mo = A.mouthOpen || 0;

    switch (expr.mouth) {
      case 'smile':
        if (mo > 0.5) {
          e(6, 4); e(7, 4); e(8, 4); e(9, 4);
          e(6, 5); e(9, 5);
          e(7, 5, C.tongue); e(8, 5, C.tongue);
        } else {
          e(6, 5); e(7, 4); e(8, 4); e(9, 5);
        }
        break;
      case 'open':
        if (mo > 0) {
          const h = mo > 0.7 ? 3 : 2;
          e(6, 4); e(7, 4); e(8, 4); e(9, 4);
          e(6, 5); e(7, 5); e(8, 5); e(9, 5);
          if (h === 3) { e(6, 6); e(7, 6); e(8, 6); e(9, 6); }
          e(7, 5, C.tongue); e(8, 5, C.tongue);
        } else {
          e(6, 4); e(7, 4); e(8, 4); e(9, 4);
          e(6, 5); e(7, 5); e(8, 5); e(9, 5);
          e(7, 5, C.tongue); e(8, 5, C.tongue);
        }
        break;
      case 'grin':
        e(5, 4); e(6, 4); e(7, 4); e(8, 4); e(9, 4); e(10, 4);
        e(5, 5); e(6, 5); e(7, 5); e(8, 5); e(9, 5); e(10, 5);
        e(6, 4, C.tooth); e(7, 4, C.tooth); e(8, 4, C.tooth); e(9, 4, C.tooth);
        break;
      case 'o':
        e(6, 4); e(7, 4); e(8, 4); e(9, 4);
        e(6, 5); e(9, 5);
        e(6, 6); e(9, 6);
        e(7, 6); e(8, 6);
        break;
      case 'none':
      default:
        break;
    }

    // ── Yawn override ──────────────────────────────────
    if (A.yawnPhase > 0) {
      const yp = A.yawnPhase;
      e(5, 4); e(6, 4); e(7, 4); e(8, 4); e(9, 4); e(10, 4);
      e(5, 5); e(6, 5); e(7, 5); e(8, 5); e(9, 5); e(10, 5);
      if (yp > 1.5) {
        e(5, 6); e(6, 6); e(7, 6); e(8, 6); e(9, 6); e(10, 6);
      }
      e(7, 5, C.tongue2); e(8, 5, C.tongue2);
      // Eyes forced closed
      e(4, 3); e(5, 3); e(6, 3);
      e(8, 3); e(9, 3); e(10, 3);
    }
  }

  // ── Headphones accessory ──────────────────────────────

  function drawHeadphones(ctx, S, gx, gy) {
    const A = M.Anim;
    if (!A.showHeadphones) return;

    const tilt = A.headTilt || 0;
    const h = Math.ceil(S);
    const tx = Math.round(gx + tilt * 0.5 * S);
    const bandColor = '#555', cupColor = '#444', padColor = '#666';

    ctx.fillStyle = bandColor;
    for (let c = 5; c <= 10; c++) {
      ctx.fillRect(Math.floor(tx + c * S), Math.floor(gy), h, h);
    }
    ctx.fillRect(Math.floor(tx + 4 * S), Math.floor(gy + 1 * S), h, h * 2);
    ctx.fillRect(Math.floor(tx + 11 * S), Math.floor(gy + 1 * S), h, h * 2);

    ctx.fillStyle = cupColor;
    ctx.fillRect(Math.floor(tx + 3 * S), Math.floor(gy + 2 * S), h * 2, h * 2);
    ctx.fillStyle = padColor;
    ctx.fillRect(Math.floor(tx + 3 * S), Math.floor(gy + 3 * S), h * 2, h);

    ctx.fillStyle = cupColor;
    ctx.fillRect(Math.floor(tx + 11 * S), Math.floor(gy + 2 * S), h * 2, h * 2);
    ctx.fillStyle = padColor;
    ctx.fillRect(Math.floor(tx + 11 * S), Math.floor(gy + 3 * S), h * 2, h);
  }

  // ── Get bounds (for hit testing, bubble positioning) ──

  function getCharacterBounds() {
    const petSize = M.petSize;
    const scale = M.Anim.bodyScale || 1;
    const effectiveSize = petSize * scale;
    const cellSize = effectiveSize / GH;
    const totalW = GW * cellSize;
    const totalH = effectiveSize;
    const bobY = M.Anim._smoothBob || 0;

    // Character is always centered in canvas
    const centerX = M.winW / 2;
    const centerY = M.winH / 2;
    const gx = centerX - totalW / 2;
    const gy = centerY - totalH / 2 + bobY;

    // Head bounds (for hit testing)
    const headTop = gy;
    const headBottom = gy + 7 * cellSize;
    const headLeft = gx + 4 * cellSize;
    const headRight = gx + 12 * cellSize;

    // Body bounds
    const bodyTop = gy + 8 * cellSize;
    const bodyBottom = gy + 14 * cellSize;

    // Mouth position (for bubble tail)
    const mouthX = gx + 7.5 * cellSize;
    const mouthY = gy + 5 * cellSize;

    return {
      centerX, centerY,
      petSize, scale, effectiveSize,
      cellSize, totalW, totalH,
      gx, gy, bobY,
      headTop, headBottom, headLeft, headRight,
      bodyTop, bodyBottom,
      mouthX, mouthY,
      gridW: GW, gridH: GH,
    };
  }

  // ── Main draw function ────────────────────────────────

  function draw() {
    const canvas = M.canvas, ctx = M.ctx;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, M.winW, M.winH);
    ctx.imageSmoothingEnabled = false;

    const B = getCharacterBounds();
    const exprName = M.FSM ? M.FSM.getExpression() : 'neutral';
    const expr = M.EXPRESSIONS[exprName] || M.EXPRESSIONS.neutral;

    drawBody(ctx, B.cellSize, B.gx, B.gy);
    drawFace(ctx, expr, B.cellSize, B.gx, B.gy);
    drawHeadphones(ctx, B.cellSize, B.gx, B.gy);

    // Particles
    if (M.Particles && M.Particles.count() > 0) {
      M.Particles.updateAndDraw(ctx, B.cellSize, B.gx, B.gy);
    }

    // Export mouth position for bubble
    M._mouthCanvasPos = { x: B.mouthX, y: B.mouthY };
  }

  // ── Hit test (canvas coords → body part) ──────────────

  function hitTest(canvasX, canvasY) {
    const B = getCharacterBounds();
    const col = (canvasX - B.gx) / B.cellSize;
    const row = (canvasY - B.gy) / B.cellSize;

    if (col >= 4 && col <= 11 && row >= 0 && row <= 6) return 'head';
    if (col >= 5 && col <= 10 && row >= 7 && row <= 13) return 'body';
    return 'other';
  }

  // ── Layout update (resize canvas + window) ────────────

  function updateLayout(bubbleH) {
    const SIDE_PAD = 20, BOTTOM_MARGIN = 10;
    const ps = M.petSize;

    M.winW = ps + SIDE_PAD * 2;
    M.winH = ps + 2 * Math.max(bubbleH || 0, BOTTOM_MARGIN);

    const canvas = M.canvas;
    if (canvas) {
      canvas.width = M.winW;
      canvas.height = M.winH;
      canvas.style.width = M.winW + 'px';
      canvas.style.height = M.winH + 'px';
    }
    document.body.style.width = M.winW + 'px';
    document.body.style.height = M.winH + 'px';
    document.documentElement.style.width = M.winW + 'px';
    document.documentElement.style.height = M.winH + 'px';

    const w = Number(M.winW), h = Number(M.winH);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      M.ipc.send('resize-window', w, h);
    }
  }

  function applySize(size) {
    const s = Number(size);
    if (isNaN(s) || s <= 0) return;

    const oldSize = M.petSize;
    M.petSize = s;
    if (M.Anim) {
      M.Anim.targetScale = 1;
      M.Anim.bodyScale = oldSize / s;
    }
    updateLayout(0);
    M.ipc.send('set-pet-size', M.petSize);
  }

  // ── Export ──────────────────────────────────────────────

  M.Rendering = {
    draw,
    getBounds: getCharacterBounds,
    hitTest,
    updateLayout,
    applySize,
    PARTS,    // expose for skin swapping
    C,        // expose palette for skin swapping
  };

  console.log('[pixel-renderer] v2.0 — character always centered, window moves');
})();
