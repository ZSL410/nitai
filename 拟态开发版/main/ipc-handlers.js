// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — IPC Handlers
//
//  All IPC channels use flat args for type safety.
//  Added: move-window, start-summon, summon-target, summon-cancel
// ═══════════════════════════════════════════════════════════

const { ipcMain, Menu } = require('electron');
const {
  getPetWindow, moveWindowTo,
  createSummonOverlay, destroySummonOverlay,
  setPassthrough, isPassthrough, quitApp,
} = require('./window');
const { setLastKnownPetSize, refreshTrayMenu } = require('./tray');
const { getConfig } = require('./config');
const { savePosition } = require('./position-store');

let resizeAnimId = null;

function registerIpcHandlers() {

  // ── Window drag (delta movement, ultra-defensive) ─────
  ipcMain.on('window-drag', (_e, dx, dy) => {
    const ndx = Math.round(Number(dx)), ndy = Math.round(Number(dy));
    if (isNaN(ndx) || isNaN(ndy) || (ndx === 0 && ndy === 0)) return;
    const win = getPetWindow();
    if (!win || win.isDestroyed()) return;
    try {
      const [x, y] = win.getPosition();
      moveWindowTo(x + ndx, y + ndy);
    } catch (err) {
      console.error('[ipc] window-drag error:', err.message);
    }
  });

  // ── Window move to absolute screen position (for character walking) ──
  ipcMain.on('move-window', (_e, x, y) => {
    const nx = Number(x), ny = Number(y);
    if (isNaN(nx) || isNaN(ny)) return;
    moveWindowTo(nx, ny);
  });

  // ── Dynamic window resize (animated ease-out) ─────────
  ipcMain.on('resize-window', (_e, w, h) => {
    const targetW = Math.round(Number(w)), targetH = Math.round(Number(h));
    if (isNaN(targetW) || isNaN(targetH) || targetW <= 0 || targetH <= 0) return;
    const win = getPetWindow();
    if (!win || win.isDestroyed()) return;

    if (resizeAnimId) { clearInterval(resizeAnimId); resizeAnimId = null; }

    try {
      const [curW, curH] = win.getSize();
      if (Math.abs(curW - targetW) < 4 && Math.abs(curH - targetH) < 4) {
        win.setSize(targetW, targetH);
        return;
      }
      const STEPS = 8, INTERVAL = 16;
      let step = 0;
      const startW = curW, startH = curH;
      resizeAnimId = setInterval(() => {
        step++;
        const t = step / STEPS;
        const ease = 1 - Math.pow(1 - t, 3);
        win.setSize(Math.round(startW + (targetW - startW) * ease),
                    Math.round(startH + (targetH - startH) * ease));
        if (step >= STEPS) {
          clearInterval(resizeAnimId); resizeAnimId = null;
          try { win.setSize(targetW, targetH); } catch (e) {}
        }
      }, INTERVAL);
    } catch (err) {
      console.error('[ipc] resize-window error:', err.message);
    }
  });

  // ── Pet size tracking (for tray menu) ─────────────────
  ipcMain.on('set-pet-size', (_e, size) => {
    const s = Number(size);
    if (isNaN(s) || s <= 0) return;
    setLastKnownPetSize(s);
    refreshTrayMenu(getPetWindow());
  });

  // ── Right-click context menu ──────────────────────────
  ipcMain.on('show-context-menu', (event, currentSize, appVersion) => {
    const makeSizeItem = (label, size) => ({
      label, type: 'radio',
      checked: currentSize === size,
      click: () => {
        setLastKnownPetSize(size);
        event.sender.send('size-changed', size);
      },
    });

    const passthroughOn = isPassthrough();

    const menu = Menu.buildFromTemplate([
      { label: '拟态 v' + (appVersion || '2.0'), enabled: false },
      { type: 'separator' },
      makeSizeItem('大 (Large)',  110),
      makeSizeItem('中 (Medium)', 80),
      makeSizeItem('小 (Small)',  50),
      { type: 'separator' },
      { label: '🔮 召唤到这里', click: () => {
        createSummonOverlay();
      }},
      { label: '🚶 开始闲逛', click: () => {
        event.sender.send('toggle-wander');
      }},
      { type: 'separator' },
      { label: '穿透模式 (Click-through)', type: 'checkbox',
        checked: passthroughOn,
        click: () => {
          setPassthrough(!passthroughOn);
          refreshTrayMenu(getPetWindow());
        }},
      { label: '退出', click: () => { quitApp(); }},
    ]);
    menu.popup({ window: getPetWindow() });
  });

  // ── Config request (sync) ─────────────────────────────
  ipcMain.on('get-config', (event) => {
    event.returnValue = getConfig();
  });

  // ── Save window position ──────────────────────────────
  ipcMain.on('save-position', () => {
    const win = getPetWindow();
    if (!win || win.isDestroyed()) return;
    const [x, y] = win.getPosition();
    savePosition(x, y);
  });

  // ── Summon mode ───────────────────────────────────────
  ipcMain.on('start-summon', () => { createSummonOverlay(); });

  ipcMain.on('summon-target', (_e, screenX, screenY) => {
    const nx = Number(screenX), ny = Number(screenY);
    if (isNaN(nx) || isNaN(ny)) return;
    destroySummonOverlay();
    const win = getPetWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('summon-target', nx, ny);
    }
  });

  ipcMain.on('summon-cancel', () => {
    destroySummonOverlay();
    const win = getPetWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('summon-cancelled');
    }
  });

  // ── Quit ──────────────────────────────────────────────
  ipcMain.on('quit-app', () => { quitApp(); });

  // ── Toggle passthrough ────────────────────────────────
  ipcMain.on('toggle-passthrough', () => {
    setPassthrough(!isPassthrough());
    refreshTrayMenu(getPetWindow());
  });

  console.log('[ipc] v2.0 handlers registered (walk + summon + wander)');
}

module.exports = { registerIpcHandlers };
