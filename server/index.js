// Dragon Raja RPG 멀티플레이 서버 (Railway + SQLite)
// Phase 1: 계정 · 클라우드 세이브 · 리더보드 · 우편함

const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const IS_PROD = process.env.NODE_ENV === 'production';
const BCRYPT_ROUNDS = 12;            // 8 → 12 (브루트포스 내성 강화)
const MIN_USERNAME_LEN = 2;
const MAX_USERNAME_LEN = 20;
const MIN_PASSWORD_LEN = 8;          // 4 → 8
// 닉네임 허용 문자: 영숫자 + _ + 한글. 특수문자/HTML 금지 (stored XSS 차단).
const USERNAME_RE = /^[A-Za-z0-9_\uAC00-\uD7A3]+$/;

// HTML 이스케이프 — mail subject/message 등 클라에서 innerHTML 에 들어갈 수 있는 값.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// 500 응답에서 내부 에러 노출 방지 (prod).
function serverError(res, err, code = 500) {
  if (!IS_PROD) console.error('[server error]', err);
  res.status(code).json({ ok: false, error: IS_PROD ? '서버 오류' : (err && err.message) || 'error' });
}

// ─── DB 준비 ────────────────────────────────────
// Railway Persistent Volume mount point: /data (기본). 없으면 로컬 ./data.
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data'));
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'game.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
console.log('[DB] Using', DB_PATH);

