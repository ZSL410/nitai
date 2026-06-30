// ═══════════════════════════════════════════════════════════
//  Mimic v1.0.0 — Window Layout Engine
//
//  Dynamic window sizing & positioning.
//  Guarantees: pet is ALWAYS centred at (winW/2, winH/2).
//  Bubble fits in the overhead region above the pet.
//  getPetBounds() is the single source of truth for all coordinates.
//
//  KEY FIX (v1.0.0): cellSize = petSize / GH (float, not rounded).
//  This ensures totalH === petSize exactly. Previously round(petSize/20)
//  caused totalH ≠ petSize for sizes 50/110, pushing the character off-centre.
//
//  tickAnim() must be called ONCE per frame BEFORE getPetBounds().
//  This prevents compound-lerp of _smoothBob when getPetBounds
//  is called from multiple places in the same tick.
//
//  Layout formula:
//    overhead  = measuredH + ARROW_H + GAP
//    winH      = petSize + 2 × max(overhead, BOTTOM_MARGIN)
//    petCX = winW/2, petCY = winH/2
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  // ── Bubble metrics (font / padding scale with petSize) ──

  function updateBubbleMetrics() {
    const ps = M.petSize;
    const fontSize = Math.max(8, Math.min(16, Math.round(ps * 0.15)));
    const padV = Math.max(3, Math.round(fontSize * 0.55));
    const padH = Math.max(5, Math.round(fontSize * 0.9));
    M.bubbleMetrics = { fontSize, padV, padH };
  }

  // ── Offscreen measurement ───────────────────────────────

  function measureBubbleSize(text) {
    const { fontSize, padV, padH } = M.bubbleMetrics;
    const maxW = Math.round((M.petSize + M.SIDE_PAD * 2) * 0.8);

    const m = document.createElement('div');
    m.style.position        = 'absolute';
    m.style.visibility      = 'hidden';
    m.style.pointerEvents   = 'none';
    m.style.fontFamily      = 'sans-serif';
    m.style.fontSize        = fontSize + 'px';
    m.style.padding         = padV + 'px ' + padH + 'px';
    m.style.maxWidth        = maxW + 'px';
    m.style.whiteSpace      = 'normal';
    m.style.wordWrap        = 'break-word';
    m.style.border          = '1px solid #999';
    m.style.borderRadius    = '14px';
    m.style.backgroundColor = 'rgba(255,255,255,0.94)';
    m.textContent           = text;
    document.body.appendChild(m);

    const w = m.offsetWidth;
    const h = m.offsetHeight;
    document.body.removeChild(m);

    return { w, h };
  }

  // ── Main layout computation ─────────────────────────────

  function updateWindowSizeAndLayout(bubbleText) {
    const { SIDE_PAD, ARROW_H, GAP, BOTTOM_MARGIN } = M;

    // 1. Measure bubble text
    let measuredH = 0;
    if (bubbleText) {
      const sz = measureBubbleSize(bubbleText);
      measuredH = sz.h;
    }
    M.currentBubbleH = measuredH;

    // 2. Compute window dimensions
    M.winW = M.petSize + SIDE_PAD * 2;

    const overhead = measuredH > 0 ? (measuredH + ARROW_H + GAP) : 0;
    M.winH = M.petSize + 2 * Math.max(overhead, BOTTOM_MARGIN);

    // 3. Pet centre = window centre
    M.petCX = M.winW / 2;
    M.petCY = M.winH / 2;

    const wPx = M.winW + 'px';
    const hPx = M.winH + 'px';

    // 4. Resize canvas & DOM
    const canvas = M.canvas;
    if (canvas) {
      canvas.width  = M.winW;
      canvas.height = M.winH;
      canvas.style.width  = wPx;
      canvas.style.height = hPx;
    }

    document.body.style.width  = wPx;
    document.body.style.height = hPx;
    document.documentElement.style.width  = wPx;
    document.documentElement.style.height = hPx;

    const overlay = M.overlay;
    if (overlay) {
      overlay.style.width  = wPx;
      overlay.style.height = hPx;
    }

    // 5. Position bubble — delegate to Bubble module if active,
    //    otherwise use default pet-top positioning
    if (bubbleText) {
      const { fontSize, padV, padH } = M.bubbleMetrics;
      const maxW = Math.round(M.winW * 0.8);

      const bubbleEl = M.bubbleEl;
      if (bubbleEl) {
        bubbleEl.style.fontSize   = fontSize + 'px';
        bubbleEl.style.padding    = padV + 'px ' + padH + 'px';
        bubbleEl.style.maxWidth   = maxW + 'px';
        bubbleEl.style.whiteSpace = 'normal';
        bubbleEl.style.wordWrap   = 'break-word';

        // Only set top if Bubble module is NOT managing positioning
        if (!M._bubbleManaged) {
          const petTop = M.petCY - M.petSize / 2;
          const arrowTipY = petTop - GAP;
          bubbleEl.style.top = (arrowTipY - measuredH) + 'px';
        }
      }
    }

    // 6. Tell main process to resize (type-safe, flat args)
    const sendW = Number(M.winW);
    const sendH = Number(M.winH);
    if (!isNaN(sendW) && !isNaN(sendH) && sendW > 0 && sendH > 0) {
      M.ipc.send('resize-window', sendW, sendH);
    }

    // 7. Redraw
    if (M.Rendering && M.Rendering.draw) {
      M.Rendering.draw();
    }

    console.log('[layout] pet=' + M.petSize +
                ' bubbleH=' + measuredH +
                ' overhead=' + overhead +
                ' => win=' + M.winW + 'x' + M.winH +
                ' petC=(' + Math.round(M.petCX) + ',' + Math.round(M.petCY) + ')' +
                ' petTop=' + Math.round(M.petCY - M.petSize / 2));
  }

  // ── Size control (called when user changes pet size) ────

  function applySize(size) {
    // Type guard
    const s = Number(size);
    if (isNaN(s) || s <= 0) {
      console.warn('[layout] applySize rejected: invalid size', size);
      return;
    }
    size = s;

    // Smooth scale transition
    const oldSize = M.petSize;
    M.petSize = size;
    updateBubbleMetrics();

    // Trigger scale animation
    if (M.Anim) {
      M.Anim.targetScale = 1;
      M.Anim.bodyScale = oldSize / size;  // start from old scale
    }

    M.ipc.send('set-pet-size', M.petSize);

    const bubbleEl = M.bubbleEl;
    if (bubbleEl && bubbleEl.classList.contains('on') && bubbleEl.textContent) {
      updateWindowSizeAndLayout(bubbleEl.textContent);
    } else {
      updateWindowSizeAndLayout(null);
    }

    M.lastBlink = performance.now();
    M.eyeOpen = true;
  }

  // ── Pet bounds (single source of truth for all coordinates) ──

  // Grid constants
  const GW = 16, GH = 20;
  const MOUTH_GRID = { col: 7.5, row: 5 };
  const HEAD_COLS = { min: 4, max: 11 };
  const HEAD_ROWS = { min: 0, max: 6 };
  const HEAD_CENTER_COL = (HEAD_COLS.min + HEAD_COLS.max) / 2;  // 7.5
  const HEAD_CENTER_ROW = (HEAD_ROWS.min + HEAD_ROWS.max) / 2;  // 3.0
  const TORSO_COLS = { min: 5, max: 10 };
  const TORSO_ROWS = { min: 7, max: 13 };

  // Cached bounds from last tickAnim() call — invalidated each frame
  let _cachedBounds = null;
  let _lastTickId = 0;
  let _tickCounter = 0;

  /**
   * tickAnim()
   * Must be called ONCE per animation frame BEFORE any getPetBounds() calls.
   * Updates smooth animation state (bob lerp, scale lerp).
   * This is the ONLY place where animation state mutates.
   */
  function tickAnim() {
    const A = M.Anim;
    if (!A) return;

    _tickCounter++;
    _cachedBounds = null; // invalidate cache

    // Smooth scale lerp (body size transition)
    if (A.bodyScale === undefined) A.bodyScale = 1;
    A.bodyScale += ((A.targetScale || 1) - A.bodyScale) * 0.15;

    // Smooth bob lerp — UPDATED ONCE PER FRAME
    // (was previously inside getPetBounds(), causing compound-lerp when called multiple times)
    if (A._smoothBob === undefined) A._smoothBob = 0;
    A._smoothBob += ((A.bobOffset || 0) - A._smoothBob) * 0.22;
  }

  /**
   * getPetBounds()
   * Read-only. Returns ALL coordinate values for rendering, interaction, and bubble modules.
   * Animation state updates happen in tickAnim() — NOT here.
   * Cached within a single frame so multiple callers get identical values.
   *
   * @returns {{
   *   centerX: number, centerY: number,  // window centre = pet centre
   *   petSize: number, scale: number, effectiveSize: number,
   *   cellSize: number,                  // pixels per grid cell (float — exact division)
   *   totalW: number, totalH: number,    // total grid pixel dimensions (= petSize)
   *   gx: number, gy: number,            // grid origin (top-left) on canvas
   *   bobY: number,                      // current smooth bob offset
   *   headCX: number, headCY: number,    // head centre on canvas
   *   headTop: number,                   // head top edge Y on canvas
   *   headBottom: number,                // head bottom edge Y on canvas
   *   headLeft: number, headRight: number,  // head horizontal bounds
   *   mouthX: number, mouthY: number,    // mouth position on canvas
   *   bodyTop: number, bodyBottom: number,  // torso vertical bounds
   *   gridW: number, gridH: number       // grid dimensions in cells
   * }}
   */
  function getPetBounds() {
    // Return cached if already computed this frame
    if (_cachedBounds && _cachedBounds._tickId === _tickCounter) {
      return _cachedBounds;
    }

    const A = M.Anim || {};

    // ── KEY FIX: cellSize = petSize / GH  (float, NOT rounded) ──
    // This ensures totalH === petSize exactly, matching the layout formula.
    // Without this, round(petSize/20) causes totalH ≠ petSize for sizes 50/110,
    // pushing the character off-centre. Canvas with smoothing disabled renders
    // fractional pixel coords cleanly.
    const petSize = M.petSize;
    const scale = (A.bodyScale !== undefined) ? A.bodyScale : 1;
    const effectiveSize = petSize * scale;
    const cellSize = effectiveSize / GH;

    const totalW = GW * cellSize;
    const totalH = effectiveSize;  // exactly petSize*scale = GH*cellSize
    const bobY = A._smoothBob || 0;

    // Grid origin (top-left on canvas) — NO Math.floor
    // Canvas 2D with smoothing disabled handles sub-pixel coords correctly
    const centerX = M.petCX;
    const centerY = M.petCY;
    const gx = centerX - totalW / 2;
    const gy = centerY - totalH / 2 + bobY;

    // Head (grid rows 0-6, cols 4-11)
    const tilt = A.headTilt || 0;
    const headCX = gx + (HEAD_CENTER_COL + tilt * 0.5) * cellSize;
    const headCY = gy + HEAD_CENTER_ROW * cellSize;
    const headTop = gy + HEAD_ROWS.min * cellSize;
    const headBottom = gy + HEAD_ROWS.max * cellSize;
    const headLeft = gx + (HEAD_COLS.min + tilt * 0.5) * cellSize;
    const headRight = gx + (HEAD_COLS.max + tilt * 0.5) * cellSize;

    // Body/torso (grid rows 7-13)
    const bodyTop = gy + TORSO_ROWS.min * cellSize;
    const bodyBottom = gy + TORSO_ROWS.max * cellSize;

    // Mouth (grid col 7.5, row 5) — for bubble tail attachment
    const mouthX = gx + (MOUTH_GRID.col + tilt * 0.5) * cellSize;
    const mouthY = gy + MOUTH_GRID.row * cellSize;

    _cachedBounds = {
      centerX, centerY,
      petSize, scale, effectiveSize,
      cellSize, totalW, totalH,
      gx, gy, bobY,
      headCX, headCY, headTop, headBottom, headLeft, headRight,
      bodyTop, bodyBottom,
      mouthX, mouthY,
      gridW: GW, gridH: GH,
      _tickId: _tickCounter,  // for cache validation
    };

    return _cachedBounds;
  }

  // ── Export ──────────────────────────────────────────────

  M.Layout = {
    tickAnim,               // call once per frame, before any getPetBounds()
    getPetBounds,            // read-only coordinates, cached within frame
    updateBubbleMetrics,
    measureBubbleSize,
    updateWindowSizeAndLayout,
    applySize,
    // Grid constants for external use
    GW, GH,
    MOUTH_GRID,
    HEAD_COLS, HEAD_ROWS,
    TORSO_COLS, TORSO_ROWS,
  };

  console.log('[layout v1.0.0] module initialized + getPetBounds() coordinate hub');
})();
