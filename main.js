const { app, BrowserWindow, globalShortcut, ipcMain, Menu, dialog } = require('electron');
const path = require('path');

// electron-updater는 packaged 앱에서만 의미가 있음. dev 실행 시 로드 실패해도 무시.
let autoUpdater = null;
try { autoUpdater = require('electron-updater').autoUpdater; } catch {}

let win;
let isHidden = false;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 720,
    title: 'System Monitor',
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    show: false, // ready-to-show 시점에 띄워 첫 페인트 깜빡임 제거
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile('index.html').catch(e => console.error('[loadFile]', e && e.message));

  // ready-to-show가 어떤 이유로든 안 오면 안전망으로 강제 표시.
  const showFallback = setTimeout(() => {
    try { if (win && !win.isDestroyed() && !win.isVisible()) { win.show(); win.focus(); } } catch {}
  }, 4000);

  win.once('ready-to-show', () => {
    clearTimeout(showFallback);
    try { win.show(); win.focus(); } catch (e) { console.error('[win.show]', e && e.message); }
  });

  win.on('closed', () => { win = null; });

  // 작업표시줄 타이틀 위장
  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });
  win.setTitle('System Monitor - CPU/Memory');
}

app.whenReady().then(async () => {
  // 스플래시/업데이트 체크는 실패해도 메인 창은 반드시 띄운다.
  // 어떤 경로로도 STARTUP_HARD_TIMEOUT_MS 안에는 createWindow()까지 도달.
  let splash = null;
  const STARTUP_HARD_TIMEOUT_MS = 30000;
  const hardTimer = setTimeout(() => {
    console.error('[startup] hard timeout — forcing main window');
    try { if (splash && !splash.isDestroyed()) splash.destroy(); } catch {}
    try { if (!win) createWindow(); } catch (e) {
      console.error('[createWindow:hard]', e && (e.stack || e.message || e));
    }
  }, STARTUP_HARD_TIMEOUT_MS);

  try {
    splash = createSplash();
    await runStartupUpdateCheck(splash);
  } catch (e) {
    console.error('[startup]', e && (e.stack || e.message || e));
  } finally {
    clearTimeout(hardTimer);
    try { if (splash && !splash.isDestroyed()) splash.destroy(); } catch {}
  }

  try {
    if (!win) createWindow();
  } catch (e) {
    console.error('[createWindow]', e && (e.stack || e.message || e));
  }

  // 보스키: Ctrl+Shift+B → 창 숨김/복원
  globalShortcut.register('Control+Shift+B', () => {
    if (!win) return;
    if (win.isVisible()) {
      win.hide();
      isHidden = true;
    } else {
      win.show();
      win.focus();
      isHidden = false;
    }
  });

  // 패닉키: Ctrl+Shift+Q → 즉시 종료
  globalShortcut.register('Control+Shift+Q', () => {
    app.quit();
  });

  // 위장모드 토글: Ctrl+Shift+D (게임화면 ↔ 가짜 시스템 모니터)
  globalShortcut.register('Control+Shift+D', () => {
    if (!win) return;
    win.webContents.send('toggle-disguise');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ══════════════ 스플래시 & Auto Update (GitHub Releases) ══════════════
// 위장 유지를 위해 스플래시 문구는 "System Monitor" 톤으로만 노출.

function createSplash() {
  try {
    const splash = new BrowserWindow({
      width: 340, height: 160,
      frame: false, resizable: false, skipTaskbar: true,
      alwaysOnTop: false, show: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    splash.setMenu(null);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#1e1e1e;color:#ddd;font-family:Segoe UI,sans-serif;
        display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;}
      .title{font-size:15px;font-weight:600;margin-bottom:8px;}
      .sub{color:#888;font-size:11px;}
      .bar{width:260px;height:4px;background:#333;margin-top:14px;border-radius:2px;overflow:hidden;}
      .fill{height:100%;width:0;background:#4a9eff;transition:width .2s;}
    </style></head><body>
      <div class="title">System Monitor</div>
      <div class="sub" id="s">초기화 중...</div>
      <div class="bar"><div class="fill" id="f"></div></div>
    </body></html>`;
    splash.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(html))
      .catch(e => console.error('[splash.loadURL]', e && e.message));
    return splash;
  } catch (e) {
    console.error('[createSplash]', e && (e.stack || e.message));
    return null;
  }
}

function splashSay(splash, msg, percent) {
  if (!splash || splash.isDestroyed()) return;
  const js = `
    (() => {
      const s = document.getElementById('s');
      if (s && ${JSON.stringify(msg)} !== null) s.textContent = ${JSON.stringify(msg)};
      const f = document.getElementById('f');
      if (f && ${typeof percent === 'number'}) f.style.width = ${percent || 0}+'%';
    })();
  `;
  splash.webContents.executeJavaScript(js).catch(() => {});
}

// semver-ish 비교: a > b 이면 1, a < b -1, 같으면 0. 파싱 실패 시 0.
function compareVer(a, b) {
  try {
    const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
    const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const x = pa[i] || 0, y = pb[i] || 0;
      if (x > y) return 1;
      if (x < y) return -1;
    }
    return 0;
  } catch { return 0; }
}

// 시작 시 블로킹 업데이트 체크. 결과와 무관하게 일정 시간 후엔 반드시 resolve.
async function runStartupUpdateCheck(splash) {
  if (!autoUpdater || !app.isPackaged) return;
  try {
    autoUpdater.autoDownload = false; // update-available에서 직접 판단 후 다운로드
    autoUpdater.autoInstallOnAppQuit = false;
  } catch (e) { console.error('[updater config]', e && e.message); return; }

  const CHECK_TIMEOUT_MS = 8000;
  const DOWNLOAD_TIMEOUT_MS = 120000;

  return new Promise((resolve) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(); } };

    // 체크 단계 타임아웃 (네트워크 불가 시 앱이 멈추지 않도록)
    const checkTimer = setTimeout(done, CHECK_TIMEOUT_MS);

    autoUpdater.once('update-not-available', () => {
      clearTimeout(checkTimer); done();
    });
    autoUpdater.once('error', (err) => {
      console.log('[auto-update]', err && err.message);
      clearTimeout(checkTimer); done();
    });
    autoUpdater.once('update-available', (info) => {
      clearTimeout(checkTimer);

      // 같은/낮은 버전이 잡히면 다운로드/재시작 루프 방지를 위해 즉시 통과.
      const cur = app.getVersion();
      const remote = info && info.version;
      if (!remote || compareVer(remote, cur) <= 0) {
        console.log('[auto-update] skip — remote', remote, '<= current', cur);
        done();
        return;
      }

      splashSay(splash, `업데이트 내려받는 중 ${remote}`, 0);

      const dlTimer = setTimeout(done, DOWNLOAD_TIMEOUT_MS);
      autoUpdater.on('download-progress', (p) => {
        splashSay(splash, `업데이트 내려받는 중 ${Math.round(p.percent)}%`, p.percent);
      });
      autoUpdater.once('update-downloaded', () => {
        clearTimeout(dlTimer);
        splashSay(splash, '업데이트 적용 중, 잠시 후 재시작됩니다', 100);
        // quitAndInstall이 silently 실패해도 메인창이 뜨도록 done()을 먼저 호출.
        done();
        setTimeout(() => {
          try { autoUpdater.quitAndInstall(true, true); }
          catch (e) { console.error('[quitAndInstall]', e && e.message); }
        }, 600);
      });

      autoUpdater.downloadUpdate().catch((e) => {
        console.log('[auto-update download]', e && e.message);
        clearTimeout(dlTimer); done();
      });
    });

    autoUpdater.checkForUpdates().catch((e) => {
      console.log('[auto-update]', e && e.message);
      clearTimeout(checkTimer); done();
    });
  });
}

// 수동 체크 (UI에서 버튼으로 호출 가능)
ipcMain.handle('check-for-updates', async () => {
  if (!autoUpdater || !app.isPackaged) return { ok: false, error: 'dev mode' };
  try {
    const r = await autoUpdater.checkForUpdates();
    return { ok: true, version: r && r.updateInfo && r.updateInfo.version };
  } catch (e) { return { ok: false, error: e.message }; }
});

// 게임 저장/로드 — 다중 캐릭터 지원
const fs = require('fs');
const savePath  = path.join(app.getPath('userData'), 'save.json');    // 구버전 단일 슬롯
const savesPath = path.join(app.getPath('userData'), 'saves.json');   // 신버전 다중 슬롯

function readSaves() {
  try {
    if (!fs.existsSync(savesPath)) return [];
    return JSON.parse(fs.readFileSync(savesPath, 'utf-8'));
  } catch { return []; }
}
function writeSaves(arr) {
  try { fs.writeFileSync(savesPath, JSON.stringify(arr, null, 2), 'utf-8'); return true; }
  catch { return false; }
}

// 캐릭터 목록 — 시작 화면에서 선택
ipcMain.handle('list-saves', () => {
  let saves = readSaves();
  // 구버전 단일 save.json 마이그레이션 (최초 1회)
  if (saves.length === 0 && fs.existsSync(savePath)) {
    try {
      const old = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
      if (old && old.name) {
        old.id = 'char_' + Date.now();
        old.lastPlayed = Date.now();
        saves.push(old);
        writeSaves(saves);
        // 구버전 백업
        fs.renameSync(savePath, savePath + '.bak');
      }
    } catch {}
  }
  return saves;
});

// 특정 캐릭터 저장
ipcMain.handle('save-char', (e, { id, data }) => {
  try {
    const saves = readSaves();
    data.id = id;
    data.lastPlayed = Date.now();
    const idx = saves.findIndex(s => s.id === id);
    if (idx >= 0) saves[idx] = data;
    else saves.push(data);
    writeSaves(saves);
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
});

// 캐릭터 삭제
ipcMain.handle('delete-char', (e, id) => {
  try {
    const saves = readSaves().filter(s => s.id !== id);
    writeSaves(saves);
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
});

// 전체 세이브 Import (텍스트 붙여넣기)
// mode: 'replace' = 전체 교체 / 'merge' = 기존에 병합 (id 중복 시 덮어씀)
ipcMain.handle('import-saves', (e, { text, mode }) => {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return { ok: false, error: '배열 형식이 아닙니다.' };
    for (const s of parsed) {
      if (!s || typeof s !== 'object' || !s.name || !s.id) {
        return { ok: false, error: '올바른 캐릭터 데이터가 아닙니다.' };
      }
    }
    let merged;
    if (mode === 'merge') {
      const existing = readSaves();
      const map = new Map();
      existing.forEach(s => map.set(s.id, s));
      parsed.forEach(s => map.set(s.id, s));
      merged = Array.from(map.values());
    } else {
      merged = parsed;
    }
    writeSaves(merged);
    return { ok: true, count: merged.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// 하위 호환 (혹시 남은 호출)
ipcMain.handle('save-game', (e, data) => {
  try {
    fs.writeFileSync(savePath, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
});
ipcMain.handle('load-game', () => {
  try {
    if (!fs.existsSync(savePath)) return null;
    return JSON.parse(fs.readFileSync(savePath, 'utf-8'));
  } catch { return null; }
});