// ─── 스키마: 테이블 ────────────────────────────
// 인덱스는 마이그레이션 이후에 만들어야 함.
// (기존 DB 에 새 컬럼이 추가되기 전에 그 컬럼 위 인덱스를 만들면 startup 크래시.)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    token TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS cloud_saves (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username TEXT,
    level INTEGER DEFAULT 1,
    gold INTEGER DEFAULT 0,
    job TEXT,
    bosses_killed INTEGER DEFAULT 0,
    total_trade_profit INTEGER DEFAULT 0,
    mastered_lines INTEGER DEFAULT 0,
    play_time INTEGER DEFAULT 0,
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS mails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user TEXT,
    to_user TEXT NOT NULL,
    subject TEXT,
    message TEXT,
    gold INTEGER DEFAULT 0,
    item_key TEXT,
    item_qty INTEGER DEFAULT 0,
    claimed INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_username TEXT NOT NULL,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_username TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (strftime('%s','now')),
    UNIQUE(from_user_id, to_user_id)
  );

  CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_username TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    PRIMARY KEY (user_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_username TEXT NOT NULL,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_username TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS parties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    party_name TEXT NOT NULL,
    leader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leader_username TEXT NOT NULL,
    max_members INTEGER DEFAULT 4,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS party_members (
    party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    joined_at INTEGER DEFAULT (strftime('%s','now')),
    PRIMARY KEY (party_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS party_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_username TEXT NOT NULL,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_username TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (strftime('%s','now')),
    UNIQUE(party_id, to_user_id)
  );

  CREATE TABLE IF NOT EXISTS raid_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    boss_name TEXT NOT NULL,
    boss_max_hp INTEGER NOT NULL,
    boss_current_hp INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at INTEGER DEFAULT (strftime('%s','now')),
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS raid_contributions (
    raid_id INTEGER NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    damage_dealt INTEGER DEFAULT 0,
    attacks_count INTEGER DEFAULT 0,
    PRIMARY KEY (raid_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS raid_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_id INTEGER NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    gold INTEGER DEFAULT 0,
    item_key TEXT,
    item_qty INTEGER DEFAULT 0,
    claimed INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

// ─── 스키마: 마이그레이션 (기존 DB 에 신규 컬럼 추가) ──────────
// CREATE TABLE IF NOT EXISTS 는 이미 존재하는 테이블에는 컬럼을 안 더해주므로
// 누락된 컬럼은 ALTER TABLE 로 보강. 인덱스 생성보다 먼저 수행해야 한다.
function safeAddColumn(table, def) {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${def}`); }
  catch (e) { /* 이미 있음 — duplicate column name 무시 */ }
}
safeAddColumn('leaderboard', 'play_time INTEGER DEFAULT 0');
safeAddColumn('leaderboard', 'mastered_lines INTEGER DEFAULT 0');

// ─── 스키마: 인덱스 ────────────────────────────
// 컬럼 보강 후에 안전하게 생성.
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
  CREATE INDEX IF NOT EXISTS idx_lb_level    ON leaderboard(level DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_gold     ON leaderboard(gold DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_boss     ON leaderboard(bosses_killed DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_trade    ON leaderboard(total_trade_profit DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_mastery  ON leaderboard(mastered_lines DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_playtime ON leaderboard(play_time DESC);
  CREATE INDEX IF NOT EXISTS idx_mail_inbox  ON mails(to_user, claimed);
  CREATE INDEX IF NOT EXISTS idx_friend_req_to ON friend_requests(to_user_id, status);
  CREATE INDEX IF NOT EXISTS idx_friend_req_from ON friend_requests(from_user_id, status);
  CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_user_id, read, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_party_leader ON parties(leader_id);
  CREATE INDEX IF NOT EXISTS idx_party_members_user ON party_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_party_invites_to ON party_invites(to_user_id, status);
  CREATE INDEX IF NOT EXISTS idx_raid_party ON raid_sessions(party_id, status);
  CREATE INDEX IF NOT EXISTS idx_raid_contrib_user ON raid_contributions(user_id);
  CREATE INDEX IF NOT EXISTS idx_raid_rewards_user ON raid_rewards(user_id, claimed);
`);

// ─── Express ───────────────────────────────────
const app = express();
app.set('trust proxy', 1);           // Railway/프록시 뒤에서 실제 클라이언트 IP 획득.
app.use(cors());                     // Electron 앱이라 일반적으로 origin 제약 불필요.
app.use(express.json({ limit: '256kb' })); // 5mb → 256kb (세이브는 그보다 훨씬 작음)

// 기본 /healthz 엔드포인트 (Railway가 healthcheck)
app.get('/', (req, res) => res.json({ ok: true, name: 'dragon-raja-server', time: Date.now() }));
app.get('/healthz', (req, res) => res.json({ ok: true }));

// 인증 미들웨어
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || token.length < 32) return res.status(401).json({ ok: false, error: '토큰 없음' });
  const user = db.prepare('SELECT id, username FROM users WHERE token = ?').get(token);
  if (!user) return res.status(401).json({ ok: false, error: '유효하지 않은 토큰' });
  req.user = user;
  next();
}

// CSPRNG 기반 토큰 — Math.random() 은 예측 가능하므로 금지.
function makeToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 chars
}

// ─── 간이 인메모리 레이트 리밋 (외부 의존성 없이) ─────────────
// IP 별 시간 버킷 카운터. 1분 창에서 임계 초과 시 429.
// 단일 인스턴스(Railway Hobby) 전제. 다중 인스턴스면 Redis 필요.
const RL_WINDOW_MS = 60 * 1000;
const rlBuckets = new Map(); // key = `${ip}:${tag}`, val = { count, resetAt }
function rateLimit(tag, max) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${tag}`;
    const now = Date.now();
    let b = rlBuckets.get(key);
    if (!b || b.resetAt < now) { b = { count: 0, resetAt: now + RL_WINDOW_MS }; rlBuckets.set(key, b); }
    b.count += 1;
    if (b.count > max) {
      const waitSec = Math.ceil((b.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(waitSec));
      return res.status(429).json({ ok: false, error: `요청이 너무 많음. ${waitSec}초 후 재시도.` });
    }
    next();
  };
}
// 주기적 버킷 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of rlBuckets) if (b.resetAt < now) rlBuckets.delete(k);
}, 5 * 60 * 1000).unref();

// ─── 회원가입 / 로그인 ─────────────────────────
// 레이트 리밋: 가입 5회/분, 로그인 10회/분 (IP 기준).
app.post('/api/auth/register', rateLimit('register', 5), (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || typeof username !== 'string'
        || username.length < MIN_USERNAME_LEN || username.length > MAX_USERNAME_LEN) {
      return res.status(400).json({ ok: false, error: `닉네임 ${MIN_USERNAME_LEN}~${MAX_USERNAME_LEN}자` });
    }
    // Stored XSS/RCE 방지 — 닉네임은 영숫자/_/한글만.
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ ok: false, error: '닉네임: 영문/숫자/한글/밑줄(_) 만 허용' });
    }
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({ ok: false, error: `비밀번호 ${MIN_PASSWORD_LEN}자 이상` });
    }
    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const token = makeToken();
    db.prepare('INSERT INTO users (username, password_hash, token) VALUES (?, ?, ?)')
      .run(username, hash, token);
    res.json({ ok: true, token, username });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ ok: false, error: '이미 존재하는 닉네임' });
    serverError(res, err);
  }
});

app.post('/api/auth/login', rateLimit('login', 10), (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ ok: false, error: '닉네임/비밀번호 필요' });
    }
    const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username);
    // Timing 유사화 — 사용자 존재 여부에 따라 응답 시간 차이가 덜 나게 더미 비교도 수행.
    const dummy = '$2a$12$abcdefghijklmnopqrstuv';
    const ok = user ? bcrypt.compareSync(password, user.password_hash)
                    : (bcrypt.compareSync(password, dummy), false);
    if (!user || !ok) {
      return res.status(401).json({ ok: false, error: '아이디/비밀번호 틀림' });
    }
    const token = makeToken();
    db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, user.id);
    res.json({ ok: true, token, username: user.username });
  } catch (err) {
    serverError(res, err);
  }
});

// ─── 클라우드 세이브 ───────────────────────────
const MAX_SAVE_BYTES = 200 * 1024; // 200KB — 일반 세이브 훨씬 작음
app.post('/api/cloud/save', requireAuth, rateLimit('cloud_save', 60), (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ ok: false, error: '데이터 필요 (object)' });
    }
    const json = JSON.stringify(payload);
    if (json.length > MAX_SAVE_BYTES) {
      return res.status(413).json({ ok: false, error: `세이브가 너무 큼 (${MAX_SAVE_BYTES}B 상한)` });
    }
    db.prepare(`
      INSERT INTO cloud_saves (user_id, data, updated_at) VALUES (?, ?, strftime('%s','now'))
      ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(req.user.id, json);
    res.json({ ok: true });
  } catch (err) { serverError(res, err); }
});

app.get('/api/cloud/load', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT data, updated_at FROM cloud_saves WHERE user_id = ?').get(req.user.id);
    res.json({ ok: true, data: row ? JSON.parse(row.data) : null, updatedAt: row?.updated_at || null });
  } catch (err) { serverError(res, err); }
});

