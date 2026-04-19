# 릴리즈 보드

## v1.0.13 (2026-04-19) — 자동 업데이트 개선 + 테마 UI

### 자동 업데이트 신뢰성 강화
- **1시간마다 재체크** — 시작 시 1회만 하던 것을 주기적 재체크 추가.
  오래 켜놓은 세션도 새 릴리즈 감지.
- **업데이트 준비 완료 배너** — 다운로드 끝나면 게임 UI 상단에 초록 배너.
  "🆕 새 버전 준비됨 — 지금 적용 / ✕"
- **"지금 적용" 버튼** — `install-update-now` IPC → `quitAndInstall(true, true)`.
  앱 즉시 재시작하며 설치. 자연스러운 종료를 기다리지 않아도 됨.

### 위장 테마 UI 개선
- **Ctrl+Shift+T 를 globalShortcut 으로 등록** — 창 포커스 없어도 동작.
- **마이페이지 🔖 버전 탭 하단에 테마 선택 버튼 4개** — 마우스로 직접 선택.
  현재 테마가 하이라이트.

---

## v1.0.12 (2026-04-18) — 스킬 대개편 + 위장 테마 4종

### 🎨 위장 테마 4종 (PR #24)
Ctrl+Shift+T 로 순환, localStorage 저장:
- **sysmon** (기본): 기존 System Resource Monitor
- **excel**: 한국어 리본 + Q4 실적 시트 + 상태바. 무작위 셀 값 변동
- **terminal**: 검은 배경 + tail -f nginx access.log. 무작위 IP/경로/상태
- **kakao**: 팀 업무 채팅방 UI (말풍선/아바타/시간). 19개 메시지 순환

