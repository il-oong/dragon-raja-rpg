# CONTRIBUTING — Dragon Raja RPG

## 브랜치 정책

이 저장소는 **2-tier 브랜치 모델**입니다.

```
master  ← 배포된 릴리즈 (보호됨, 오너만 merge)
  ↑
  dev   ← 통합 브랜치 (PR 타겟)
  ↑
  claude/..., feature/..., fix/...   ← 작업 브랜치
```

### 기여자(외부) 규칙

- **PR 타겟은 항상 `dev`** 로 지정. `master` 타겟 PR 은 오너가 닫거나 base 를 변경합니다.
- 새 기능 / 버그 수정은 먼저 작업 브랜치에서 진행 → `dev` 로 PR.
- 오너 검토 후 `dev` 로 merge.
- 일정 시점에 오너가 `dev → master` 머지로 릴리즈합니다.

### 브랜치 네이밍

| 용도 | 예시 |
|---|---|
| 신규 기능 | `feature/add-party-system` |
| 버그 수정 | `fix/trial-combat-freeze` |
| 리팩터 | `refactor/engine-split` |
| 문서/CI | `chore/contributing-doc` |

이 저장소의 자동 에이전트 작업은 `claude/...` 네임스페이스 사용.

### 커밋 메시지

- 한국어 OK. 첫 줄은 50자 이내 요약.
- 본문은 "왜(why)" 중심. "무엇(what)" 은 diff 가 말해줍니다.
- 예: `fix(engine): 시련 2단계에서 입력이 먹히지 않던 문제`

## 로컬 개발

```bash
npm install
npm start           # dev 모드 실행 (자동 업데이트 미작동)
npm run dist        # 패키지 빌드 — dist/win-unpacked/ 에 실행 파일
```

## 릴리즈

릴리즈는 오너가 수행:

1. `dev` 에 쌓인 변경을 검토.
2. `release/vX.Y.Z` 브랜치 생성 → `package.json` 버전 bump + CHANGELOG 추가.
3. `master` 로 PR 후 머지.
4. GitHub Actions → **Release** 워크플로우 **Run workflow** 클릭.
5. Draft 릴리즈가 자동으로 Published + Latest 로 승격됨 (PR #17 자동화).
6. 기존 설치본은 다음 실행 → 종료 시 자동 업데이트.

## 보안/치팅 방지

- 서버(`server/index.js`) 에 레이트 리밋과 입력 검증 적용됨.
- 리더보드 수치는 상한 clamp 로 완화. 근본 해결(서버 측 계산)은 후속 작업.
- 닉네임은 영숫자/한글/`_` 만 허용 (stored XSS/RCE 차단).

## 질문/이슈

- 버그 신고: Issues 탭
- 아이디어/논의: Issues 에 `discussion` 라벨 붙여서 오픈
