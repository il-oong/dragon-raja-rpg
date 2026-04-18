# 릴리즈 보드

## v1.0.4 (2026-04-18)

### 수정
- **앱 실행 시 "깜빡 뜨고 사라지는" 진짜 원인 해결** ★
  - `main.js`: 스플래시를 먼저 닫고 메인 창을 만드는 순서 때문에 `splash.destroy()` 직후 `window-all-closed` 이벤트가 발생 → `app.quit()` 호출 → 그 뒤의 `createWindow()` 가 무력화되던 버그.
  - 메인 창을 먼저 생성한 뒤 스플래시 제거하도록 순서 교체 + `mainWindowCreated` 가드 추가.
  - `window-all-closed` 핸들러는 메인 창 생성 전에는 `app.quit()` 호출하지 않음.
- **바탕화면 바로가기 누락 해결**
  - `package.json > build.nsis` 에 `createDesktopShortcut: "always"`, `createStartMenuShortcut: true`, `shortcutName: "System Monitor"`, `runAfterFinish: true` 명시.
  - oneClick 설치본에서 바탕화면/시작 메뉴 바로가기가 누락되던 문제 해결.
- **설치 중 "System Monitor cannot be closed" 다이얼로그 재발 방지**
  - `build/installer.nsh`: `taskkill` 후 `Sleep 300/500ms` 가 너무 짧아 `tasklist` 갱신 전에 electron-builder 가 재확인하던 race 제거.
  - `Sleep 2000ms + 두 번째 패스` 로 보강. 자식·업데이터 spawn 프로세스까지 정리.
- **업데이트 다운로드 후 메인 창 미표시 hang 해결**
  - `main.js runStartupUpdateCheck`: `update-downloaded` 핸들러가 `done()`을 호출하지 않아 `quitAndInstall` 실패/지연 시 Promise가 영영 resolve되지 않던 버그 제거.
  - 5초 fallback 타이머 + `try/catch`로 반드시 메인 창이 뜨도록 방어.
- **조용한 크래시 추적**
  - `main.js`: `uncaughtException` / `unhandledRejection` / startup·createWindow 예외를 `%APPDATA%\System Monitor\crash.log` 에 타임스탬프와 함께 기록.

### CI
- `Release` 워크플로에 `workflow_dispatch` 버전 인풋 추가 → Actions 탭에서 수동 릴리즈 가능.

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