### 🎮 스킬 시스템 전면 개편 (Stage A~E)
- **Stage A** (PR #18) — 마이페이지 UI + 5개 탭 + 스킬 on/off 토글.
  메인메뉴 정리 (정보 항목 [📋 마이페이지] 로 통합).
- **Stage B** (PR #19) — 스킬 5등급 (일반/고급/희귀/영웅/전설) +
  7개 도시 서재 (LIBRARIES) 데이터 모델 + 마이페이지 등급 뱃지.
- **Stage C** (PR #20) — 77 직업 312 스킬 전체 grade/replaces 자동 정규화
  (모듈 로드 시 1회). learnSkill 헬퍼로 상위 학습 시 하위 자동 비활성.
  기존 세이브 reconcileDeactivations 1회 마이그레이션.
- **Stage D** (PR #21) — 스킬북 아이템 312권 자동 생성. 일반 등급만
  heltant + capital 상점 판매 (47권). 고급+ 는 서재 수련 종료 시
  chancePerSession × pool 가중 확률로 발견. cUse 스킬북 처리.
- **Stage E** (PR #22) — 이코노미 밸런스: 몬스터 골드 -40%, 퀘스트
  보상 -30%, 판매가 50→35%, 장비 가격 ×2.5, 포션 ×1.5.

### 🛠 서버 & CI
- DB startup 크래시 해결 (PR #15) — CREATE TABLE → ALTER → INDEX 순서.
- 수련장 레벨 게이트 (PR #16) — 집중/극한 수련 저레벨 제한.
- Release 워크플로우 하드닝 (PR #14) — 바이너리 캐시 + 지수백오프 재시도.
- 릴리즈 자동 publish (PR #17) — Draft → Latest 자동 승격.

---

## v1.0.10 (2026-04-18)

### 서버
- **DB startup 크래시 해결** (PR #15) — `CREATE INDEX` 가 마이그레이션 전에
  실행되어 `play_time` 컬럼이 없는 기존 DB 에서 SqliteError 발생.
  순서를 `CREATE TABLE → ALTER TABLE → CREATE INDEX` 로 분리.

### 게임 밸런스
- **수련장 수련에 레벨 게이트 추가** (PR #16) — 저레벨에서 장시간 수련으로
  레벨업이 너무 쉬워지던 문제 해결. 가벼운 명상(Lv.1) / 기초(Lv.10) /
  심화(Lv.25) / 집중(Lv.50) / 극한(Lv.80). UI 잠금 표시 + 엔진 게이트.

### CI
- **release 워크플로우 하드닝** (PR #14) — electron / electron-builder
  바이너리 캐시 + npm install / build 단계에 지수백오프 4회 재시도.
  504 같은 일시 장애 자동 복구.

---

## v1.0.9 (2026-04-18)

### 수정
- **깨달음 시련 2단계 전투에서 게임이 멈추던 문제** 해결 (PR #12).
  - 원인: `engine.js handleInput()` 의 라우팅 순서가 trial → combat 이었음.
    시련 2단계는 `this.trial` 이 유지된 채 `this.combat` 이 세팅되는데,
    trial 체크가 먼저라 입력이 `trialInput()` 으로 가고, 거기
    `stage==='battle'` 분기가 없어 **입력이 조용히 버려짐**.
  - 수정: combat 체크를 trial 체크 앞으로 이동. 전투 중이면 항상 전투
    입력으로 라우팅.

---

## v1.0.8 (2026-04-18)

### 보안 하드닝 (PR #10)
- **Stored XSS → RCE 차단**: 닉네임 정규식 `[A-Za-z0-9_한글]` 화이트리스트,
  클라이언트의 모든 user-데이터 `innerHTML` 경로에 `escHtml()` 적용
  (리더보드·우편함·캐릭터 이름·작위·위치 등).
- **토큰**: `Math.random()` → `crypto.randomBytes(32)` (CSPRNG).
- **bcrypt rounds 8→12**, 비밀번호 최소 길이 4→8.
- **레이트 리밋**: register 5/분, login 10/분, cloud_save 60/분,
  leaderboard_update 60/분, mail_send 20/분 (IP 기반 인메모리).
- **리더보드 수치 상한 clamp** + `job` 정규식 화이트리스트.
- **우편함 수신자 보호**: 미수령 100통 초과 시 발송 거부.
- **login 타이밍 공격 완화** (더미 bcrypt 비교).
- **500 응답에서 내부 에러 메시지 제거** (prod).
- **`express.json` 5MB → 256KB**, cloud save 5MB → 200KB.
- **CSP meta 추가**: 외부 스크립트 차단, `connect-src` Railway 서버만 허용.

### UX 개선
- 시작 시 **로그인 화면을 최상위**로 노출 (PR #6). 기존엔 캐릭터 선택
  하단의 작은 로그인 버튼을 찾아야 했음. "◀ 돌아가기" → "로그인 없이 진행".
- **재전직 / 마스터리 버튼**은 4차 직업 마스터 1개 이상일 때만 노출
  (PR #6, #8) — 초심자 혼동 제거.
- **로그인/가입 실패 원인 상세화** (PR #7): `서버 연결 실패 (URL)`,
  `서버 응답 파싱 실패 [HTTP N]`, `서버 거부 [HTTP N]` 로 구분.
- **"서버 상태 확인" 버튼** 추가 — `/healthz` 직접 호출.

### 프로세스
- `.github/CODEOWNERS` 추가 — 모든 PR 에 owner 자동 리뷰 요청.

---

## v1.0.7 (2026-04-18)

### 수정 — "또 혼자 꺼짐" 재발 방어 (보완 1+2+3+6)
"브레인스토밍 5가지 경로" 중 네 가지를 한 번에 차단.

- **[보완1] `createWindow()` 의 동기 throw 방어** — `mainWindowEverCreated=true`
  플래그를 `new BrowserWindow(...)` **성공 이후** 로 이동. 생성 실패 시
  `app.disableHardwareAcceleration()` 후 한 번 더 시도 (GPU 드라이버 이슈 대응),
  그래도 실패하면 `dialog.showErrorBox` 로 사용자에게 알리고 `app.exit(1)`.
  조용한 죽음 금지.
- **[보완2] 시작 시 `quitAndInstall` 완전 폐기** — `autoInstallOnAppQuit=true`
  로 전환. 업데이트는 다운로드만 하고, 설치는 사용자가 앱을 정상 종료할 때
  `electron-updater` 가 알아서 실행. 시작 흐름에서 `app.quit()` 계열 호출을
  모두 제거 → 창이 항상 뜸. (현재 스플래시 문구도 "업데이트 준비됨 — 다음
  종료 시 적용" 으로 변경.)
- **[보완3] 전역 에러 핸들러** — `uncaughtException` / `unhandledRejection`
  에서 `startup.log` 기록 + `dialog.showErrorBox` 표시.
  업데이트 핸들러 내부의 비동기 throw 가 메인 프로세스를 조용히 죽이던 경로 차단.
- **[보완5] 환경변수 추가**
  - `SYSMON_DISABLE_GPU=1` — 시작 시 `app.disableHardwareAcceleration()` 호출.
  - `SYSMON_RESET_UPDATER=1` — `%LOCALAPPDATA%\system-monitor-updater` 삭제 후 시작.
- **`loadFile:start`** 로그에 `index.html` 의 절대 경로 기록 — asar 경로 이슈 판별용.

### 남은 리스크
- **GPU/하드웨어 가속 hang** (경로 #2) — 최초 `BrowserWindow` 생성 자체가
  **throw 없이 hang** 하는 경우는 `STARTUP_HARD_TIMEOUT_MS=30s` 안전망이
  아직 주된 대응. 재발 시 `SYSMON_DISABLE_GPU=1` 로 실행해보고 결과 공유.

---

## v1.0.6 (2026-04-18)

### 수정 — "초기화 중..." 스플래시 후 앱이 혼자 꺼지는 문제
- **원인**: `finally { splash.destroy() }` → `createWindow()` 순서로 실행되는 동안
  Electron이 스플래시 `close` 이벤트를 동기적으로 처리하면서 `window-all-closed` 를
  즉시 emit → 기본 핸들러가 `app.quit()` 을 호출 → 뒤따르는 `createWindow()` 가
  실행되지 못하고 앱이 그대로 종료되는 경로가 있었음. (메인 창은 한번도 표시되지 않음)
- **수정**:
  1. `createWindow()` 를 먼저 호출해 메인 창을 띄운 **뒤에** 스플래시를 `destroy()`.
     창 개수가 0으로 떨어지는 순간을 원천 제거.
  2. `window-all-closed` 핸들러에 `mainWindowEverCreated` 가드 추가 — 메인 창이
     한 번도 만들어지지 않았다면 무시(스플래시 destroy 로 인한 가짜 이벤트).
  3. 업데이트 다운로드 완료 후 `quitAndInstall` 이 예약되면 (`updateRestartScheduled`),
     메인 창을 만들지 않고 10초간 대기. 설치가 실패해 앱이 그대로 살아있으면
     안전망으로 메인 창을 강제 생성해 "그냥 꺼진 상태"를 방지.
  4. `before-quit` 에서 `isQuitting` 추적 → 안전망 타이머가 정상 종료 중에는
     메인 창을 띄우지 않도록 방어.

### 진단 — 재발 시 원인 바로 확인
- **파일 기반 시작 로그 추가**: `%APPDATA%\system-monitor\startup.log` 에
  `whenReady / splash:created / update:available / update:downloaded /
  createWindow:begin / ready-to-show / window-all-closed / before-quit` 등이
  ISO 타임스탬프와 함께 한줄씩 append 됨. 혼자 꺼지면 이 파일의 마지막 줄이 원인.
- 렌더러 크래시(`render-process-gone`)와 `did-fail-load` 도 함께 기록.

### 테스트 — 설치 없이 빠르게 검증
1. **`npm start`** (dev 모드, ~2초)
   - packaged 가 아니므로 autoUpdater 는 건너뜀. 스플래시→메인 창 전환만 빠르게 확인.
2. **`npm run dist`** 후 `dist\win-unpacked\System Monitor.exe` 직접 실행 (~30초)
   - NSIS 설치 없이 packaged 바이너리로 실행. 실제 릴리즈와 동일한 코드 경로.
   - 여기서 메인 창이 뜨면 설치본도 확실히 뜬다.
3. **업데이트 체크 스킵** — 빠른 기동 확인용.
   ```
   set SYSMON_SKIP_UPDATE=1
   "System Monitor.exe"
   ```
   네트워크 체크 건너뛰고 바로 메인 창으로 진입.

---

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
