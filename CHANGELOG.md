# 릴리즈 보드

## v1.0.5 (2026-04-18)

### 수정
- **바탕화면 바로가기가 생성되지 않던 문제 해결**
  - `package.json > build.nsis`에 `createDesktopShortcut: "always"` 추가 → 신규 설치뿐 아니라 업데이트/재설치 시에도 **매번 바탕화면 바로가기를 강제 생성**.
  - `createStartMenuShortcut: true`, `shortcutName: "System Monitor"` 명시 → 시작 메뉴에도 동일 이름으로 등록.
  - `runAfterFinish: true` → 설치 완료 후 자동 실행.

### 설치 위치 안내
- `oneClick: true` + `perMachine: false` 구성이므로 **사용자 계정 기준**으로 조용히 설치됨.
- **설치 경로**: `%LOCALAPPDATA%\Programs\system-monitor\System Monitor.exe`
  - 예) `C:\Users\<사용자>\AppData\Local\Programs\system-monitor\System Monitor.exe`
- **바로가기**
  - 바탕화면: `%USERPROFILE%\Desktop\System Monitor.lnk`
  - 시작 메뉴: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\System Monitor.lnk`
- **설치 파일(`SystemMonitor-Setup-*.exe`) 다운로드 위치**: 브라우저 기본 다운로드 폴더 (`%USERPROFILE%\Downloads`).

---

## v1.0.4 (2026-04-18)

### 수정
- **시작 시 스플래시만 깜빡이고 메인 창이 뜨지 않던 문제** (재발) 해결
  - `runStartupUpdateCheck`의 `update-downloaded` 핸들러가 Promise를 영영 resolve 하지 않아, `quitAndInstall`이 silently 실패하면 스플래시가 사라진 뒤 `createWindow()`에 도달하지 못하는 경로가 있었음. `done()`을 먼저 호출하고 `quitAndInstall`은 그 후 실행하도록 변경.
  - `app.whenReady` 전체 흐름에 30초 **하드 타임아웃** 추가 — 어떤 비정상 경로로도 메인 창은 강제로 표시.
  - 메인 `BrowserWindow`를 `show:false` + `ready-to-show`로 전환, `backgroundColor` 사전 지정, 4초 표시 안전망 추가 → 첫 페인트 깜빡임 제거 + 표시 보장.
  - `autoUpdater.autoDownload = false`로 변경하고 `update-available`에서 **같은/낮은 버전이면 다운로드 스킵** → 무한 업데이트 루프 차단.
  - `win` 참조를 `closed`에서 정리하고 재진입 시 `if (!win) createWindow()`로 가드.

---

## v1.0.3 (2026-04-18)

### 수정
- **설치 중 "System Monitor cannot be closed" 오류 해결** (#2)
  - `build/installer.nsh` NSIS include 스크립트 추가.
  - `customInit` / `customInstall` / `customCloseApplication` 매크로에서 `taskkill /F /T /IM "System Monitor.exe"` 실행 → 실행 중인 인스턴스를 강제 종료한 뒤 설치 진행.
  - 위장 모드 때문에 사용자가 수동으로 프로세스를 찾아 닫을 필요가 없어짐.
  - `package.json > build.nsis.include` 에 스크립트 연결.

---

## v1.0.2 (2026-04-18)

### 수정
- **실행 시 메인 창 미표시 문제 방어 강화** (33d7676)
  - `app.whenReady` async 체인 전체를 `try/catch/finally`로 감싸 `createSplash()` / `runStartupUpdateCheck()`가 throw해도 `createWindow()`는 반드시 호출.
  - `package.json` `build.asarUnpack`에 `electron-updater`, `builder-util-runtime`, `js-yaml` 추가해 native 모듈 로드 실패 차단.

### 알려진 이슈
- **설치 중 "System Monitor cannot be closed" 오류** → v1.0.3에서 해결.

---

## v1.0.1 (2026-04-18)

### 추가
- **GitHub Releases 기반 자동 업데이트** (1ef9185)
  - `electron-updater` 도입. NSIS 설치본이 앱 시작 시 메인 창 표시 전 새 버전을 조회·다운로드·자동 재시작.
  - 체크 8초 / 다운로드 120초 타임아웃 — 네트워크 불가 시에도 기존 버전으로 진행.
  - 스플래시 문구는 `System Monitor / 초기화 중` 톤으로 위장 유지, 업데이트 진행률(0~100%)만 표시.
  - 기존 portable 타겟 유지 + NSIS 타겟 추가 (자동 업데이트는 NSIS만 지원).
- **GitHub Actions 릴리즈 파이프라인** (`.github/workflows/release.yml`)
  - `v*` 태그 push 시 Windows 러너가 `electron-builder --publish always`로 Release 생성·에셋 업로드.

### 주의
- 기존 portable `.exe` 사용자는 updater가 없으므로 NSIS 설치본을 한 번 수동으로 받아야 함.
- v1.0.1 설치본은 실행 시 메인 창이 뜨지 않는 버그가 있음 → **v1.0.2로 업그레이드 필요**.

---

## v1.0.0 (2026-04-17)

### 첫 공식 릴리즈
- **77개 직업** (1~5차 + 히든 2)
- **49개 지역** (Lv 1~220)
- **20 보스** (드래곤 라자 최강자 포함)
- 전투 / 전직 시련 / 조합 스킬 16종
- 7개 수련장 + 누적 수련시간 기반 스킬 해금
- 도시 간 시세차익 무역 + 상인 스킬
- 위장 모드 (System Monitor)
- 멀티플레이: 닉네임 로그인 / 클라우드 세이브 / 리더보드 6종 / 우편함
- 단축키: `Ctrl+Shift+D` 전환 · `Ctrl+Shift+B` 숨김 · `Ctrl+Shift+Q` 종료 · `ESC` 위장
