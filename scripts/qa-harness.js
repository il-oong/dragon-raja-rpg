#!/usr/bin/env node
// QA 하네스 — game/engine.js 를 실제 실행해 런타임 에러/비정상 수치를 탐지.
// 사용법: node scripts/qa-harness.js [scenario]
//   scenarios: smoke | combat | quest | time | library | boss | passive | all

const D = require('../game/data.js');
const { Game } = require('../game/engine.js');

const logs = [];
function newGame(opts = {}) {
  const lines = [];
  const g = new Game((t, kind) => lines.push({ t, kind }));
  // createChar 은 직접 호출 (newGame 은 입력 대기 프롬프트)
  g.state = null;
  g.awaiting = null;
  g.combat = null;
  g.trial = null;
  g.createChar(opts.name || 'TestHero', opts.race || 'human', opts.job || 'warrior');
  return { g, lines };
}

const scenarios = {};

scenarios.smoke = () => {
  const { g, lines } = newGame();
  const errs = [];
  const check = (name, val) => {
    if (!Number.isFinite(val)) errs.push(`${name} = ${val} (NaN/Infinity)`);
  };
  check('getAtk', g.getAtk());
  check('getDef', g.getDef());
  check('getMag', g.getMag());
  check('getHpMax', g.getHpMax());
  check('getMpMax', g.getMpMax());
  check('expForNext', g.expForNext(1));
  if (typeof g.getCritRate === 'function') check('getCritRate', g.getCritRate());
  if (typeof g.getEvaRate === 'function') check('getEvaRate', g.getEvaRate());
  return { ok: errs.length === 0, errs, info: { lines: lines.length } };
};

scenarios.combat = () => {
  const { g, lines } = newGame();
  const errs = [];
  try {
    g.state.location = 'heltant';
    // 탐험 시도 — 몬스터 조우 가능
    let combats = 0;
    for (let i = 0; i < 30 && combats < 3; i++) {
      g.runCommand('explore');
      if (g.combat) {
        combats++;
        // 스킬/공격 루프
        let turns = 0;
        while (g.combat && turns < 40) {
          try {
            g.runCommand('attack');
          } catch (e) { errs.push(`combat loop error: ${e.message}`); break; }
          turns++;
        }
        if (!g.combat) {
          // 이겼는지 졌는지 판정
          if (g.state.hp <= 0) errs.push('hp<=0 after combat');
        }
      }
    }
    if (combats === 0) errs.push('no combats triggered in 30 explores');
    if (!Number.isFinite(g.state.gold) || g.state.gold < 0) errs.push(`gold broken: ${g.state.gold}`);
    if (!Number.isFinite(g.state.exp)) errs.push(`exp broken: ${g.state.exp}`);
  } catch (e) { errs.push('fatal: ' + (e.stack || e.message)); }
  return { ok: errs.length === 0, errs, info: { finalLv: g.state && g.state.lv, gold: g.state && g.state.gold, lines: lines.length } };
};

scenarios.passive = () => {
  // 모든 직업의 passive 스킬 id 를 전부 skills 에 넣고 각 stat getter 가 NaN 이 아닌지.
  const { g } = newGame();
  const errs = [];
  try {
    for (const jk of Object.keys(D.JOBS)) {
      for (const sk of (D.JOBS[jk].skills || [])) {
        if (sk.type === 'passive' || sk.type === 'buff' || sk.type === 'utility') {
          if (!g.state.skills.includes(sk.id)) g.state.skills.push(sk.id);
        }
      }
    }
    // getter 호출해 안 터지는지
    const atk = g.getAtk(), def = g.getDef(), mag = g.getMag(), hp = g.getHpMax(), mp = g.getMpMax();
    if (!Number.isFinite(atk)) errs.push('ATK NaN with all passives');
    if (!Number.isFinite(def)) errs.push('DEF NaN with all passives');
    if (!Number.isFinite(mag)) errs.push('MAG NaN with all passives');
    if (!Number.isFinite(hp)) errs.push('HP NaN with all passives');
    if (!Number.isFinite(mp)) errs.push('MP NaN with all passives');
    // 패시브 적용 경로가 있는지 코드 스캔 (간접 검증)
    const engineSrc = require('fs').readFileSync(__dirname + '/../game/engine.js', 'utf-8');
    const touched = (re) => re.test(engineSrc);
    const usage = {
      ATK: touched(/racePassive\(\)|passiveStats|buffsPersistent/),
      hasBuff: touched(/buffsPersistent|hasSkill/),
    };
    return { ok: errs.length === 0, errs, info: { atk, def, mag, hp, mp, usage } };
  } catch (e) { errs.push('fatal: ' + (e.stack || e.message)); return { ok: false, errs }; }
};