// ─── 리더보드 ──────────────────────────────────
// 주의: level/gold 등은 클라가 보내는 값. 서버가 신뢰할 수 없음(치트 가능).
// 근본 해결은 cloud_saves 에서 서버가 직접 계산하는 것 — 추후 작업.
// 당장은 상한 clamp 로 완화: 비정상적으로 큰 값은 거부.
const LB_LIMITS = { level: 200, gold: 10_000_000_000, bosses_killed: 100000, total_trade_profit: 100_000_000_000, mastered_lines: 30, play_time: 10_000_000 };
app.post('/api/leaderboard/update', requireAuth, rateLimit('lb_update', 60), (req, res) => {
  try {
    const { level, gold, job, bosses_killed, total_trade_profit, mastered_lines, play_time } = req.body || {};
    const clamp = (v, max) => Math.max(0, Math.min(max, parseInt(v) || 0));
    // job 은 DB 에 저장되고 클라 innerHTML 에 들어가므로 엄격히 제한.
    // JOBS 화이트리스트 검증이 이상적이지만 여기선 길이/문자만 제한.
    const safeJob = /^[A-Za-z0-9_]{0,30}$/.test(String(job || '')) ? String(job || '') : '';
    db.prepare(`
      INSERT INTO leaderboard (user_id, username, level, gold, job, bosses_killed, total_trade_profit, mastered_lines, play_time, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        level = excluded.level,
        gold = excluded.gold,
        job = excluded.job,
        bosses_killed = excluded.bosses_killed,
        total_trade_profit = excluded.total_trade_profit,
        mastered_lines = excluded.mastered_lines,
        play_time = excluded.play_time,
        updated_at = excluded.updated_at
    `).run(
      req.user.id, req.user.username,
      Math.max(1, Math.min(LB_LIMITS.level, parseInt(level) || 1)),
      clamp(gold, LB_LIMITS.gold),
      safeJob,
      clamp(bosses_killed, LB_LIMITS.bosses_killed),
      clamp(total_trade_profit, LB_LIMITS.total_trade_profit),
      clamp(mastered_lines, LB_LIMITS.mastered_lines),
      clamp(play_time, LB_LIMITS.play_time)
    );
    res.json({ ok: true });
  } catch (err) { serverError(res, err); }
});

const LB_COLS = ['level', 'gold', 'bosses_killed', 'total_trade_profit', 'mastered_lines', 'play_time'];
app.get('/api/leaderboard/top', (req, res) => {
  try {
    const type = (req.query.type || 'level').toString();
    if (!LB_COLS.includes(type)) return res.status(400).json({ ok: false, error: `type: ${LB_COLS.join('/')}` });
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    // type 은 화이트리스트 통과 후에만 쿼리에 삽입 — SQL injection 위험 없음.
    const rows = db.prepare(`SELECT username, level, gold, job, bosses_killed, total_trade_profit, mastered_lines, play_time FROM leaderboard ORDER BY ${type} DESC, updated_at ASC LIMIT ?`).all(limit);
    res.json({ ok: true, type, data: rows });
  } catch (err) { serverError(res, err); }
});

// ─── 우편함 ────────────────────────────────────
const MAX_INBOX = 100; // 수신자 우편함 상한 — 초과 시 발송 거부 (스팸 방지)
app.post('/api/mail/send', requireAuth, rateLimit('mail_send', 20), (req, res) => {
  try {
    const { to_user, subject, message } = req.body || {};
    if (!to_user || typeof to_user !== 'string') return res.status(400).json({ ok: false, error: '수신자 필요' });
    if (to_user === req.user.username) return res.status(400).json({ ok: false, error: '자기 자신에게 불가' });
    const tu = db.prepare('SELECT id FROM users WHERE username = ?').get(to_user);
    if (!tu) return res.status(400).json({ ok: false, error: '해당 닉네임 없음' });
    // 수신자 우편함 포화 방지.
    const inboxCount = db.prepare('SELECT COUNT(*) AS n FROM mails WHERE to_user = ? AND claimed = 0').get(to_user).n;
    if (inboxCount >= MAX_INBOX) return res.status(429).json({ ok: false, error: '상대 우편함이 가득 찼음' });
    // subject/message 는 HTML 이스케이프 — 클라이언트가 innerHTML 에 쓸 경우 대비 (심층 방어).
    const safeSubject = escapeHtml(String(subject || '').slice(0, 40));
    const safeMessage = escapeHtml(String(message || '').slice(0, 500));
    // 골드·아이템 거래 금지 (게임 밸런스 보호). 항상 0으로 강제.
    db.prepare('INSERT INTO mails (from_user, to_user, subject, message, gold, item_key, item_qty) VALUES (?, ?, ?, ?, 0, NULL, 0)')
      .run(req.user.username, to_user, safeSubject, safeMessage);
    res.json({ ok: true });
  } catch (err) { serverError(res, err); }
});

app.get('/api/mail/inbox', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`SELECT id, from_user, subject, message, gold, item_key, item_qty, created_at FROM mails WHERE to_user = ? AND claimed = 0 ORDER BY created_at DESC LIMIT 50`).all(req.user.username);
    res.json({ ok: true, data: rows });
  } catch (err) { serverError(res, err); }
});

app.post('/api/mail/claim', requireAuth, (req, res) => {
  try {
    const { mail_id } = req.body || {};
    const id = parseInt(mail_id);
    if (!id || id <= 0) return res.status(400).json({ ok: false, error: 'mail_id 필요' });
    const mail = db.prepare('SELECT * FROM mails WHERE id = ? AND to_user = ?').get(id, req.user.username);
    if (!mail) return res.status(404).json({ ok: false, error: '메일 없음' });
    if (mail.claimed) return res.status(400).json({ ok: false, error: '이미 수령' });
    const r = db.prepare('UPDATE mails SET claimed = 1 WHERE id = ? AND claimed = 0').run(id);
    if (r.changes === 0) return res.status(400).json({ ok: false, error: '수령 실패' });
    res.json({ ok: true, mail });
  } catch (err) { serverError(res, err); }
});

