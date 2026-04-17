// Dragon Raja RPG 멀티플레이 서버 (Railway + SQLite)
// Phase 1: 계정 · 클라우드 세이브 · 리더보드 · 우편함

const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ─── DB 준비 ────────────────────────────────────
// Railway Persistent Volume mount point: /data (기본). 없으면 로컬 ./data.
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data'));
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'game.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
console.log('[DB] Using', DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    token TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

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
    updated_at INTEGER DEFAULT (strftime('%s','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_lb_level ON leaderboard(level DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_gold  ON leaderboard(gold DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_boss  ON leaderboard(bosses_killed DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_trade ON leaderboard(total_trade_profit DESC);
  CREATE INDEX IF NOT EXISTS idx_lb_mastery ON leaderboard(mastered_lines DESC);

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
  CREATE INDEX IF NOT EXISTS idx_mail_inbox ON mails(to_user, claimed);
`);

// ─── Express ───────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// 기본 /healthz 엔드포인트 (Railway가 healthcheck)
app.get('/', (req, res) => res.json({ ok: true, name: 'dragon-raja-server', time: Date.now() }));
app.get('/healthz', (req, res) => res.json({ ok: true }));

// 인증 미들웨어
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ ok: false, error: '토큰 없음' });
  const user = db.prepare('SELECT id, username FROM users WHERE token = ?').get(token);
  if (!user) return res.status(401).json({ ok: false, error: '유효하지 않은 토큰' });
  req.user = user;
  next();
}

function makeToken() {
  return (Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 40);
}

// ─── 회원가입 / 로그인 ─────────────────────────
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || typeof username !== 'string' || username.length < 2 || username.length > 20) {
      return res.status(400).json({ ok: false, error: '닉네임 2~20자' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ ok: false, error: '비밀번호 4자 이상' });
    }
    const hash = bcrypt.hashSync(password, 8);
    const token = makeToken();
    db.prepare('INSERT INTO users (username, password_hash, token) VALUES (?, ?, ?)')
      .run(username, hash, token);
    res.json({ ok: true, token, username });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ ok: false, error: '이미 존재하는 닉네임' });
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ ok: false, error: '아이디/비밀번호 틀림' });
    }
    const token = makeToken();
    db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, user.id);
    res.json({ ok: true, token, username: user.username });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 클라우드 세이브 ───────────────────────────
app.post('/api/cloud/save', requireAuth, (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') return res.status(400).json({ ok: false, error: '데이터 필요' });
    const json = JSON.stringify(payload);
    db.prepare(`
      INSERT INTO cloud_saves (user_id, data, updated_at) VALUES (?, ?, strftime('%s','now'))
      ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(req.user.id, json);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.get('/api/cloud/load', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT data, updated_at FROM cloud_saves WHERE user_id = ?').get(req.user.id);
    res.json({ ok: true, data: row ? JSON.parse(row.data) : null, updatedAt: row?.updated_at || null });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ─── 리더보드 ──────────────────────────────────
app.post('/api/leaderboard/update', requireAuth, (req, res) => {
  try {
    const { level, gold, job, bosses_killed, total_trade_profit, mastered_lines } = req.body || {};
    db.prepare(`
      INSERT INTO leaderboard (user_id, username, level, gold, job, bosses_killed, total_trade_profit, mastered_lines, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        level = excluded.level,
        gold = excluded.gold,
        job = excluded.job,
        bosses_killed = excluded.bosses_killed,
        total_trade_profit = excluded.total_trade_profit,
        mastered_lines = excluded.mastered_lines,
        updated_at = excluded.updated_at
    `).run(
      req.user.id, req.user.username,
      Math.max(1, parseInt(level) || 1),
      Math.max(0, parseInt(gold) || 0),
      String(job || ''),
      Math.max(0, parseInt(bosses_killed) || 0),
      Math.max(0, parseInt(total_trade_profit) || 0),
      Math.max(0, parseInt(mastered_lines) || 0)
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

const LB_COLS = ['level', 'gold', 'bosses_killed', 'total_trade_profit', 'mastered_lines'];
app.get('/api/leaderboard/top', (req, res) => {
  try {
    const type = (req.query.type || 'level').toString();
    if (!LB_COLS.includes(type)) return res.status(400).json({ ok: false, error: `type: ${LB_COLS.join('/')}` });
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const rows = db.prepare(`SELECT username, level, gold, job, bosses_killed, total_trade_profit, mastered_lines FROM leaderboard ORDER BY ${type} DESC, updated_at ASC LIMIT ?`).all(limit);
    res.json({ ok: true, type, data: rows });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ─── 우편함 ────────────────────────────────────
app.post('/api/mail/send', requireAuth, (req, res) => {
  try {
    const { to_user, subject, message, gold, item_key, item_qty } = req.body || {};
    if (!to_user) return res.status(400).json({ ok: false, error: '수신자 필요' });
    if (to_user === req.user.username) return res.status(400).json({ ok: false, error: '자기 자신에게 불가' });
    const tu = db.prepare('SELECT id FROM users WHERE username = ?').get(to_user);
    if (!tu) return res.status(400).json({ ok: false, error: '해당 닉네임 없음' });
    const g = Math.max(0, parseInt(gold) || 0);
    const q = Math.max(0, parseInt(item_qty) || 0);
    if (g > 10000000) return res.status(400).json({ ok: false, error: '1회 최대 1천만 G' });
    if (q > 9999) return res.status(400).json({ ok: false, error: '1회 최대 9999개' });
    db.prepare('INSERT INTO mails (from_user, to_user, subject, message, gold, item_key, item_qty) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.user.username, to_user, String(subject || '').slice(0, 40), String(message || '').slice(0, 500),
           g, item_key ? String(item_key).slice(0, 40) : null, q);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.get('/api/mail/inbox', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`SELECT id, from_user, subject, message, gold, item_key, item_qty, created_at FROM mails WHERE to_user = ? AND claimed = 0 ORDER BY created_at DESC LIMIT 50`).all(req.user.username);
    res.json({ ok: true, data: rows });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/mail/claim', requireAuth, (req, res) => {
  try {
    const { mail_id } = req.body || {};
    if (!mail_id) return res.status(400).json({ ok: false, error: 'mail_id 필요' });
    const mail = db.prepare('SELECT * FROM mails WHERE id = ? AND to_user = ?').get(mail_id, req.user.username);
    if (!mail) return res.status(404).json({ ok: false, error: '메일 없음' });
    if (mail.claimed) return res.status(400).json({ ok: false, error: '이미 수령' });
    const r = db.prepare('UPDATE mails SET claimed = 1 WHERE id = ? AND claimed = 0').run(mail_id);
    if (r.changes === 0) return res.status(400).json({ ok: false, error: '수령 실패' });
    res.json({ ok: true, mail });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ─── 서버 시작 ─────────────────────────────────
const PORT = process.env.PORT || 3030;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on ${PORT}`);
});
