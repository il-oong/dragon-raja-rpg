# 드래곤 라자 — 바이서스 연대기 (회사 위장 모드)

텍스트 RPG + 시스템 모니터 위장 Electron 앱.

## 설치 & 실행

```bash
cd "C:\Users\testos\Desktop\개인\몰래"
npm install
npm start
```

## 핵심 단축키 (언제 어디서나 작동)

| 키 | 동작 |
|---|---|
| **Ctrl+Shift+D** | 위장 ↔ 게임 전환 (메인) |
| **ESC** | 즉시 위장모드 |
| **Ctrl+Shift+B** | 창 자체를 숨김 (작업표시줄에서도 사라짐) |
| **Ctrl+Shift+Q** | 즉시 종료 |

- 앱 시작 시 **기본은 위장모드(시스템 모니터)**. `Ctrl+Shift+D`를 눌러야 게임화면.
- 창 제목은 항상 "System Monitor" 로 고정.

## 게임 명령어

| 명령 | 설명 |
|---|---|
| `help`, `?` | 전체 명령어 |
| `look` / `l` | 현재 위치 정보 |
| `status` / `s` | 캐릭터 상태 |
| `inv` / `i` | 인벤토리 |
| `skills` | 보유 스킬 |
| `quests` / `q` | 퀘스트 |
| `go <목적지>` | 이동 (예: `go 북쪽 숲`) |
| `explore` / `e` | 탐험 (조우 발생) |
| `talk <NPC>` | NPC 대화 (예: `talk 촌장`) |
| `shop` / `buy <키>` / `sell <키>` | 상점 |
| `use <키>` / `equip <키>` / `unequip <슬롯>` | 아이템 |
| `accept <퀘스트ID>` / `complete <퀘스트ID>` | 퀘스트 수락/완료 |
| `rest` / `inn` | 여관 |
| `save` / `load` | 저장/불러오기 |
| `clear` | 화면 지우기 |

## 전투 명령어

| 명령 | 설명 |
|---|---|
| `attack` / `a` | 일반 공격 |
| `skill <id>` / `sk <id>` | 스킬 사용 (예: `skill fireball`) |
| `use <아이템키>` | 포션 등 사용 |
| `run` | 도주 (60% 성공) |

## 세계관

- **종족**: 인간 / 엘프 / 드워프 / 하프엘프 / 오우거
- **직업**: 전사 / 마법사 / 사제 / 도적 / 궁사
- **지역**: 헬턴트 → 북쪽 숲 → 깊은 숲 → 이루릴의 마을 → 용의 산맥 → 아무르타트의 둥지
- **최종 보스**: 아무르타트

## 위장 팁

- 작업표시줄에도 "System Monitor"로 표시됩니다.
- 관리자/동료가 지나가면 **ESC 한 번**으로 즉시 가짜 모니터 화면.
- 완전히 숨기려면 **Ctrl+Shift+B** (작업표시줄에서도 사라짐).
- `Ctrl+Shift+B`를 다시 누르면 다시 나타납니다.

## 자동 업데이트 (개발자용)

NSIS 설치본은 앱 실행 시 **메인 창을 띄우기 전에** GitHub Releases를 조회해
새 버전이 있으면 스플래시(System Monitor 톤)를 보이면서 다운받고 자동 재시작합니다.
네트워크 불가·체크 실패 시 최대 8초 대기 후 그냥 기존 버전으로 진행.
포터블 .exe는 자동 업데이트 불가.

### 릴리즈 절차
```bash
# 1) 버전 올리기 (package.json + git tag 자동 생성)
npm version patch    # 또는 minor / major

# 2) 태그까지 푸시 → GitHub Actions가 Windows에서 빌드 후 Release 생성
git push --follow-tags
```

Actions(`.github/workflows/release.yml`)가 `vX.Y.Z` 태그를 받으면
`electron-builder --publish always`로 NSIS + 포터블 .exe를 빌드해
Release에 업로드합니다. 기존 NSIS 설치 사용자는 다음 실행 시 자동 적용.