scenarios.quest = () => {
  const errs = [];
  const idsChecked = [];
  try {
    for (const [id, q] of Object.entries(D.QUESTS)) {
      idsChecked.push(id);
      if (!q.name) errs.push(`${id}: no name`);
      if (!q.target) errs.push(`${id}: no target`);
      else {
        if (q.target.monster && !D.MONSTERS[q.target.monster]) errs.push(`${id}: target.monster '${q.target.monster}' 없음`);
        if (q.target.item && !D.ITEMS[q.target.item]) errs.push(`${id}: target.item '${q.target.item}' 없음`);
        if (q.target.count && !Number.isFinite(q.target.count)) errs.push(`${id}: target.count NaN`);
      }
      if (q.reward) {
        if (q.reward.gold && !Number.isFinite(q.reward.gold)) errs.push(`${id}: reward.gold NaN`);
        if (q.reward.exp && !Number.isFinite(q.reward.exp)) errs.push(`${id}: reward.exp NaN`);
        if (q.reward.item && !D.ITEMS[q.reward.item]) errs.push(`${id}: reward.item '${q.reward.item}' 없음`);
      }
      if (q.next && !D.QUESTS[q.next]) errs.push(`${id}: next '${q.next}' 없음`);
      if (q.requireLv && !Number.isFinite(q.requireLv)) errs.push(`${id}: requireLv NaN`);
      if (q.timeBand) {
        const bands = Array.isArray(q.timeBand) ? q.timeBand : [q.timeBand];
        for (const b of bands) {
          if (!['새벽','낮','황혼','밤'].includes(b)) errs.push(`${id}: timeBand '${b}' 알 수 없음`);
        }
      }
    }
  } catch (e) { errs.push('fatal: ' + (e.stack || e.message)); }
  return { ok: errs.length === 0, errs, info: { totalQuests: idsChecked.length } };
};

scenarios.time = () => {
  const { g, lines } = newGame();
  const errs = [];
  try {
    for (let i = 0; i < 100; i++) g.advanceTime(1);
    const band = typeof g.getTimeBand === 'function' ? g.getTimeBand() : null;
    if (band && !['새벽','낮','황혼','밤'].includes(band)) errs.push(`unknown band: ${band}`);
    if (g.state.time.day < 4) errs.push(`day not advancing: ${g.state.time.day}`);
    if (g.state.time.hour < 0 || g.state.time.hour >= 24) errs.push(`hour out of range: ${g.state.time.hour}`);
  } catch (e) { errs.push('fatal: ' + (e.stack || e.message)); }
  return { ok: errs.length === 0, errs, info: { day: g.state.time.day, hour: g.state.time.hour } };
};

scenarios.library = () => {
  const errs = [];
  try {
    // LIBRARIES 정의된 도시 수련장에서 tryLibraryDiscovery 류가 동작하는지 데이터만 확인
    for (const [loc, lib] of Object.entries(D.LIBRARIES)) {
      if (!D.LOCATIONS[loc]) errs.push(`LIBRARIES.${loc} 에 해당하는 LOCATIONS 없음`);
      if (!lib.pool || Object.keys(lib.pool).length === 0) errs.push(`${loc}: pool 비어있음`);
      const sumW = Object.values(lib.pool).reduce((a, b) => a + b, 0);
      if (sumW <= 0) errs.push(`${loc}: pool 가중치 합 0`);
      for (const g of Object.keys(lib.pool)) {
        if (!D.SKILL_GRADES[g]) errs.push(`${loc}: pool 에 알 수 없는 등급 '${g}'`);
      }
    }
  } catch (e) { errs.push('fatal: ' + (e.stack || e.message)); }
  return { ok: errs.length === 0, errs, info: { libraries: Object.keys(D.LIBRARIES).length } };
};

scenarios.boss = () => {
  const errs = [];
  try {
    let bossCount = 0, phasedBoss = 0;
    for (const [k, m] of Object.entries(D.MONSTERS)) {
      if (m.boss || m.hp > 1500) bossCount++;
      if (m.phases && Array.isArray(m.phases)) {
        phasedBoss++;
        for (const ph of m.phases) {
          if (typeof ph.at !== 'number' && typeof ph.threshold !== 'number') {
            errs.push(`${k}: phase without 'at' or 'threshold'`);
          }
        }
      }
    }
    return { ok: errs.length === 0, errs, info: { bossCount, phasedBoss } };
  } catch (e) { errs.push('fatal: ' + (e.stack || e.message)); return { ok: false, errs }; }
};

scenarios.all = () => {
  const out = {};
  let ok = true;
  for (const k of Object.keys(scenarios).filter(n => n !== 'all')) {
    const r = scenarios[k]();
    out[k] = r;
    if (!r.ok) ok = false;
  }
  return { ok, out };
};

const name = process.argv[2] || 'all';
if (!scenarios[name]) {
  console.error('Unknown scenario:', name, '\nAvailable:', Object.keys(scenarios).join(', '));
  process.exit(2);
}
const result = scenarios[name]();
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
