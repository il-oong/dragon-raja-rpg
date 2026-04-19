const { app, BrowserWindow, globalShortcut, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fsSync = require('fs');

// electron-updater는 packaged 앱에서만 의미가 있음. dev 실행 시 로드 실패해도 무시.
let autoUpdater = null;
try { autoUpdater = require('electron-updater').autoUpdater; } catch {}

let win;
let isHidden = false;

// 시작 시퀀스 상태 — 스플래시 destroy 직후 "창이 하나도 없음" 순간에
// window-all-closed 가 튀어서 앱이 조용히 꺼지는 문제 방어용.
let mainWindowEverCreated = false;
let updateRestartScheduled = false;
let isQuitting = false;

// ─────────────────────── 시작 진단 로그 ───────────────────────
// 혼자 꺼지는 증상이 재발할 때 원인을 남기기 위한 파일 기반 로그.
// 경로: %APPDATA%\system-monitor\startup.log  (Windows 기준)
// 사용자가 "또 꺼졌어" 라고 하면 이 파일을 열어 마지막 기록을 확인.
let _logPath = null;
function _initLogPath() {
  try {
    if (_logPath) return _logPath;
    const dir = app.getPath('userData');
    try { fsSync.mkdirSync(dir, { recursive: true }); } catch {}
    _logPath = path.join(dir, 'startup.log');
    return _logPath;
  } catch { return null; }
}
function startupLog(tag, extra) {
  const line = `[${new Date().toISOString()}] ${tag}${extra ? ' ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : ''}\n`;
  try { console.log(line.trim()); } catch {}
  try {
    const p = _initLogPath();
    if (p) fsSync.appendFileSync(p, line, 'utf-8');
  } catch {}
}

// 환경변수로 업데이트 체크 건너뛰기 — 빠른 테스트용.
//   Windows:  set SYSMON_SKIP_UPDATE=1 && "System Monitor.exe"
const SKIP_UPDATE = !!process.env.SYSMON_SKIP_UPDATE;
// 업데이터 캐시 리셋 — 유령 다운로드 상태 제거용.
const RESET_UPDATER = !!process.env.SYSMON_RESET_UPDATER;
// GPU 비활성화 — 오래된 드라이버/원격 데스크탑에서 BrowserWindow 가 조용히 실패하는 경우.
if (process.env.SYSMON_DISABLE_GPU) {
  try { app.disableHardwareAcceleration(); startupLog('gpu:disabled-by-env'); } catch {}
}

// 업데이터 캐시 디렉토리 정리 (있으면).
if (RESET_UPDATER) {
  try {
    const cacheDir = path.join(app.getPath('userData'), '..', 'system-monitor-updater');
    fsSync.rmSync(cacheDir, { recursive: true, force: true });
    startupLog('updater-cache:reset', cacheDir);
  } catch (e) { startupLog('updater-cache:reset-error', e && e.message); }
}

// ─────────────────────── 전역 에러 핸들러 ───────────────────────
// 메인 프로세스의 throw 를 조용히 죽이지 않고 로그 + 사용자 에러 다이얼로그로 가시화.
process.on('uncaughtException', (err) => {
  startupLog('uncaughtException', err && (err.stack || err.message || String(err)));
  try { dialog.showErrorBox('System Monitor', '예기치 못한 오류로 종료됩니다.\n\n' + (err && err.message || err)); } catch {}
});
process.on('unhandledRejection', (reason) => {
  startupLog('unhandledRejection', reason && (reason.stack || reason.message || String(reason)));
});

function createWindow() {
  startupLog('createWindow:begin');
  try {
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
  } catch (e) {
    // BrowserWindow 생성 실패 — GPU/sandbox/드라이버 이슈 가능.
    // 하드웨어 가속 끄고 한번만 재시도.
    startupLog('createWindow:constructor-error', e && (e.stack || e.message));
    try {
      app.disableHardwareAcceleration();
      startupLog('createWindow:retry-without-gpu');
      win = new BrowserWindow({
        width: 1100, height: 720, title: 'System Monitor',
        autoHideMenuBar: true, show: false, backgroundColor: '#1e1e1e',
        webPreferences: { nodeIntegration: true, contextIsolation: false },
      });
    } catch (e2) {
      startupLog('createWindow:retry-failed', e2 && (e2.stack || e2.message));
      try {
        dialog.showErrorBox('System Monitor',
          '창을 생성하지 못했습니다.\n\n' + (e2 && e2.message || e2) +
          '\n\n로그: ' + (_logPath || '(none)'));
      } catch {}
      app.exit(1);
      return;
    }
  }

  // ★ flag 는 BrowserWindow 생성 성공 이후에만 세팅.
  // 실패 시 window-all-closed 가드가 빠지지 않게.
  mainWindowEverCreated = true;

  Menu.setApplicationMenu(null);
  const indexPath = path.join(__dirname, 'index.html');
  startupLog('loadFile:start', indexPath);
  win.loadFile('index.html').catch(e => {
    console.error('[loadFile]', e && e.message);
    startupLog('loadFile:error', e && e.message);
  });

  // ready-to-show가 어떤 이유로든 안 오면 안전망으로 강제 표시.
  const showFallback = setTimeout(() => {
    try {
      if (win && !win.isDestroyed() && !win.isVisible()) {
        startupLog('ready-to-show:fallback-show');
        win.show(); win.focus();
      }
    } catch {}
  }, 4000);

  win.once('ready-to-show', () => {
    clearTimeout(showFallback);
    startupLog('ready-to-show');
    try { win.show(); win.focus(); } catch (e) { console.error('[win.show]', e && e.message); }
  });

  win.webContents.on('render-process-gone', (_e, details) => {
    startupLog('render-process-gone', details);
  });
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    startupLog('did-fail-load', { code, desc, url });
  });

  win.on('closed', () => { startupLog('main-window:closed'); win = null; });

  // 작업표시줄 타이틀 위장
  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });
  win.setTitle('System Monitor - CPU/Memory');
}

