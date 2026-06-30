// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Window Manager
//
//  Pet window: small transparent overlay that MOVES across
//  the desktop as the character walks. This is the core
//  paradigm shift from v1: the window is no longer static.
//
//  Summon overlay: temporary fullscreen transparent window
//  that captures a single click for "come here" summoning.
// ═══════════════════════════════════════════════════════════

const { BrowserWindow, screen } = require('electron');
const path = require('path');
const { loadPosition, savePosition } = require('./position-store');

let petWindow = null;
let summonWindow = null;
let forceQuit = false;
let passthroughEnabled = false;

// ── Pet Window ─────────────────────────────────────────────

function createPetWindow() {
  petWindow = new BrowserWindow({
    width: 120,
    height: 120,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  petWindow.setMenu(null);
  petWindow.setAlwaysOnTop(true, 'screen-saver');

  // Restore saved position
  const saved = loadPosition();
  if (saved) {
    petWindow.setPosition(saved.x, saved.y);
    console.log('[window] restored position:', saved);
  } else {
    // Default: bottom-right corner
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;
    petWindow.setPosition(width - 150, height - 150);
  }

  petWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Save position on close; hide to tray instead of quitting
  petWindow.on('close', (e) => {
    if (petWindow && !petWindow.isDestroyed()) {
      const [x, y] = petWindow.getPosition();
      savePosition(x, y);
    }
    if (forceQuit) {
      petWindow = null;
      return;
    }
    e.preventDefault();
    petWindow.hide();
  });

  // Always-on-top watchdog: reassert every 2s
  const topWatchdog = setInterval(() => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.setAlwaysOnTop(true, 'screen-saver');
    } else {
      clearInterval(topWatchdog);
    }
  }, 2000);

  console.log('[window] pet window created');
  return petWindow;
}

function getPetWindow() {
  return petWindow;
}

// ── Window Movement (for character walking) ─────────────────

/**
 * Move the pet window to an absolute screen position.
 * The position is the TOP-LEFT of the window.
 * Called every frame during character movement.
 */
function moveWindowTo(screenX, screenY) {
  if (!petWindow || petWindow.isDestroyed()) return;
  const x = Math.round(screenX);
  const y = Math.round(screenY);
  if (isNaN(x) || isNaN(y)) return;

  // Clamp to screen bounds
  const display = screen.getDisplayNearestPoint({ x, y });
  const { x: sx, y: sy, width: sw, height: sh } = display.workArea;
  const [ww, wh] = petWindow.getSize();
  const cx = Math.max(sx, Math.min(sx + sw - ww, x));
  const cy = Math.max(sy, Math.min(sy + sh - wh, y));

  petWindow.setPosition(cx, cy);
}

/**
 * Get current window position (top-left) in screen coordinates.
 */
function getWindowScreenPos() {
  if (!petWindow || petWindow.isDestroyed()) return { x: 0, y: 0 };
  const [x, y] = petWindow.getPosition();
  return { x, y };
}

/**
 * Get window center in screen coordinates.
 */
function getWindowCenter() {
  if (!petWindow || petWindow.isDestroyed()) return { x: 0, y: 0 };
  const [x, y] = petWindow.getPosition();
  const [w, h] = petWindow.getSize();
  return { x: x + w / 2, y: y + h / 2 };
}

// ── Summon Overlay (click-to-summon) ────────────────────────

let summonCallback = null;

function createSummonOverlay() {
  if (summonWindow && !summonWindow.isDestroyed()) {
    summonWindow.close();
  }

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.bounds;

  summonWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  summonWindow.setMenu(null);
  summonWindow.setAlwaysOnTop(true, 'screen-saver');
  // Capture mouse events — this is the click-target window
  summonWindow.setIgnoreMouseEvents(false);

  summonWindow.loadURL(`data:text/html;charset=utf-8,
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body {
        width: 100vw; height: 100vh;
        background: transparent;
        cursor: crosshair;
        overflow: hidden;
      }
      .hint {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        color: rgba(255,255,255,0.6);
        font-family: "Microsoft YaHei", sans-serif;
        font-size: 18px;
        pointer-events: none;
        text-shadow: 0 0 10px rgba(0,0,0,0.5);
      }
    </style>
    </head>
    <body>
      <div class="hint">👆 点击你想让我去的地方</div>
      <script>
        const { ipcRenderer } = require('electron');
        document.addEventListener('click', (e) => {
          ipcRenderer.send('summon-target', Math.round(e.screenX), Math.round(e.screenY));
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') ipcRenderer.send('summon-cancel');
        });
        document.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          ipcRenderer.send('summon-cancel');
        });
      </script>
    </body>
    </html>
  `.trim());

  summonWindow.on('closed', () => {
    summonWindow = null;
  });

  console.log('[window] summon overlay created');
}

function destroySummonOverlay() {
  if (summonWindow && !summonWindow.isDestroyed()) {
    summonWindow.close();
    summonWindow = null;
  }
  console.log('[window] summon overlay destroyed');
}

// ── Passthrough (click-through) control ─────────────────────

function setPassthrough(enabled) {
  if (!petWindow || petWindow.isDestroyed()) return;
  passthroughEnabled = !!enabled;
  petWindow.setIgnoreMouseEvents(passthroughEnabled, { forward: true });
  console.log('[window] passthrough:', passthroughEnabled ? 'ON' : 'OFF');
}

function isPassthrough() {
  return passthroughEnabled;
}

// ── Quit ────────────────────────────────────────────────────

function quitApp() {
  forceQuit = true;
  destroySummonOverlay();
  if (petWindow && !petWindow.isDestroyed()) {
    const [x, y] = petWindow.getPosition();
    savePosition(x, y);
    petWindow.close();
  }
  require('electron').app.exit(0);
}

module.exports = {
  createPetWindow,
  getPetWindow,
  moveWindowTo,
  getWindowScreenPos,
  getWindowCenter,
  createSummonOverlay,
  destroySummonOverlay,
  setPassthrough,
  isPassthrough,
  quitApp,
};