// ─── 친구 시스템 ───────────────────────────────
// 친구 요청 보내기
app.post('/api/friends/request', requireAuth, rateLimit('friend_req', 30), (req, res) => {
  try {
    const { to_username } = req.body || {};
    if (!to_username || typeof to_username !== 'string') {
      return res.status(400).json({ ok: false, error: '대상 닉네임 필요' });
    }
    if (to_username === req.user.username) {
      return res.status(400).json({ ok: false, error: '자기 자신에게 친구 요청 불가' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get(to_username);
    if (!targetUser) {
      return res.status(400).json({ ok: false, error: '해당 닉네임 없음' });
    }

    // 이미 친구인지 확인
    const existingFriend = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?')
      .get(req.user.id, targetUser.id);
    if (existingFriend) {
      return res.status(400).json({ ok: false, error: '이미 친구입니다' });
    }

    // 이미 요청을 보냈는지 확인
    const existingRequest = db.prepare(
      'SELECT status FROM friend_requests WHERE from_user_id = ? AND to_user_id = ?'
    ).get(req.user.id, targetUser.id);

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ ok: false, error: '이미 친구 요청을 보냈습니다' });
      }
      // 거절된 요청이면 다시 보낼 수 있도록 업데이트
      db.prepare(
        'UPDATE friend_requests SET status = ?, created_at = strftime(\'%s\',\'now\') WHERE from_user_id = ? AND to_user_id = ?'
      ).run('pending', req.user.id, targetUser.id);
    } else {
      db.prepare(
        'INSERT INTO friend_requests (from_user_id, from_username, to_user_id, to_username) VALUES (?, ?, ?, ?)'
      ).run(req.user.id, req.user.username, targetUser.id, targetUser.username);
    }

    res.json({ ok: true, message: '친구 요청을 보냈습니다' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ ok: false, error: '이미 요청을 보냈습니다' });
    }
    serverError(res, err);
  }
});

// 받은 친구 요청 목록
app.get('/api/friends/requests/received', requireAuth, (req, res) => {
  try {
    const requests = db.prepare(
      'SELECT id, from_user_id, from_username, created_at FROM friend_requests WHERE to_user_id = ? AND status = ? ORDER BY created_at DESC'
    ).all(req.user.id, 'pending');
    res.json({ ok: true, data: requests });
  } catch (err) { serverError(res, err); }
});

// 보낸 친구 요청 목록
app.get('/api/friends/requests/sent', requireAuth, (req, res) => {
  try {
    const requests = db.prepare(
      'SELECT id, to_user_id, to_username, status, created_at FROM friend_requests WHERE from_user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.user.id);
    res.json({ ok: true, data: requests });
  } catch (err) { serverError(res, err); }
});

// 친구 요청 수락
app.post('/api/friends/accept', requireAuth, rateLimit('friend_accept', 30), (req, res) => {
  try {
    const { request_id } = req.body || {};
    const id = parseInt(request_id);
    if (!id || id <= 0) {
      return res.status(400).json({ ok: false, error: 'request_id 필요' });
    }

    const request = db.prepare(
      'SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ? AND status = ?'
    ).get(id, req.user.id, 'pending');

    if (!request) {
      return res.status(404).json({ ok: false, error: '친구 요청을 찾을 수 없습니다' });
    }

    // 트랜잭션으로 처리
    const insertFriend = db.prepare(
      'INSERT OR IGNORE INTO friends (user_id, friend_id, friend_username) VALUES (?, ?, ?)'
    );
    const updateRequest = db.prepare(
      'UPDATE friend_requests SET status = ? WHERE id = ?'
    );

    db.transaction(() => {
      // 양방향 친구 관계 생성
      insertFriend.run(req.user.id, request.from_user_id, request.from_username);
      insertFriend.run(request.from_user_id, req.user.id, req.user.username);
      updateRequest.run('accepted', id);
    })();

    res.json({ ok: true, message: '친구 요청을 수락했습니다' });
  } catch (err) { serverError(res, err); }
});

// 친구 요청 거절
app.post('/api/friends/reject', requireAuth, rateLimit('friend_reject', 30), (req, res) => {
  try {
    const { request_id } = req.body || {};
    const id = parseInt(request_id);
    if (!id || id <= 0) {
      return res.status(400).json({ ok: false, error: 'request_id 필요' });
    }

    const result = db.prepare(
      'UPDATE friend_requests SET status = ? WHERE id = ? AND to_user_id = ? AND status = ?'
    ).run('rejected', id, req.user.id, 'pending');

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: '친구 요청을 찾을 수 없습니다' });
    }

    res.json({ ok: true, message: '친구 요청을 거절했습니다' });
  } catch (err) { serverError(res, err); }
});

// 친구 목록
app.get('/api/friends/list', requireAuth, (req, res) => {
  try {
    const friends = db.prepare(
      'SELECT friend_id, friend_username, created_at FROM friends WHERE user_id = ? ORDER BY friend_username ASC'
    ).all(req.user.id);
    res.json({ ok: true, data: friends });
  } catch (err) { serverError(res, err); }
});

// 친구 삭제
app.post('/api/friends/remove', requireAuth, rateLimit('friend_remove', 20), (req, res) => {
  try {
    const { friend_id } = req.body || {};
    const fid = parseInt(friend_id);
    if (!fid || fid <= 0) {
      return res.status(400).json({ ok: false, error: 'friend_id 필요' });
    }

    const deleteFriend = db.prepare(
      'DELETE FROM friends WHERE user_id = ? AND friend_id = ?'
    );

    // 양방향 친구 관계 삭제
    db.transaction(() => {
      deleteFriend.run(req.user.id, fid);
      deleteFriend.run(fid, req.user.id);
    })();

    res.json({ ok: true, message: '친구를 삭제했습니다' });
  } catch (err) { serverError(res, err); }
});

// ─── 메시징 시스템 ─────────────────────────────
const MAX_MESSAGE_LEN = 500;
const MAX_MESSAGES_PER_CONVERSATION = 200;

