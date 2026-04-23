# CLAUDE.md

이 저장소에서 Claude 가 따라야 할 규칙 모음.

## 릴리즈 발행 — Windows cmd 에서 태그 푸시

이 리포의 릴리즈 워크플로(`release.yml`) 는 `on: push: tags: 'v*'` 트리거.
태그를 푸시하면 GitHub Actions 가 Windows 빌드 + GitHub Release 자동 발행.

사용자는 Windows cmd 환경에서 작업하며 git CLI 사용에 익숙하지 않음.
다음 규칙을 반드시 지킬 것.

### cmd 푸시 시 따라야 할 절대 규칙

1. **`cd` 부터 먼저**, 그 다음 git 명령. 새 cmd 창은 항상 `C:\Users\testos`
   에서 시작하므로 매번 첫 줄에 `cd /d %USERPROFILE%\Desktop\dr-release-tag`
   를 두고 절대 빠뜨리지 말 것. (사용자가 가장 자주 빠뜨리는 단계)

2. **`^` 사용 금지**. cmd 에서 줄 끝 `^` 는 "다음 줄로 이어짐" 이라
   `git tag v1.0.x origin/branch^` 같은 표현은 다음 명령과 합쳐져 깨진다.
   git 의 "한 커밋 앞" 표기가 필요하면 **커밋 해시를 직접 적을 것**.
   해시는 `git log --oneline` 또는 푸시 후 메시지에서 확인 가능.

3. **명령은 한 줄씩 따로 입력**. 한꺼번에 복붙하면 cmd 가 일부를 누락하거나
   `^` 같은 특수문자에 걸려 의도와 다르게 실행된다. 한 번에 보내고 싶으면
   `&&` 로 명시적으로 연결한 단일 라인을 만들 것.

4. **한 줄로 묶을 때 형태**:
   ```cmd
   cd /d %USERPROFILE%\Desktop\dr-release-tag && git fetch origin && git tag vX.Y.Z <COMMIT_SHA> && git push origin vX.Y.Z
   ```
   `&&` 는 앞 단계 성공 시에만 다음 진행 — 안전.

5. **표준 시퀀스** (사용자에게 매번 이 형태로 안내):
   ```cmd
   cd /d %USERPROFILE%\Desktop\dr-release-tag
   git fetch origin
   git tag vX.Y.Z <COMMIT_SHA>
   git push origin vX.Y.Z
   ```

### 릴리즈 발행 시 흔한 사고

- **잘못된 target commit 으로 태그**: 웹 UI 의 `releases/new` 에서 Target
  드롭다운을 잘못 고르면 의도하지 않은 커밋에 태그가 박혀 버전 내용이
  엇갈린다. 안내할 땐 항상 **해시 앞 7자리** 를 함께 명시하고 그걸 골라야
  한다고 강조할 것. (예: `feat(v1.0.29): 피킹 모드... (해시 30b060b) 선택`)

- **태그가 잘못됐을 때 복구**:
  ```cmd
  cd /d %USERPROFILE%\Desktop\dr-release-tag
  git fetch origin --tags
  git push origin :refs/tags/vX.Y.Z   REM 원격 태그 삭제
  git tag -d vX.Y.Z                   REM 로컬 태그 삭제
  git tag vX.Y.Z <CORRECT_SHA>        REM 올바른 커밋에 재생성
  git push origin vX.Y.Z
  ```

- **샌드박스 환경(이 Claude 세션)에서는 태그 푸시 불가**: git 프록시가
  `refs/tags/*` 푸시를 HTTP 403 으로 차단함. Claude 가 직접 태그 푸시를
  시도하면 무한 실패하므로, 처음부터 사용자에게 cmd 명령을 안내할 것.

## 커밋 메시지 톤

- 한국어. `feat(vX.Y.Z): ...`, `fix: ...` 형식.
- 커밋 본문에 **의도** 한 줄과 **변경 요점** 불릿 몇 개. 구현 디테일은
  코드를 보면 알 수 있는 내용은 적지 말 것.
- 마지막에 `https://claude.ai/code/...` 세션 링크. (Claude Code 자동 추가)

## 게임 컨셉 — "몰래 플레이"

이 프로젝트의 모든 UI 결정은 "근무 중 모니터 위젯처럼 보이게" 라는 단일
목표에서 출발한다. 새 기능 추가/수정 시:

- 색 대비는 항상 낮게 유지. 채도 높은 강조색 신규 도입 금지.
- 버튼은 패널과 거의 같은 톤. 테두리는 `transparent` + 반투명 바탕.
- 단축키는 `Ctrl+Shift+*` 패턴 (D=위장, B=숨김, Q=종료, T=테마, P=피킹).
- 새 기능이 업무툴 위장과 어긋나는 것 같으면 사용자에게 먼저 물어볼 것.
