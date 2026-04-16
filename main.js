const { app, BrowserWindow, globalShortcut, ipcMain, Menu } = require('electron');
const path = require('path');

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

app.whenReady().then(() => {
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
