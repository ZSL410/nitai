// ═══════════════════════════════════════════════════════════
//  Nitai v2.0 — File Drop Handler
//
//  Drag-and-drop files from Windows Explorer onto pet window
//  → copy to target directory → visual + bubble feedback.
// ═══════════════════════════════════════════════════════════

;(function () {
  const M = window.Mimic;

  let enterCount = 0;

  function copyRecursive(srcPath, destDir) {
    const name = M.path.basename(srcPath);
    const dest = M.path.join(destDir, name);
    let st;
    try { st = M.fs.statSync(srcPath); }
    catch (err) { console.error('[copy] stat error:', srcPath, err.message); return 0; }

    if (st.isFile()) {
      M.fs.mkdirSync(M.path.dirname(dest), { recursive: true });
      M.fs.copyFileSync(srcPath, dest);
      return 1;
    }
    if (st.isDirectory()) {
      M.fs.mkdirSync(dest, { recursive: true });
      let count = 0, entries;
      try { entries = M.fs.readdirSync(srcPath, { withFileTypes: true }); }
      catch (err) { return 0; }
      for (const entry of entries) {
        count += copyRecursive(M.path.join(srcPath, entry.name), dest);
      }
      return count;
    }
    return 0;
  }

  function notifyBackend(fileCount, filePaths) {
    if (!M.config.apiEnabled) return;
    const payload = JSON.stringify({
      count: fileCount, paths: filePaths,
      timestamp: new Date().toISOString(),
    });
    let url;
    try { url = new URL(M.config.backendUrl + '/api/file/process'); }
    catch (err) { return; }

    const options = {
      hostname: url.hostname, port: url.port, path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 3000,
    };
    const req = M.http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => { console.log('[api] response', res.statusCode, body); });
    });
    req.on('error', (err) => { console.log('[api] unreachable:', err.message); });
    req.write(payload);
    req.end();
  }

  function getFilePaths(fileList) {
    const paths = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      let p = '';
      try { p = M.webUtils.getPathForFile(file); } catch (e) {}
      if (!p && file.path) p = file.path;
      if (p) paths.push(p);
    }
    return paths;
  }

  function handleDrop(e) {
    enterCount = 0;
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) {
      M.FSM.transitionTo('surprised');
      if (M.Bubble) M.Bubble.show('(・_・?) 未放入任何文件', { duration: 2000 });
      return;
    }
    const paths = getFilePaths(files);
    if (paths.length === 0) {
      M.FSM.transitionTo('surprised');
      if (M.Bubble) M.Bubble.show('(>_<) 无法读取文件路径', { duration: 2000 });
      return;
    }

    M.FSM.transitionTo('working');
    if (M.Bubble) M.Bubble.show('(*´▽`*) 正在复制…', { duration: 0 });

    setTimeout(() => {
      try {
        M.fs.mkdirSync(M.TARGET, { recursive: true });
        let total = 0;
        for (const p of paths) total += copyRecursive(p, M.TARGET);

        M.FSM.transitionTo('happy');
        if (M.Bubble) M.Bubble.show("(●'◡'●) 已复制 " + total + ' 个文件', { duration: 3000 });
        notifyBackend(total, paths);
      } catch (err) {
        M.FSM.transitionTo('surprised');
        if (M.Bubble) M.Bubble.show('(╥﹏╥) 错误', { duration: 3000 });
        console.error('[drop] ERROR:', err.message);
      }
    }, 60);
  }

  function registerDropTarget(el) {
    el.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    el.addEventListener('dragenter', (e) => {
      e.preventDefault(); e.stopPropagation();
      enterCount++;
    });
    el.addEventListener('dragleave', (e) => {
      e.preventDefault(); e.stopPropagation();
      enterCount--;
      if (enterCount <= 0) enterCount = 0;
    });
    el.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation();
      handleDrop(e);
    });
  }

  function setupDrop() {
    registerDropTarget(document);
    const canvas = M.canvas;
    if (canvas) registerDropTarget(canvas);
    console.log('[drop] v2.0 — file drop handler | target:', M.TARGET);
  }

  // Register 'working' state in FSM if not already there
  if (M.FSM && !M.FSM._handlers.working) {
    M.FSM._handlers.working = {
      expression: 'neutral',
      enter() {
        M.Anim.mouthOpen = 0.6;
        M.Anim.bobOffset = -2;
      },
      update(now) {
        // Bob while working
        const t = (now || performance.now()) / 1000;
        M.Anim.bobOffset = Math.sin(t * 6) * 3 - 1;
      },
      exit() {
        M.Anim.mouthOpen = 0;
        M.Anim.bobOffset = 0;
      },
    };
  }

  M.Interaction = M.Interaction || {};
  M.Interaction.setupDrop = setupDrop;
})();