app.whenReady().then(async () => {
  startupLog('whenReady', { version: app.getVersion(), packaged: app.isPackaged, skipUpdate: SKIP_UPDATE });

  // 스플래시/업데이트 체크는 실패해도 메인 창은 반드시 띄운다.
  // 어떤 경로로도 STARTUP_HARD_TIMEOUT_MS 안에는 createWindow()까지 도달.
  let splash = null;
  const STARTUP_HARD_TIMEOUT_MS = 30000;
  const hardTimer = setTimeout(() => {
    startupLog('hard-timeout');
    try { if (!win) createWindow(); } catch (e) {
      startupLog('createWindow:hard:error', e && (e.stack || e.message || e));
    }
    try { if (splash && !splash.isDestroyed()) splash.destroy(); } catch {}
  }, STARTUP_HARD_TIMEOUT_MS);

  try {
    splash = createSplash();
    startupLog('splash:created');
    if (SKIP_UPDATE) {
      startupLog('update-check:skipped-by-env');
    } else {
      await runStartupUpdateCheck(splash);
    }
  } catch (e) {
    startupLog('startup:error', e && (e.stack || e.message || e));
  } finally {
    clearTimeout(hardTimer);
  }

  // v1.0.7: 시작 시 자동 설치(quitAndInstall) 폐기.
  // 업데이트가 다운로드되었더라도 앱은 항상 메인 창으로 진입한다.
  // 설치는 사용자가 앱을 정상 종료할 때 autoInstallOnAppQuit 로 진행 (runStartupUpdateCheck 참조).
  //
  // 스플래시를 destroy 하기 전에 메인 창을 먼저 만든다.
  // "창이 하나도 없는 순간" 이 없어야 window-all-closed → app.quit() 경로가 차단됨.
  try {
    if (!win) createWindow();
  } catch (e) {
    startupLog('createWindow:error', e && (e.stack || e.message || e));
  }

  try {
    if (splash && !splash.isDestroyed()) {
      splash.destroy();
      startupLog('splash:destroyed');
    }
  } catch {}

  if (updateRestartScheduled) {
    startupLog('update:will-install-on-quit');
    // 사용자에게 알림 — 메인 창 로드 후 IPC 로 표시 (선택적).
    try { win && win.webContents.once('did-finish-load', () => {
      try { win.webContents.send('update-pending-restart'); } catch {}
    }); } catch {}
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

  // 위장 테마 순환: Ctrl+Shift+T (sysmon → excel → terminal → kakao)
  globalShortcut.register('Control+Shift+T', () => {
    if (!win || win.isDestroyed()) return;
    try { win.webContents.send('cycle-disguise-theme'); } catch {}
  });

  // ─── 자동 업데이트 주기 재체크 (1시간마다) ───
  // 시작 시 1회만 체크하면 오랫동안 켜놓은 세션은 새 릴리즈를 놓침.
  // autoUpdater 는 이미 once 리스너로 시작 흐름에 묶여있어 여기선 checkForUpdates 호출만.
  if (autoUpdater && app.isPackaged && !SKIP_UPDATE) {
    setInterval(() => {
      try { autoUpdater.checkForUpdates().catch(e => startupLog('periodic-check-err', e && e.message)); }
      catch (e) { startupLog('periodic-check-throw', e && e.message); }
    }, 60 * 60 * 1000);
    // 재체크 후 update-downloaded 가 다시 오면 알림을 위해 영구 리스너도 등록.
    try {
      autoUpdater.on('update-downloaded', () => {
        updateRestartScheduled = true;
        try { if (win && !win.isDestroyed()) win.webContents.send('update-pending-restart'); } catch {}
      });
    } catch {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') return;
  // 시작 시퀀스 도중 스플래시가 destroy 되면서 이벤트가 튀는 경우가 있다.
  // 아직 메인 창이 한번도 만들어지지 않았다면 조용히 무시 — 뒤이어 createWindow 가 실행된다.
  if (!mainWindowEverCreated) {
    startupLog('window-all-closed:ignored (startup)');
    return;
  }
  startupLog('window-all-closed:quitting');
  app.quit();
});

app.on('before-quit', () => { isQuitting = true; startupLog('before-quit'); });

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
// v1.0.7: quitAndInstall 폐기 — 다운로드만 하고 설치는 사용자가 정상 종료할 때 자동.
async function runStartupUpdateCheck(splash) {
  if (!autoUpdater || !app.isPackaged) return;
  try {
    autoUpdater.autoDownload = false;           // update-available 에서 버전 판단 후 수동 다운로드
    autoUpdater.autoInstallOnAppQuit = true;    // 정상 종료 시 자동 설치 (시작 시엔 설치 안 함)
  } catch (e) { console.error('[updater config]', e && e.message); return; }

  const CHECK_TIMEOUT_MS = 8000;
  const DOWNLOAD_TIMEOUT_MS = 120000;

  return new Promise((resolve) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(); } };

    // 체크 단계 타임아웃 (네트워크 불가 시 앱이 멈추지 않도록)
    const checkTimer = setTimeout(done, CHECK_TIMEOUT_MS);

    autoUpdater.once('update-not-available', () => {
      startupLog('update:not-available');
      clearTimeout(checkTimer); done();
    });
    autoUpdater.once('error', (err) => {
      startupLog('update:error', err && err.message);
      clearTimeout(checkTimer); done();
    });
    autoUpdater.once('update-available', (info) => {
      clearTimeout(checkTimer);

      // 같은/낮은 버전이 잡히면 다운로드/재시작 루프 방지를 위해 즉시 통과.
      const cur = app.getVersion();
      const remote = info && info.version;
      startupLog('update:available', { remote, current: cur });
      if (!remote || compareVer(remote, cur) <= 0) {
        startupLog('update:skip-same-or-older');
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
        startupLog('update:downloaded');
        // v1.0.7: quitAndInstall 을 시작 시에 호출하지 않는다.
        // 설치는 autoInstallOnAppQuit=true 로 사용자가 앱을 정상 종료할 때 자동 진행.
        // 그 동안 메인 창은 정상적으로 표시되어 앱이 "혼자 꺼지는" 경로가 차단된다.
        splashSay(splash, '업데이트 준비됨 — 다음 종료 시 적용', 100);
        updateRestartScheduled = true;
        done();
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

// 지금 바로 업데이트 적용 — 다운로드된 상태에서만 성공. 앱 즉시 재시작.
ipcMain.handle('install-update-now', () => {
  if (!autoUpdater || !app.isPackaged) return { ok: false, error: 'dev mode' };
  if (!updateRestartScheduled) return { ok: false, error: '다운로드된 업데이트가 없음' };
  try {
    startupLog('install-update-now');
    autoUpdater.quitAndInstall(true, true);
    return { ok: true };
  } catch (e) {
    startupLog('install-update-now:error', e && e.message);
    return { ok: false, error: e.message };
  }
});

// 현재 버전 + 업데이트 준비 상태 + CHANGELOG 내용 반환 — 마이페이지 "버전 정보" 탭용.
ipcMain.handle('get-app-info', async () => {
  let changelog = '';
  try {
    const clPath = path.join(__dirname, 'CHANGELOG.md');
    if (require('fs').existsSync(clPath)) {
      changelog = require('fs').readFileSync(clPath, 'utf-8');
    }
  } catch (e) { /* 패키지에서 제외됐거나 읽기 실패 */ }
  return {
    ok: true,
    version: app.getVersion(),
    packaged: app.isPackaged,
    updatePending: updateRestartScheduled,
    changelog,
  };
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
