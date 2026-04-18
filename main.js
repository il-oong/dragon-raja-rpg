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
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile('index.html');

  // 작업표시줄 타이틀 위장
  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });
  win.setTitle('System Monitor - CPU/Memory');
}

app.whenReady().then(async () => {
  const splash = createSplash();
  await runStartupUpdateCheck(splash);
  if (splash && !splash.isDestroyed()) splash.destroy();

  createWindow();

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
  const splash = new BrowserWindow({
    width: 340, height: 160,
    frame: false, resizable: false, skipTaskbar: true,
    alwaysOnTop: false, show: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splash.setMenu(null);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#1e1e1e;color:#ddd;font-family:Segoe UI,sans-serif;
      display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;}
    .title{font-size:15px;font-weight:600;margin-bottom:8px;}
    .sub{color:#888;font-size:11px;}
    .bar{width:260px;height:4px;background:#333;margin-top:14px;border-radius:2px;overflow:hidden;}
    .fill{height:100%;width:0;background:#4a9eff;transition:width .2s;}
    .dots::after{content:'';animation:d 1.2s steps(4,end) infinite;}
    @keyframes d{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}
  </style></head><body>
    <div class="title">System Monitor</div>
    <div class="sub" id="s"><span class="dots">초기화 중</span></div>
    <div class="bar"><div class="fill" id="f"></div></div>
  </body></html>`;
  splash.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(html));
  return splash;
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

// 시작 시 블로킹 업데이트 체크. 결과와 무관하게 일정 시간 후엔 진행.
async function runStartupUpdateCheck(splash) {
  if (!autoUpdater || !app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

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
      splashSay(splash, `업데이트 내려받는 중 ${info.version}`, 0);

      const dlTimer = setTimeout(done, DOWNLOAD_TIMEOUT_MS);
      autoUpdater.on('download-progress', (p) => {
        splashSay(splash, `업데이트 내려받는 중 ${Math.round(p.percent)}%`, p.percent);
      });
      autoUpdater.once('update-downloaded', () => {
        clearTimeout(dlTimer);
        splashSay(splash, '업데이트 적용 중, 잠시 후 재시작됩니다', 100);
        // 약간의 지연 후 재시작 (스플래시 문구 보이게)
        setTimeout(() => autoUpdater.quitAndInstall(true, true), 600);
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
