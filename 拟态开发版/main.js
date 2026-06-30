// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — Desktop Pet 主进程入口
//
//  Paradigm shift: the pet window MOVES across the desktop
//  as the character walks. No longer a static overlay.
//
//  Features:
//   - Desktop roaming (autonomous wandering)
//   - Summon mode (click anywhere → pet walks there)
//   - Step-by-step movement (no teleporting)
//   - Always-on-top transparent overlay
// ═══════════════════════════════════════════════════════════

const { app, globalShortcut } = require('electron');
const { loadConfig, getConfig } = require('./main/config');
const {
  createPetWindow, getPetWindow,
  setPassthrough, isPassthrough,
} = require('./main/window');
const { createTray, refreshTrayMenu } = require('./main/tray');
const { registerIpcHandlers } = require('./main/ipc-handlers');
const { startDetector, stopDetector } = require('./main/music-detector');

app.whenReady().then(() => {
  // 1. Load configuration
  const config = loadConfig();

  // 2. Create the pet window (small, movable, transparent)
  const win = createPetWindow();

  // 3. Set up system tray
  createTray(win);

  // 4. Register all IPC handlers (v2.0: walk, summon, wander)
  registerIpcHandlers();

  // 5. Apply passthrough from config
  if (config.passthrough) {
    setPassthrough(true);
    refreshTrayMenu(win);
  }

  // 6. Global shortcut: Ctrl+Shift+P toggles passthrough
  globalShortcut.register('CmdOrCtrl+Shift+P', () => {
    const next = !isPassthrough();
    setPassthrough(next);
    refreshTrayMenu(getPetWindow());
    console.log('[main] passthrough →', next ? 'ON' : 'OFF');
  });

  // 7. Start music player detector
  startDetector(win);

  console.log('[main] 拟态 v2.0 Desktop Pet ready — desktop is the territory');
});

app.on('window-all-closed', () => {
  // Don't quit — close is intercepted, window hides to tray
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  stopDetector();
});
