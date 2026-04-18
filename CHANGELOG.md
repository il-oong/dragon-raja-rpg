# 릴리즈 보드

## v1.0.2 (2026-04-18)

### 수정
- **실행 시 메인 창 미표시 문제 방어 강화** (33d7676)
  - `app.whenReady` async 체인 전체를 `try/catch/finally`로 감싸 `createSplash()` / `runStartupUpdateCheck()`가 throw해도 `createWindow()`는 반드시 호출.
  - `package.json` `build.asarUnpack`에 `electron-updater`, `builder-util-runtime`, `js-yaml` 추가해 native 모듈 로드 실패 차단.

### 알려진 이슈
- **설치 중 "System Monitor cannot be closed" 오류**
  - 이전 버전이 실행 중이면 NSIS 설치기가 프로세스를 종료하지 못하고 수동 종료 + 재시도를 요구.
  - 현재 앱은 위장 모드로 작업표시줄에서 `System Monitor`로 보이므로 사용자가 종료 대상을 찾기 어려움.
  - **임시 회피**: `Ctrl+Shift+Q`로 먼저 앱 종료 → 설치 재시도.
  - 장기 해결은 NSIS include 스크립트에 `taskkill /IM SystemMonitor.exe /F` 추가 예정 (이슈로 등록).

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