// 메시지 보내기
app.post('/api/messages/send', requireAuth, rateLimit('msg_send', 60), (req, res) => {
  try {
    const { to_username, message } = req.body || {};

    if (!to_username || typeof to_username !== 'string') {
      return res.status(400).json({ ok: false, error: '수신자 필요' });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ ok: false, error: '메시지 내용 필요' });
    }
    if (to_username === req.user.username) {
      return res.status(400).json({ ok: false, error: '자기 자신에게 메시지 불가' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get(to_username);
    if (!targetUser) {
      return res.status(400).json({ ok: false, error: '해당 닉네임 없음' });
    }

    // 친구인지 확인
    const isFriend = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?')
      .get(req.user.id, targetUser.id);
    if (!isFriend) {
      return res.status(403).json({ ok: false, error: '친구에게만 메시지를 보낼 수 있습니다' });
    }

    // 메시지 개수 제한 확인
    const msgCount = db.prepare(
      'SELECT COUNT(*) AS n FROM messages WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)'
    ).get(req.user.id, targetUser.id, targetUser.id, req.user.id).n;

    if (msgCount >= MAX_MESSAGES_PER_CONVERSATION) {
      return res.status(429).json({ ok: false, error: '대화 메시지가 너무 많습니다. 이전 메시지를 삭제해주세요.' });
    }

    // HTML 이스케이프
    const safeMessage = escapeHtml(String(message).slice(0, MAX_MESSAGE_LEN));

    db.prepare(
      'INSERT INTO messages (from_user_id, from_username, to_user_id, to_username, message) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, req.user.username, targetUser.id, targetUser.username, safeMessage);

    res.json({ ok: true, message: '메시지를 보냈습니다' });
  } catch (err) { serverError(res, err); }
});

// 특정 친구와의 대화 내역
app.get('/api/messages/conversation/:username', requireAuth, (req, res) => {
  try {
    const { username } = req.params;

    const targetUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!targetUser) {
      return res.status(400).json({ ok: false, error: '해당 닉네임 없음' });
    }

    // 친구인지 확인
    const isFriend = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?')
      .get(req.user.id, targetUser.id);
    if (!isFriend) {
      return res.status(403).json({ ok: false, error: '친구와만 대화를 볼 수 있습니다' });
    }

    // 대화 내역 조회
    const messages = db.prepare(`
      SELECT id, from_user_id, from_username, to_user_id, to_username, message, read, created_at
      FROM messages
      WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
      ORDER BY created_at ASC
      LIMIT ?
    `).all(req.user.id, targetUser.id, targetUser.id, req.user.id, MAX_MESSAGES_PER_CONVERSATION);

    // 받은 메시지를 읽음 처리
    db.prepare(
      'UPDATE messages SET read = 1 WHERE to_user_id = ? AND from_user_id = ? AND read = 0'
    ).run(req.user.id, targetUser.id);

    res.json({ ok: true, data: messages });
  } catch (err) { serverError(res, err); }
});

// 받은 메시지 목록 (최근 대화 상대)
app.get('/api/messages/inbox', requireAuth, (req, res) => {
  try {
    // 각 대화 상대의 가장 최근 메시지와 읽지 않은 메시지 수
    const conversations = db.prepare(`
      SELECT
        CASE
          WHEN m.from_user_id = ? THEN m.to_user_id
          ELSE m.from_user_id
        END AS other_user_id,
        CASE
          WHEN m.from_user_id = ? THEN m.to_username
          ELSE m.from_username
        END AS other_username,
        m.message AS last_message,
        m.created_at AS last_message_time,
        (SELECT COUNT(*) FROM messages WHERE to_user_id = ? AND from_user_id = (
          CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END
        ) AND read = 0) AS unread_count
      FROM messages m
      WHERE m.id IN (
        SELECT MAX(id)
        FROM messages
        WHERE from_user_id = ? OR to_user_id = ?
        GROUP BY
          CASE
            WHEN from_user_id = ? THEN to_user_id
            ELSE from_user_id
          END
      )
      ORDER BY m.created_at DESC
      LIMIT 50
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

    res.json({ ok: true, data: conversations });
  } catch (err) { serverError(res, err); }
});

// 읽지 않은 메시지 수
app.get('/api/messages/unread-count', requireAuth, (req, res) => {
  try {
    const count = db.prepare(
      'SELECT COUNT(*) AS n FROM messages WHERE to_user_id = ? AND read = 0'
    ).get(req.user.id).n;
    res.json({ ok: true, count });
  } catch (err) { serverError(res, err); }
});

// ─── 파티 시스템 ───────────────────────────────
const MAX_PARTY_SIZE = 4;

// 파티 생성
app.post('/api/party/create', requireAuth, rateLimit('party_create', 20), (req, res) => {
  try {
    const { party_name } = req.body || {};
    if (!party_name || typeof party_name !== 'string' || party_name.trim().length === 0) {
      return res.status(400).json({ ok: false, error: '파티 이름 필요' });
    }

    // 이미 파티에 속해 있는지 확인
    const existingParty = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (existingParty) {
      return res.status(400).json({ ok: false, error: '이미 파티에 속해 있습니다' });
    }

    const safeName = escapeHtml(String(party_name).slice(0, 30));

    // 트랜잭션으로 파티 생성 및 리더 추가
    const createParty = db.prepare(
      'INSERT INTO parties (party_name, leader_id, leader_username, max_members) VALUES (?, ?, ?, ?)'
    );
    const addMember = db.prepare(
      'INSERT INTO party_members (party_id, user_id, username) VALUES (?, ?, ?)'
    );

    const result = db.transaction(() => {
      const partyResult = createParty.run(safeName, req.user.id, req.user.username, MAX_PARTY_SIZE);
      const partyId = partyResult.lastInsertRowid;
      addMember.run(partyId, req.user.id, req.user.username);
      return partyId;
    })();

    res.json({ ok: true, party_id: result, message: '파티를 생성했습니다' });
  } catch (err) { serverError(res, err); }
});

// 내 파티 정보
app.get('/api/party/my', requireAuth, (req, res) => {
  try {
    const membership = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (!membership) {
      return res.json({ ok: true, party: null });
    }

    const party = db.prepare(
      'SELECT * FROM parties WHERE id = ?'
    ).get(membership.party_id);

    const members = db.prepare(
      'SELECT user_id, username, joined_at FROM party_members WHERE party_id = ? ORDER BY joined_at ASC'
    ).all(membership.party_id);

    res.json({ ok: true, party: { ...party, members } });
  } catch (err) { serverError(res, err); }
});

// 파티 초대
app.post('/api/party/invite', requireAuth, rateLimit('party_invite', 30), (req, res) => {
  try {
    const { to_username } = req.body || {};
    if (!to_username || typeof to_username !== 'string') {
      return res.status(400).json({ ok: false, error: '대상 닉네임 필요' });
    }

    // 내 파티 확인
    const myMembership = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (!myMembership) {
      return res.status(400).json({ ok: false, error: '파티에 속해 있지 않습니다' });
    }

    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(myMembership.party_id);

    // 파티장만 초대 가능
    if (party.leader_id !== req.user.id) {
      return res.status(403).json({ ok: false, error: '파티장만 초대할 수 있습니다' });
    }

    // 대상 유저 확인
    const targetUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get(to_username);
    if (!targetUser) {
      return res.status(400).json({ ok: false, error: '해당 닉네임 없음' });
    }

    // 이미 파티에 속해 있는지 확인
    const targetParty = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(targetUser.id);

    if (targetParty) {
      return res.status(400).json({ ok: false, error: '이미 다른 파티에 속해 있습니다' });
    }

    // 파티 인원 제한 확인
    const memberCount = db.prepare(
      'SELECT COUNT(*) AS n FROM party_members WHERE party_id = ?'
    ).get(myMembership.party_id).n;

    if (memberCount >= party.max_members) {
      return res.status(400).json({ ok: false, error: '파티 인원이 가득 찼습니다' });
    }

    // 이미 초대를 보냈는지 확인
    const existingInvite = db.prepare(
      'SELECT status FROM party_invites WHERE party_id = ? AND to_user_id = ?'
    ).get(myMembership.party_id, targetUser.id);

    if (existingInvite && existingInvite.status === 'pending') {
      return res.status(400).json({ ok: false, error: '이미 초대를 보냈습니다' });
    }

    // 초대 생성 또는 업데이트
    if (existingInvite) {
      db.prepare(
        'UPDATE party_invites SET status = ?, created_at = strftime(\'%s\',\'now\') WHERE party_id = ? AND to_user_id = ?'
      ).run('pending', myMembership.party_id, targetUser.id);
    } else {
      db.prepare(
        'INSERT INTO party_invites (party_id, from_user_id, from_username, to_user_id, to_username) VALUES (?, ?, ?, ?, ?)'
      ).run(myMembership.party_id, req.user.id, req.user.username, targetUser.id, targetUser.username);
    }

    res.json({ ok: true, message: '파티 초대를 보냈습니다' });
  } catch (err) { serverError(res, err); }
});

// 받은 파티 초대 목록
app.get('/api/party/invites', requireAuth, (req, res) => {
  try {
    const invites = db.prepare(`
      SELECT pi.id, pi.party_id, pi.from_username, p.party_name, p.leader_username, pi.created_at,
             (SELECT COUNT(*) FROM party_members WHERE party_id = pi.party_id) AS member_count
      FROM party_invites pi
      JOIN parties p ON pi.party_id = p.id
      WHERE pi.to_user_id = ? AND pi.status = ?
      ORDER BY pi.created_at DESC
    `).all(req.user.id, 'pending');

    res.json({ ok: true, data: invites });
  } catch (err) { serverError(res, err); }
});

// 파티 초대 수락
app.post('/api/party/accept', requireAuth, rateLimit('party_accept', 30), (req, res) => {
  try {
    const { invite_id } = req.body || {};
    const id = parseInt(invite_id);
    if (!id || id <= 0) {
      return res.status(400).json({ ok: false, error: 'invite_id 필요' });
    }

    // 이미 파티에 속해 있는지 확인
    const myParty = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (myParty) {
      return res.status(400).json({ ok: false, error: '이미 파티에 속해 있습니다. 먼저 탈퇴하세요.' });
    }

    const invite = db.prepare(
      'SELECT * FROM party_invites WHERE id = ? AND to_user_id = ? AND status = ?'
    ).get(id, req.user.id, 'pending');

    if (!invite) {
      return res.status(404).json({ ok: false, error: '초대를 찾을 수 없습니다' });
    }

    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(invite.party_id);

    // 파티 인원 확인
    const memberCount = db.prepare(
      'SELECT COUNT(*) AS n FROM party_members WHERE party_id = ?'
    ).get(invite.party_id).n;

    if (memberCount >= party.max_members) {
      return res.status(400).json({ ok: false, error: '파티 인원이 가득 찼습니다' });
    }

    // 트랜잭션으로 처리
    const addMember = db.prepare(
      'INSERT INTO party_members (party_id, user_id, username) VALUES (?, ?, ?)'
    );
    const updateInvite = db.prepare(
      'UPDATE party_invites SET status = ? WHERE id = ?'
    );

    db.transaction(() => {
      addMember.run(invite.party_id, req.user.id, req.user.username);
      updateInvite.run('accepted', id);
    })();

    res.json({ ok: true, message: '파티에 참가했습니다' });
  } catch (err) { serverError(res, err); }
});

// 파티 초대 거절
app.post('/api/party/reject', requireAuth, rateLimit('party_reject', 30), (req, res) => {
  try {
    const { invite_id } = req.body || {};
    const id = parseInt(invite_id);
    if (!id || id <= 0) {
      return res.status(400).json({ ok: false, error: 'invite_id 필요' });
    }

    const result = db.prepare(
      'UPDATE party_invites SET status = ? WHERE id = ? AND to_user_id = ? AND status = ?'
    ).run('rejected', id, req.user.id, 'pending');

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: '초대를 찾을 수 없습니다' });
    }

    res.json({ ok: true, message: '초대를 거절했습니다' });
  } catch (err) { serverError(res, err); }
});

// 파티 탈퇴
app.post('/api/party/leave', requireAuth, rateLimit('party_leave', 20), (req, res) => {
  try {
    const membership = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (!membership) {
      return res.status(400).json({ ok: false, error: '파티에 속해 있지 않습니다' });
    }

    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(membership.party_id);

    // 파티장이 탈퇴하면 파티 해체
    if (party.leader_id === req.user.id) {
      db.prepare('DELETE FROM parties WHERE id = ?').run(membership.party_id);
      res.json({ ok: true, message: '파티를 해체했습니다' });
    } else {
      db.prepare('DELETE FROM party_members WHERE party_id = ? AND user_id = ?')
        .run(membership.party_id, req.user.id);
      res.json({ ok: true, message: '파티에서 탈퇴했습니다' });
    }
  } catch (err) { serverError(res, err); }
});

// 파티원 추방 (파티장만 가능)
app.post('/api/party/kick', requireAuth, rateLimit('party_kick', 20), (req, res) => {
  try {
    const { user_id } = req.body || {};
    const targetId = parseInt(user_id);
    if (!targetId || targetId <= 0) {
      return res.status(400).json({ ok: false, error: 'user_id 필요' });
    }

    const membership = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (!membership) {
      return res.status(400).json({ ok: false, error: '파티에 속해 있지 않습니다' });
    }

    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(membership.party_id);

    if (party.leader_id !== req.user.id) {
      return res.status(403).json({ ok: false, error: '파티장만 추방할 수 있습니다' });
    }

    if (targetId === req.user.id) {
      return res.status(400).json({ ok: false, error: '자기 자신은 추방할 수 없습니다' });
    }

    const result = db.prepare(
      'DELETE FROM party_members WHERE party_id = ? AND user_id = ?'
    ).run(membership.party_id, targetId);

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: '파티원을 찾을 수 없습니다' });
    }

    res.json({ ok: true, message: '파티원을 추방했습니다' });
  } catch (err) { serverError(res, err); }
});

// ─── 레이드 시스템 ─────────────────────────────
// 레이드 보스 목록 (이름, 최대 HP, 골드 보상, 아이템 드랍)
const RAID_BOSSES = {
  'ancient_dragon': { name: '고대 드래곤', maxHp: 100000, goldReward: 50000, items: [] },
  'demon_lord': { name: '마왕', maxHp: 150000, goldReward: 75000, items: [] },
  'titan_golem': { name: '타이탄 골렘', maxHp: 80000, goldReward: 40000, items: [] },
  'void_kraken': { name: '공허 크라켄', maxHp: 120000, goldReward: 60000, items: [] },
};

// 레이드 시작 (파티장만 가능)
app.post('/api/raid/start', requireAuth, rateLimit('raid_start', 10), (req, res) => {
  try {
    const { boss_key } = req.body || {};

    if (!boss_key || !RAID_BOSSES[boss_key]) {
      return res.status(400).json({ ok: false, error: '유효하지 않은 보스' });
    }

    // 파티 확인
    const membership = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (!membership) {
      return res.status(400).json({ ok: false, error: '파티에 속해 있지 않습니다' });
    }

    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(membership.party_id);

    // 파티장 확인
    if (party.leader_id !== req.user.id) {
      return res.status(403).json({ ok: false, error: '파티장만 레이드를 시작할 수 있습니다' });
    }

    // 진행 중인 레이드 확인
    const activeRaid = db.prepare(
      'SELECT id FROM raid_sessions WHERE party_id = ? AND status = ?'
    ).get(membership.party_id, 'active');

    if (activeRaid) {
      return res.status(400).json({ ok: false, error: '이미 진행 중인 레이드가 있습니다' });
    }

    const boss = RAID_BOSSES[boss_key];

    // 레이드 생성
    const result = db.prepare(
      'INSERT INTO raid_sessions (party_id, boss_name, boss_max_hp, boss_current_hp) VALUES (?, ?, ?, ?)'
    ).run(membership.party_id, boss.name, boss.maxHp, boss.maxHp);

    const raidId = result.lastInsertRowid;

    // 파티원들의 기여도 초기화
    const members = db.prepare(
      'SELECT user_id, username FROM party_members WHERE party_id = ?'
    ).all(membership.party_id);

    const initContrib = db.prepare(
      'INSERT INTO raid_contributions (raid_id, user_id, username) VALUES (?, ?, ?)'
    );

    members.forEach(member => {
      initContrib.run(raidId, member.user_id, member.username);
    });

    res.json({
      ok: true,
      raid_id: raidId,
      boss: { ...boss, key: boss_key, currentHp: boss.maxHp },
      message: `${boss.name} 레이드를 시작했습니다!`
    });
  } catch (err) { serverError(res, err); }
});

// 레이드 상태 조회
app.get('/api/raid/status', requireAuth, (req, res) => {
  try {
    const membership = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (!membership) {
      return res.json({ ok: true, raid: null });
    }

    const raid = db.prepare(
      'SELECT * FROM raid_sessions WHERE party_id = ? AND status = ?'
    ).get(membership.party_id, 'active');

    if (!raid) {
      return res.json({ ok: true, raid: null });
    }

    const contributions = db.prepare(
      'SELECT user_id, username, damage_dealt, attacks_count FROM raid_contributions WHERE raid_id = ? ORDER BY damage_dealt DESC'
    ).all(raid.id);

    res.json({
      ok: true,
      raid: {
        ...raid,
        contributions,
        progressPercent: Math.round((1 - raid.boss_current_hp / raid.boss_max_hp) * 100)
      }
    });
  } catch (err) { serverError(res, err); }
});

// 레이드 공격
app.post('/api/raid/attack', requireAuth, rateLimit('raid_attack', 100), (req, res) => {
  try {
    const { damage } = req.body || {};
    const dmg = Math.max(0, Math.min(100000, parseInt(damage) || 0));

    if (dmg <= 0) {
      return res.status(400).json({ ok: false, error: '유효하지 않은 데미지' });
    }

    // 파티 및 레이드 확인
    const membership = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (!membership) {
      return res.status(400).json({ ok: false, error: '파티에 속해 있지 않습니다' });
    }

    const raid = db.prepare(
      'SELECT * FROM raid_sessions WHERE party_id = ? AND status = ?'
    ).get(membership.party_id, 'active');

    if (!raid) {
      return res.status(400).json({ ok: false, error: '진행 중인 레이드가 없습니다' });
    }

    // 실제 데미지 계산 (보스 HP를 초과하지 않도록)
    const actualDamage = Math.min(dmg, raid.boss_current_hp);
    const newHp = raid.boss_current_hp - actualDamage;

    // 트랜잭션으로 처리
    const updateRaid = db.prepare(
      'UPDATE raid_sessions SET boss_current_hp = ? WHERE id = ?'
    );
    const updateContrib = db.prepare(
      'UPDATE raid_contributions SET damage_dealt = damage_dealt + ?, attacks_count = attacks_count + 1 WHERE raid_id = ? AND user_id = ?'
    );

    db.transaction(() => {
      updateRaid.run(newHp, raid.id);
      updateContrib.run(actualDamage, raid.id, req.user.id);
    })();

    // 보스 처치 확인
    if (newHp <= 0) {
      // 레이드 완료 처리
      db.prepare(
        'UPDATE raid_sessions SET status = ?, completed_at = strftime(\'%s\',\'now\') WHERE id = ?'
      ).run('completed', raid.id);

      // 보상 계산 및 분배
      const contributions = db.prepare(
        'SELECT user_id, username, damage_dealt FROM raid_contributions WHERE raid_id = ?'
      ).all(raid.id);

      const totalDamage = contributions.reduce((sum, c) => sum + c.damage_dealt, 0);
      const bossKey = Object.keys(RAID_BOSSES).find(k => RAID_BOSSES[k].name === raid.boss_name);
      const boss = bossKey ? RAID_BOSSES[bossKey] : { goldReward: 10000 };

      const insertReward = db.prepare(
        'INSERT INTO raid_rewards (raid_id, user_id, username, gold) VALUES (?, ?, ?, ?)'
      );

      contributions.forEach(contrib => {
        const contribution = totalDamage > 0 ? contrib.damage_dealt / totalDamage : 1 / contributions.length;
        const gold = Math.floor(boss.goldReward * contribution);
        insertReward.run(raid.id, contrib.user_id, contrib.username, gold);
      });

      res.json({
        ok: true,
        boss_defeated: true,
        damage: actualDamage,
        message: `${raid.boss_name}을(를) 처치했습니다!`,
        raid_id: raid.id
      });
    } else {
      res.json({
        ok: true,
        boss_defeated: false,
        damage: actualDamage,
        remaining_hp: newHp,
        progress: Math.round((1 - newHp / raid.boss_max_hp) * 100)
      });
    }
  } catch (err) { serverError(res, err); }
});

// 레이드 보상 조회
app.get('/api/raid/rewards', requireAuth, (req, res) => {
  try {
    const rewards = db.prepare(
      'SELECT r.*, rs.boss_name, rs.completed_at FROM raid_rewards r JOIN raid_sessions rs ON r.raid_id = rs.id WHERE r.user_id = ? AND r.claimed = 0 ORDER BY r.created_at DESC LIMIT 20'
    ).all(req.user.id);

    res.json({ ok: true, data: rewards });
  } catch (err) { serverError(res, err); }
});

// 레이드 보상 수령
app.post('/api/raid/claim', requireAuth, rateLimit('raid_claim', 30), (req, res) => {
  try {
    const { reward_id } = req.body || {};
    const id = parseInt(reward_id);

    if (!id || id <= 0) {
      return res.status(400).json({ ok: false, error: 'reward_id 필요' });
    }

    const reward = db.prepare(
      'SELECT * FROM raid_rewards WHERE id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!reward) {
      return res.status(404).json({ ok: false, error: '보상을 찾을 수 없습니다' });
    }

    if (reward.claimed) {
      return res.status(400).json({ ok: false, error: '이미 수령한 보상입니다' });
    }

    db.prepare('UPDATE raid_rewards SET claimed = 1 WHERE id = ?').run(id);

    res.json({
      ok: true,
      reward: {
        gold: reward.gold,
        item_key: reward.item_key,
        item_qty: reward.item_qty
      },
      message: `보상을 수령했습니다! 골드 +${reward.gold}G`
    });
  } catch (err) { serverError(res, err); }
});

// 레이드 포기 (파티장만 가능)
app.post('/api/raid/abandon', requireAuth, rateLimit('raid_abandon', 10), (req, res) => {
  try {
    const membership = db.prepare(
      'SELECT party_id FROM party_members WHERE user_id = ?'
    ).get(req.user.id);

    if (!membership) {
      return res.status(400).json({ ok: false, error: '파티에 속해 있지 않습니다' });
    }

    const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(membership.party_id);

    if (party.leader_id !== req.user.id) {
      return res.status(403).json({ ok: false, error: '파티장만 레이드를 포기할 수 있습니다' });
    }

    const raid = db.prepare(
      'SELECT id FROM raid_sessions WHERE party_id = ? AND status = ?'
    ).get(membership.party_id, 'active');

    if (!raid) {
      return res.status(400).json({ ok: false, error: '진행 중인 레이드가 없습니다' });
    }

    db.prepare(
      'UPDATE raid_sessions SET status = ?, completed_at = strftime(\'%s\',\'now\') WHERE id = ?'
    ).run('abandoned', raid.id);

    res.json({ ok: true, message: '레이드를 포기했습니다' });
  } catch (err) { serverError(res, err); }
});

// ─── 서버 시작 ─────────────────────────────────
const PORT = process.env.PORT || 3030;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on ${PORT}`);
});
