# Dragon Raja RPG Server (Railway + SQLite)

멀티플레이어 서버 — 계정 · 클라우드 세이브 · 리더보드 · 우편함.

## 구조

- **Express** Node.js 서버
- **SQLite** (better-sqlite3) — 로컬 파일 DB
- **Railway** 호스팅 (서버+DB 한 컨테이너)
- Persistent Volume: `/data/game.db` 에 DB 파일 영구 저장

## 로컬 실행

```bash
cd server
npm install
npm start
# → http://localhost:3030
```

## Railway 배포

### 1. Railway 계정 준비

1. https://railway.app 가입 (GitHub 연동)
2. Hobby 플랜 선택 ($5/월, 또는 첫 가입 시 $5 크레딧으로 트라이얼 가능)

### 2. CLI 설치 및 로그인

```bash
npm install -g @railway/cli
railway login              # 브라우저 로그인
```

### 3. 프로젝트 생성 및 배포

```bash
cd server
railway init               # 프로젝트 생성 — 이름 입력 (예: dragon-raja)
railway up                 # 빌드 + 배포 시작 (수 분 소요)
```

### 4. Persistent Volume 연결 (DB 영구화)

Railway 대시보드 → 해당 서비스 → **Volumes** → **Create Volume**:
- Mount path: `/data`
- Size: `1GB` (필요 시 확장, $0.25/GB/월)

Volume 만든 후 **Redeploy**.

### 5. 공개 URL 생성

```bash
railway domain             # 자동으로 xxx.up.railway.app 도메인 할당
```

출력된 URL을 기억 (예: `https://dragon-raja.up.railway.app`).

### 6. 동작 확인

```bash
# 헬스체크
curl https://dragon-raja.up.railway.app/healthz

# 회원가입
curl -X POST https://dragon-raja.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"1234"}'

# 로그인
curl -X POST https://dragon-raja.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"1234"}'

# 리더보드 조회
curl https://dragon-raja.up.railway.app/api/leaderboard/top?type=level
```

## API 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
|---|---|---|---|
| GET  | `/healthz` | 서버 상태 | - |
| POST | `/api/auth/register` | `{username, password}` | - |
| POST | `/api/auth/login` | `{username, password}` | - |
| POST | `/api/cloud/save` | 세이브 업로드 | ✅ |
| GET  | `/api/cloud/load` | 세이브 다운로드 | ✅ |
| POST | `/api/leaderboard/update` | 내 순위 갱신 | ✅ |
| GET  | `/api/leaderboard/top?type=level` | 상위 50명 | - |
| POST | `/api/mail/send` | 우편 발송 | ✅ |
| GET  | `/api/mail/inbox` | 받은 우편 | ✅ |
| POST | `/api/mail/claim` | 수령 | ✅ |

Authorization 헤더: `Bearer <token>` (로그인 시 받음)

### 리더보드 type 옵션
- `level` — 레벨 순
- `gold` — 골드 순
- `bosses_killed` — 보스 처치 수
- `total_trade_profit` — 누적 무역 이익
- `mastered_lines` — 마스터 직업 수

## 비용 예상 (Railway Hobby $5/월)

| 유저 규모 | DB 크기 | 월 예상 비용 |
|---|---|---|
| 10명 | 0.1MB | $5 (Hobby 구독만) |
| 1,000명 | 10MB | $5 |
| 100,000명 | 1GB | $5 + Volume $0.25 ≈ $5.25 |

## 클라이언트 연동

Electron 앱에 `SERVER_URL` 상수 추가:
```js
const SERVER_URL = 'https://dragon-raja.up.railway.app';
```

그 후 로그인·리더보드·우편함 UI 연결 (다음 단계).
