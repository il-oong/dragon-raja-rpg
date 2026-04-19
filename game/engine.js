const __DATA__ = (typeof require === 'function')
  ? require('./data.js')
  : (typeof window !== 'undefined' ? window.__GAME_DATA__ : globalThis.__GAME_DATA__);
const { RACES, JOBS, LOCATIONS, MONSTERS, ITEMS, SHOP_ITEMS, QUESTS, ADVANCE_NPC, BASE_STATS, TRADE_GOODS, TRADE_PRICES, TRADE_BUY_MARKUP, TRADE_SELL_TAX, TRADE_SKILLS, AWAKENINGS, PROPERTIES, MERCENARIES, ENHANCEMENT, CASINO, GOURMET, TITLES, PETS, CARRIAGE_PRICE, TRAINING_HALLS, TRAIN_SKILLS, COMBO_SKILLS,
        learnSkill, findSkillById, LIBRARIES, SKILL_GRADES } = __DATA__;
// 별칭 — cUse 등 메서드 내부에서 짧게 호출.
const findSkillByIdLocal = findSkillById;

const rnd = (n) => Math.floor(Math.random() * n);
const chance = (p) => Math.random() < p;

class Game {
  constructor(out) {
    this.out = out;
    this.state = null;
    this.awaiting = null;
    this.combat = null;
    this.trial = null;       // 깨달음 시련 상태
  }

  // ════════════════ 캐릭터 생성 ════════════════
  newGame() {
    this.state = null;
    this.out('드래곤 라자 세계관으로 들어갑니다...\n', 'title');
    this.out('─────────────────────────────────────────');
    const { WORLD } = require('./data.js');
    this.out(WORLD.intro);
    this.out('─────────────────────────────────────────');
    this.out('\n[캐릭터 이름을 입력하세요] (예: 후치)');
    this.awaiting = 'name';
  }

  handleInput(text) {
    text = text.trim();
    if (!text) return;

    if (this.awaiting === 'name') {
      if (text.length > 12) { this.out('이름은 12자 이하로.'); return; }
      this.tmpName = text;
      this.awaiting = 'race';
      this.out(`\n반갑다, ${text}.`);
      this.out('\n[종족을 선택하라]');
      Object.entries(RACES).forEach(([k, r]) => {
        const m = r.mod, sign = v => (v >= 0 ? '+' : '') + v;
        this.out(`  ${k.padEnd(9)} ${r.name.padEnd(5)} 힘${sign(m.str)} 민${sign(m.dex)} 지${sign(m.int)} 체${sign(m.vit)} 혜${sign(m.wis)} 행${sign(m.luk)} 매${sign(m.cha)}`);
        this.out(`            ${r.desc}`);
      });
      this.out('\n> race <키>');
      return;
    }
    if (this.awaiting === 'race') {
      const key = text.replace(/^race\s+/i, '').trim();
      if (!RACES[key]) { this.out('없는 종족.'); return; }
      this.tmpRace = key;
      this.awaiting = 'job';
      this.out(`${RACES[key].name} 결정.`);
      this.out('\n[직업 선택 — 1차]');
      Object.entries(JOBS).filter(([, j]) => j.tier === 1).forEach(([k, j]) => {
        this.out(`  ${k.padEnd(9)} ${j.name.padEnd(5)} — ${j.desc}`);
        this.out(`            HP${j.base.hp} MP${j.base.mp} ATK${j.base.atk} DEF${j.base.def} MAG${j.base.mag} [주스탯: ${j.mainStats.join('/')}]`);
      });
      this.out('\n> job <키>');
      return;
    }
    if (this.awaiting === 'job') {
      const key = text.replace(/^job\s+/i, '').trim();
      if (!JOBS[key] || JOBS[key].tier !== 1) { this.out('1차 직업만.'); return; }
      if (JOBS[key].raceOnly && JOBS[key].raceOnly !== this.tmpRace) {
        this.out(`${JOBS[key].name}은 ${RACES[JOBS[key].raceOnly].name} 전용 직업.`);
        return;
      }
      this.createChar(this.tmpName, this.tmpRace, key);
      return;
    }

    // 전투 중이면 전투 입력 우선 (시련 전투여서 this.trial 도 true 일 수 있으므로
    // combat 체크를 trial 앞에 둔다. 이 순서가 바뀌면 시련 2단계 전투 중 입력이
    // trialInput 으로 가서 meditation 스테이지가 아니라는 이유로 조용히 버려지며
    // 게임이 "멈춘 것처럼" 보인다.)
    if (this.combat) { this.combatInput(text); return; }

    // 깨달음 시련 입력 처리 (meditation 단계)
    if (this.trial) { this.trialInput(text); return; }

    this.awaiting = null;
    this.runCommand(text);
  }

  createChar(name, raceKey, jobKey) {
    const race = RACES[raceKey], job = JOBS[jobKey];
    const stats = {};
    ['str','dex','int','vit','wis','luk','cha'].forEach(k => {
      stats[k] = BASE_STATS[k] + (race.mod[k] || 0);
    });
    this.state = {
      name, race: raceKey, job: jobKey, jobs: [jobKey],
      lv: 1, exp: 0, gold: 50,
      stats, pendingPoints: 0,
      hpMaxBase: job.base.hp, mpMaxBase: job.base.mp,
      hp: 0, mp: 0,
      atkBase: job.base.atk, defBase: job.base.def, magBase: job.base.mag,
      location: 'heltant',
      equip: { weapon: null, armor: null, acc: null },
      inv: { potion_s: 3 },
      tradeInv: {},          // 무역 상품
      skills: [],
      skillsDeactivated: [],
      quests: {}, killCount: {}, flags: {},
      buffsPersistent: {},
      time: { day: 1, hour: 6 },
      completedTrials: {},
      enhancement: { weapon: 0, armor: 0 },
      properties: {},
      mercs: [],
      eaten: {},
      title: null,
      pet: null,
      trainedMinutes: 0,
      trainedSkills: [],
      tradeBook: {},
      totalTradeProfit: 0,
      tradeSkills: [],
      masteredLines: [],
      playTimeSec: 0,
    };
    // 초기 스킬 — learnSkill 통과 시 replaces 자동 비활성 적용 (1차 스킬엔 영향 없음).
    job.skills.filter(s => s.lv <= 1).forEach(s => learnSkill(this.state, s.id));
    this.state.hp = this.getHpMax(); this.state.mp = this.getMpMax();
    this.awaiting = null;   // 🐛 fix: 생성 후 입력 대기 해제
    this.out(`\n★ ${name} (${race.name} ${job.name}) 탄생!`);
    this.out('────────────────────────────');
    this.out(`Day 1, 06:00 — 헬턴트의 아침`);
    this.out('help 로 명령어 확인');
    this.out('────────────────────────────\n');
    this.lookAround();
  }

  // ════════════════ 스탯 ════════════════
  S(k) {
    let base = this.state.stats[k] || 0;
    // 장비 스탯 보너스 합산
    ['weapon','armor','acc'].forEach(slot => {
      const e = this.state.equip[slot];
      if (e && ITEMS[e] && ITEMS[e][k]) base += ITEMS[e][k];
    });
    // 작위 보너스
    if (this.state.title) {
      const b = TITLES.ranks[this.state.title].bonus;
      if (b[k]) base += b[k];
      if (b.all) base += b.all;
    }
    // 수련 스킬: allStat
    const tb = this.trainBonus();
    if (tb.allStat) base += tb.allStat;
    return base;
  }
  // 강화 배수
  enhMul(slot) {
    const lv = (this.state.enhancement || {})[slot] || 0;
    if (lv <= 0) return 1;
    return 1 + ENHANCEMENT.bonuses[lv-1];
  }
  racePassive() { return RACES[this.state.race]?.passive || {}; }

  // 습득한 수련 스킬의 passive 효과 합산
  trainBonus() {
    const acc = { hpBonus: 0, mpBonus: 0, evaBonus: 0, critBonus: 0,
                  hpRegenT: 0, mpRegenT: 0, expMul: 1, goldMul: 1, dmgReduce: 0, allStat: 0 };
    const learned = this.state.trainedSkills || [];
    TRAIN_SKILLS.forEach(ts => {
      if (ts.type !== 'passive' || !learned.includes(ts.id)) return;
      Object.entries(ts.effect || {}).forEach(([k, v]) => {
        if (k === 'expMul' || k === 'goldMul') acc[k] *= v;
        else acc[k] = (acc[k] || 0) + v;
      });
    });
    return acc;
  }

  // 누적 수련 시간(분) 증가 → 새 스킬 해금
  addTrainedMinutes(min) {
    if (!this.state.trainedMinutes) this.state.trainedMinutes = 0;
    if (!this.state.trainedSkills) this.state.trainedSkills = [];
    this.state.trainedMinutes += min;
    const unlocked = [];
    TRAIN_SKILLS.forEach(ts => {
      if (this.state.trainedSkills.includes(ts.id)) return;
      if (this.state.trainedMinutes >= ts.reqMin) {
        this.state.trainedSkills.push(ts.id);
        unlocked.push(ts);
        // 액티브 스킬이면 state.skills에도 추가
        if (ts.type === 'active') learnSkill(this.state, ts.skill.id);
      }
    });
    if (unlocked.length) {
      this.out('\n═══ 수련 스킬 해금 ═══', 'title');
      unlocked.forEach(ts => this.out(`  ✦ [${ts.name}] — ${ts.desc}`, 'good'));
    }
  }
  getHpMax() {
    const base = this.state.hpMaxBase + this.S('vit') * 6;
    const tb = this.trainBonus();
    return Math.round(base * (this.racePassive().hp_mul || 1) * (1 + (tb.hpBonus || 0)));
  }
  getMpMax() {
    const base = this.state.mpMaxBase + this.S('int') * 3 + this.S('wis') * 2;
    const tb = this.trainBonus();
    return Math.round(base * (1 + (tb.mpBonus || 0)));
  }
  getAtk() {
    const w = this.state.equip.weapon, a = this.state.equip.acc;
    const wAtk = w ? Math.round((ITEMS[w].atk||0) * this.enhMul('weapon')) : 0;
    const aAtk = a ? (ITEMS[a].atk||0) : 0;
    return this.state.atkBase + wAtk + aAtk + Math.floor(this.S('str')/2);
  }
  getDef() {
    const r = this.state.equip.armor, a = this.state.equip.acc;
    const rDef = r ? Math.round((ITEMS[r].def||0) * this.enhMul('armor')) : 0;
    const aDef = a ? (ITEMS[a].def||0) : 0;
    return this.state.defBase + rDef + aDef + Math.floor(this.S('vit')/3);
  }
  getMag() {
    const w = this.state.equip.weapon, a = this.state.equip.acc, r = this.state.equip.armor;
    const wM = w ? Math.round((ITEMS[w].mag||0) * this.enhMul('weapon')) : 0;
    const aM = a ? (ITEMS[a].mag||0) : 0;
    const rM = r ? Math.round((ITEMS[r].mag||0) * this.enhMul('armor')) : 0;
    const base = this.state.magBase + wM + aM + rM + Math.floor(this.S('int')/2) + Math.floor(this.S('wis')/3);
    return Math.round(base * (this.racePassive().mag_mul || 1));
  }
  getCritRate() {
    const tb = this.trainBonus();
    return Math.min(0.85, (this.S('dex') + this.S('luk')) / 250 + (tb.critBonus || 0));
  }
  getEvaRate()  {
    const tb = this.trainBonus();
    return Math.min(0.6, this.S('dex') / 400 + (tb.evaBonus || 0));
  }
  getHealBonus(){ return 1 + this.S('wis') * 0.02; }
  getShopDisc() {
    let d = Math.min(0.35, this.S('cha') * 0.005);
    if (this.state.buffsPersistent.cha_up) d += 0.30;
    if (this.state.title === 'duke') d += 0.10;
    d += this.racePassive().shop_disc || 0;
    d += this.tradeBonus().shopDisc || 0;
    return Math.min(0.75, d);
  }

  // 장비에서 proc 효과 수집 (합산)
  getProcs() {
    const acc = {};
    ['weapon','armor','acc'].forEach(slot => {
      const e = this.state.equip[slot];
      if (!e || !ITEMS[e] || !ITEMS[e].proc) return;
      const p = ITEMS[e].proc;
      Object.entries(p).forEach(([k, v]) => {
        if (typeof v === 'number') acc[k] = (acc[k] || 0) + v;
        else if (typeof v === 'boolean') acc[k] = acc[k] || v;
      });
    });
    return acc;
  }

  // ════════════════ 시간 ════════════════
  advanceTime(hours) {
    const t = this.state.time;
    t.hour += hours;
    while (t.hour >= 24) { t.hour -= 24; t.day++; }
  }
  timeStr() {
    const t = this.state.time;
    const hh = String(t.hour).padStart(2,'0');
    return `Day ${t.day}, ${hh}:00`;
  }
  isNight() { const h = this.state.time.hour; return h < 6 || h >= 20; }

  // ════════════════ 명령 처리 ════════════════
  runCommand(raw) {
    const [cmd, ...rest] = raw.split(/\s+/);
    const arg = rest.join(' ');
    const c = cmd.toLowerCase();
    const m = {
      'help': () => this.showHelp(), '?': () => this.showHelp(),
      'look': () => this.lookAround(), 'l': () => this.lookAround(),
      'status': () => this.showStatus(), 'stat': () => this.showStatus(), 's': () => this.showStatus(),
      'inv': () => this.showInv(), 'i': () => this.showInv(),
      'skills': () => this.showSkills(),
      'quests': () => this.showQuests(), 'q': () => this.showQuests(),
      'jobs': () => this.showJobTree(),
      'time': () => this.out(`\n${this.timeStr()} (${this.isNight() ? '밤' : '낮'})`),
      'go': () => this.travel(arg), 'move': () => this.travel(arg),
      'explore': () => this.explore(), 'e': () => this.explore(),
      'talk': () => this.talk(arg),
      'shop': () => this.shop(),
      'buy': () => this.buy(arg), 'sell': () => this.sell(arg),
      'use': () => this.useItem(arg),
      'equip': () => this.equip(arg), 'unequip': () => this.unequip(arg),
      'rest': () => this.rest(), 'inn': () => this.rest(),
      'accept': () => this.acceptQuest(arg), 'complete': () => this.completeQuest(arg),
      'allocate': () => this.allocate(arg), 'alloc': () => this.allocate(arg),
      'advance': () => this.advance(arg),
      'trial': () => this.startTrial(arg),
      'trade': () => this.trade(arg),
      'enhance': () => this.enhance(arg),
      'mansion': () => this.mansion(arg),
      'estate': () => this.mansion(arg),
      'hire': () => this.hire(arg),
      'casino': () => this.casino(arg),
      'bet': () => this.bet(arg),
      'gourmet': () => this.gourmet(arg),
      'dine': () => this.dine(arg),
      'title': () => this.titleCmd(arg),
      'pet': () => this.petCmd(arg),
      'carriage': () => this.carriage(),
      'income': () => this.collectIncome(),
      'respec': () => this.respec(arg),
      'mastery': () => this.showMastery(),
      'clear': () => this.out('', 'cls'),
    };
    if (m[c]) m[c]();
    else this.out(`알 수 없는 명령: "${cmd}" — help`);
  }

  showHelp() {
    this.out(`
[기본]  look / status / inv / skills / quests / jobs / time / clear
[이동]  go <목적지> / explore / carriage (1500G로 다음 이동 -50%시간)
[상점]  shop / buy <키> / sell <키> / use / equip / unequip
[퀘스트]accept / complete
[여관]  rest (8시간)
[성장]  allocate <스탯> <값> / trial <직업> / advance <직업>
[무역]  trade / trade buy <상품> [수] / trade sell <상품> [수]

[💰 골드 컨텐츠 — 부자 전용]
  enhance <weapon|armor>     장비 강화 (수도 대장장이)
  mansion / estate           부동산 (도시별 저택, 매일 임대료)
  income                     저택 임대료 수금
  hire <용병키>              용병 영구 고용
  casino / bet <게임> <금액> 도박장 (수도)
  gourmet / dine <요리키>    고급 요리 (영구 +스탯)
  title / title <등급>       작위 구매 (왕궁)
  pet / pet <키>             펫 구매 (드래곤/불사조)

[전투] attack / skill <id> / use <item> / run`);
  }

  // ════════════════ 강화 ════════════════
  enhance(slot) {
    if (this.state.location !== 'capital') { this.out('수도 대장장이 마스터 흐랄에게.'); return; }
    if (!['weapon','armor'].includes(slot)) { this.out('enhance weapon | enhance armor'); return; }
    const equipKey = this.state.equip[slot];
    if (!equipKey) { this.out('장비 없음.'); return; }
    if (!this.state.enhancement) this.state.enhancement = { weapon: 0, armor: 0 };
    const cur = this.state.enhancement[slot];
    if (cur >= 10) { this.out('이미 +10. 더 이상 강화 불가.'); return; }
    const cost = ENHANCEMENT.costs[cur];
    const fail = ENHANCEMENT.failRate[cur];
    if (this.state.gold < cost) { this.out(`${cost}G 필요. 현재 ${this.state.gold}.`); return; }
    this.state.gold -= cost;
    if (chance(fail)) {
      this.out(`💥 강화 실패! +${cur} → +${Math.max(0,cur-1)} (${cost}G 소실)`);
      this.state.enhancement[slot] = Math.max(0, cur - 1);
    } else {
      this.state.enhancement[slot] = cur + 1;
      this.out(`✦ 강화 성공! ${ITEMS[equipKey].name} +${cur+1} (-${cost}G)`);
    }
  }

  // ════════════════ 저택 ════════════════
  mansion(arg) {
    if (!arg) {
      this.out('\n[부동산 — 보유/구매]');
      Object.entries(PROPERTIES).forEach(([k, p]) => {
        const own = (this.state.properties||{})[k] ? '✓' : ' ';
        this.out(`  ${own} ${k.padEnd(20)} ${p.name.padEnd(14)} @${LOCATIONS[p.loc].name}  가격 ${p.price}G  임대료 ${p.income}G/일`);
      });
      this.out('\n  mansion <키> 로 구매. income 으로 누적 임대료 수금.');
      return;
    }
    const p = PROPERTIES[arg];
    if (!p) { this.out('없는 부동산.'); return; }
    if ((this.state.properties||{})[arg]) { this.out('이미 보유.'); return; }
    if (this.state.location !== p.loc) { this.out(`${LOCATIONS[p.loc].name}에서 구매.`); return; }
    if (this.state.gold < p.price) { this.out(`${p.price}G 필요.`); return; }
    this.state.gold -= p.price;
    if (!this.state.properties) this.state.properties = {};
    this.state.properties[arg] = { since: this.state.time.day };
    this.out(`✦ ${p.name} 구매 완료! (-${p.price}G)`);
    this.out('  rest 시 무료 / income 으로 임대료 수금');
  }
  collectIncome() {
    const props = this.state.properties || {};
    const today = this.state.time.day;
    let total = 0;
    Object.entries(props).forEach(([k, info]) => {
      const days = today - (info.lastCollect || info.since);
      if (days <= 0) return;
      const inc = PROPERTIES[k].income * days;
      total += inc;
      info.lastCollect = today;
      this.out(`  ${PROPERTIES[k].name}: ${days}일 × ${PROPERTIES[k].income}G = ${inc}G`);
    });
    if (total === 0) { this.out('수금할 임대료 없음.'); return; }
    this.state.gold += total;
    this.out(`✦ 총 ${total}G 수금. 현재 ${this.state.gold}G`);
  }

  // ════════════════ 용병 ════════════════
  hire(key) {
    if (!key) {
      this.out('\n[용병 명단]');
      Object.entries(MERCENARIES).forEach(([k, m]) => {
        const own = (this.state.mercs||[]).includes(k) ? '✓' : ' ';
        const req = m.requireLv ? ` Lv.${m.requireLv}+` : '';
        this.out(`  ${own} ${k.padEnd(15)} ${m.name.padEnd(18)} @${LOCATIONS[m.hire].name}  ${m.price}G${req} — ${m.desc}`);
      });
      return;
    }
    const m = MERCENARIES[key];
    if (!m) { this.out('없는 용병.'); return; }
    if (this.state.location !== m.hire) { this.out(`${LOCATIONS[m.hire].name}에서만 고용 가능.`); return; }
    if (m.requireLv && this.state.lv < m.requireLv) { this.out(`Lv.${m.requireLv} 이상 필요.`); return; }
    if (!this.state.mercs) this.state.mercs = [];
    if (this.state.mercs.includes(key)) { this.out('이미 고용함.'); return; }
    if (this.state.gold < m.price) { this.out(`${m.price}G 필요.`); return; }
    this.state.gold -= m.price;
    this.state.mercs.push(key);
    this.out(`✦ ${m.name} 고용! 모든 전투에 동행.`);
  }

  // ════════════════ 도박 ════════════════
  casino() {
    if (this.state.location !== CASINO.loc) { this.out('수도 도박장에서.'); return; }
    this.out('\n[🎰 도박장]');
    Object.entries(CASINO.games).forEach(([k, g]) =>
      this.out(`  ${k.padEnd(8)} ${g.name.padEnd(10)} ${g.desc}`));
    this.out('\n  bet <게임> <금액>  예: bet slot 1000');
  }
  bet(arg) {
    if (this.state.location !== CASINO.loc) { this.out('수도 도박장에서.'); return; }
    const [game, amt] = (arg||'').trim().split(/\s+/);
    const g = CASINO.games[game];
    const n = parseInt(amt, 10);
    if (!g || !n || n <= 0) { this.out('bet <coin|dice|slot|jackpot> <금액>'); return; }
    if (this.state.gold < n) { this.out('골드 부족.'); return; }
    this.state.gold -= n;
    if (chance(g.odds)) {
      const win = n * g.payout;
      this.state.gold += win;
      this.out(`🎉 ${g.name} 당첨! +${win}G (현재 ${this.state.gold}G)`);
    } else {
      this.out(`💸 ${g.name} 실패. -${n}G (현재 ${this.state.gold}G)`);
    }
  }

  // ════════════════ 고급 요리 ════════════════
  gourmet(arg) {
    if (arg) return this.dine(arg);
    if (this.state.location !== GOURMET.loc) { this.out('카밀카르 미식거리에서.'); return; }
    this.out('\n[🍷 미식거리]');
    Object.entries(GOURMET.dishes).forEach(([k, d]) => {
      const eaten = (this.state.eaten||{})[k] ? ' [먹음]' : '';
      const b = Object.entries(d.bonus).map(([s,v]) => `${s.toUpperCase()}+${v}`).join(' ');
      this.out(`  ${k.padEnd(15)} ${d.name.padEnd(16)} ${d.price}G  [${b}]${eaten}`);
    });
    this.out('\n  dine <요리키>');
  }
  dine(key) {
    if (this.state.location !== GOURMET.loc) { this.out('카밀카르에서.'); return; }
    const d = GOURMET.dishes[key];
    if (!d) { this.out('없는 요리.'); return; }
    if (!this.state.eaten) this.state.eaten = {};
    if (this.state.eaten[key]) { this.out('이미 먹음 (1회 한정).'); return; }
    if (this.state.gold < d.price) { this.out(`${d.price}G 필요.`); return; }
    this.state.gold -= d.price;
    this.state.eaten[key] = true;
    Object.entries(d.bonus).forEach(([s, v]) => { this.state.stats[s] += v; });
    this.out(`🍽 ${d.name} 음미! ${Object.entries(d.bonus).map(([s,v]) => `${s.toUpperCase()}+${v}`).join(' ')} 영구 적용.`);
  }

  // ════════════════ 작위 ════════════════
  titleCmd(arg) {
    if (!arg) {
      this.out('\n[작위]');
      this.out(`현재: ${this.state.title ? TITLES.ranks[this.state.title].name : '평민'}`);
      Object.entries(TITLES.ranks).forEach(([k, t]) => {
        const b = Object.entries(t.bonus).map(([s,v]) => `${s.toUpperCase()}+${v}`).join(' ');
        this.out(`  ${k.padEnd(10)} ${t.name.padEnd(6)} ${t.price.toLocaleString()}G  [${b}]`);
      });
      this.out('\n  title <등급>  (왕궁에서만)');
      return;
    }
    if (this.state.location !== TITLES.loc) { this.out('왕궁에서만 작위 구매.'); return; }
    const t = TITLES.ranks[arg];
    if (!t) { this.out('없는 작위.'); return; }
    if (this.state.gold < t.price) { this.out(`${t.price}G 필요.`); return; }
    this.state.gold -= t.price;
    this.state.title = arg;
    this.out(`👑 ${t.name} 수여! 모든 NPC가 그대를 다르게 본다.`);
  }

  // ════════════════ 펫 ════════════════
  petCmd(arg) {
    if (!arg) {
      this.out('\n[펫]');
      Object.entries(PETS).forEach(([k, p]) => {
        const own = (this.state.pet === k) ? '✓' : ' ';
        const bossReq = p.requireBoss ? ` · ${MONSTERS[p.requireBoss].name} 처치 필요` : '';
        this.out(`  ${own} ${k.padEnd(13)} ${p.name.padEnd(10)} ${p.price.toLocaleString()}G (Lv.${p.requireLv}+) @${LOCATIONS[p.loc].name}${bossReq}`);
        this.out(`     ${p.desc}`);
      });
      this.out('\n  pet <키>');
      return;
    }
    const p = PETS[arg];
    if (!p) { this.out('없는 펫.'); return; }
    if (this.state.location !== p.loc) { this.out(`${LOCATIONS[p.loc].name}에서만 입양 가능.`); return; }
    if (this.state.lv < p.requireLv) { this.out(`Lv.${p.requireLv} 필요.`); return; }
    if (p.requireBoss && !this.state.flags['boss_'+p.requireBoss+'_dead']) {
      this.out(`먼저 ${MONSTERS[p.requireBoss].name}을(를) 쓰러뜨려야 한다.`);
      return;
    }
    if (this.state.gold < p.price) { this.out(`${p.price}G 필요.`); return; }
    this.state.gold -= p.price;
    this.state.pet = arg;
    this.out(`🐉 ${p.name} 입양! ${p.skill.desc}`);
  }

  // ════════════════ 마차 ════════════════
  carriage() {
    if (this.state.gold < CARRIAGE_PRICE) { this.out(`${CARRIAGE_PRICE}G 필요.`); return; }
    this.state.gold -= CARRIAGE_PRICE;
    this.state.flags.carriage = true;
    this.out(`🐎 마차 임대! 다음 이동 시간 -50%.`);
  }

  // 수련장: UI가 실시간으로 처리. 엔진은 awardXp만 호출 받음.
  awardXp(xp) {
    this.state.exp += xp;
    this.checkLevel();
  }

  showStatus() {
    const s = this.state, race = RACES[s.race].name, jobName = JOBS[s.job].name;
    const tier = JOBS[s.job].tier;
    const jobChain = s.jobs.map(j => JOBS[j].name).join(' → ');
    const nextExp = this.expForNext(s.lv);
    const st = s.stats;
    this.out(`
━━━━━━━ [ ${s.name} ] ━━━━━━━
 ${race} · ${jobName} (${tier}차) · Lv.${s.lv}  EXP ${s.exp}/${nextExp}
 직업 계보: ${jobChain}
 ${this.timeStr()} · 위치: ${LOCATIONS[s.location].name}
 HP  ${s.hp}/${this.getHpMax()}   MP ${s.mp}/${this.getMpMax()}   Gold ${s.gold}
 ATK ${this.getAtk()}   DEF ${this.getDef()}   MAG ${this.getMag()}
 치명 ${(this.getCritRate()*100).toFixed(1)}%  회피 ${(this.getEvaRate()*100).toFixed(1)}%  상점할인 ${(this.getShopDisc()*100).toFixed(1)}%
 STR ${st.str} DEX ${st.dex} INT ${st.int} VIT ${st.vit} WIS ${st.wis} LUK ${st.luk} CHA ${st.cha}
 ${s.pendingPoints>0 ? `★ 분배 가능: ${s.pendingPoints}점 (allocate)` : ''}
 장비: 무기[${s.equip.weapon ? ITEMS[s.equip.weapon].name : '-'}] 방어구[${s.equip.armor ? ITEMS[s.equip.armor].name : '-'}] 악세[${s.equip.acc ? ITEMS[s.equip.acc].name : '-'}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }

  showInv() {
    this.out('\n[인벤토리]');
    const entries = Object.entries(this.state.inv).filter(([, v]) => v > 0);
    if (entries.length === 0) this.out('  (비어있음)');
    entries.forEach(([k, v]) => {
      const it = ITEMS[k]; if (!it) return;
      const restr = it.restricted ? ` [제한: ${it.restricted.join(',')} 계열]` : '';
      this.out(`  ${k.padEnd(20)} x${v.toString().padEnd(3)}  ${it.name}${restr} — ${it.desc}`);
    });
    const tEntries = Object.entries(this.state.tradeInv || {}).filter(([, v]) => v > 0);
    if (tEntries.length) {
      this.out('\n[무역 상품]');
      tEntries.forEach(([k, v]) => this.out(`  ${k.padEnd(14)} x${v}  ${TRADE_GOODS[k].name}`));
    }
  }

  showSkills() {
    this.out('\n[보유 스킬]');
    this.state.jobs.forEach(jk => JOBS[jk].skills.forEach(sk => {
      if (this.state.skills.includes(sk.id))
        this.out(`  ${sk.id.padEnd(18)} [${JOBS[jk].name.padEnd(5)}] ${sk.name} (MP ${sk.mp}) — ${sk.desc}`);
    }));
    const locked = [];
    this.state.jobs.forEach(jk => JOBS[jk].skills.forEach(sk => {
      if (!this.state.skills.includes(sk.id)) locked.push({ ...sk, job: JOBS[jk].name });
    }));
    if (locked.length) {
      this.out('\n[미습득]');
      locked.forEach(sk => this.out(`  Lv.${sk.lv.toString().padEnd(2)} ${sk.name} — ${sk.desc}`));
    }
  }

  showQuests() {
    this.out('\n[퀘스트]');
    const qs = Object.entries(this.state.quests);
    if (qs.length === 0) this.out('  (없음)');
    qs.forEach(([id, q]) => {
      const info = QUESTS[id];
      const status = q.done ? '✓ 완료' : `진행 ${q.progress}/${info.target.count}`;
      this.out(`  ${id} [${info.name}] — ${status}`);
      if (!q.done) this.out(`     ${info.desc}`);
    });
  }

  showJobTree() {
    const s = this.state, cur = s.job;
    this.out('\n[직업 트리]');
    this.out(`현재: ${JOBS[cur].name} (${JOBS[cur].tier}차, 계열: ${JOBS[cur].line})`);
    const sameLine = Object.entries(JOBS).filter(([, j]) => j.line === JOBS[cur].line);
    [1, 2, 3].forEach(t => {
      this.out(`\n  [${t}차]`);
      sameLine.filter(([, j]) => j.tier === t).forEach(([k, j]) => {
        const own = s.jobs.includes(k) ? '✓' : ' ';
        const trial = s.completedTrials[k] ? '✦' : ' ';
        const adv = ADVANCE_NPC[k];
        const reqStr = j.reqLv ? ` (Lv.${j.reqLv}, ${j.cost}G${adv ? ` · ${adv.npc}@${LOCATIONS[adv.loc].name}` : ''})` : '';
        this.out(`  ${own}${trial} ${k.padEnd(14)} ${j.name}${reqStr}`);
      });
    });
    this.out('\n  ✓: 보유 직업 / ✦: 시련 통과 (advance 가능)');
    this.out('  trial <직업키> 로 시련 → advance <직업키> 로 전직');
  }

  // ════════════════ 이동 ════════════════
  lookAround() {
    const loc = LOCATIONS[this.state.location];
    this.out(`\n━━ ${loc.name} ━━ [${this.timeStr()}]`);
    this.out(loc.desc);
    if (loc.npcs) this.out(`  NPC: ${loc.npcs.join(', ')}`);
    if (loc.shop) this.out('  [🛒 상점 — shop]');
    if (loc.inn)  this.out('  [🛏 여관 — rest]');
    if (TRADE_PRICES[this.state.location]) this.out('  [📦 무역 거래소 — trade]');
    if (loc.boss) this.out(`  [☠ ${MONSTERS[loc.boss].name}]`);
    if (loc.treasure && !this.state.flags['treasure_'+this.state.location]) this.out(`  [✦ 숨겨진 보물]`);
    if (loc.exits) {
      this.out('  이동 가능:');
      Object.entries(loc.exits).forEach(([dst, info]) => {
        const hours = (typeof info === 'object') ? info.hours : '?';
        this.out(`    → ${dst} (${hours}시간)`);
      });
    }
  }

  travel(dest) {
    if (!dest) { this.out('어디로?'); return; }
    const loc = LOCATIONS[this.state.location];
    const target = Object.entries(loc.exits || {}).find(([k]) => k === dest || k.includes(dest));
    if (!target) { this.out('길이 없다.'); return; }
    let info = target[1];
    let toKey = info, hours = 1;
    if (typeof info === 'object') { toKey = info.to; hours = info.hours; }
    const next = LOCATIONS[toKey];
    // 상인 계열은 여행 레벨 제한 -4 (고레벨 구간에서는 상대적으로 작은 이점)
    const isMerchant = JOBS[this.state.job].line === 'merchant';
    const effectiveReq = next.requireLv ? (isMerchant ? Math.max(1, next.requireLv - 4) : next.requireLv) : 0;
    if (effectiveReq && this.state.lv < effectiveReq) {
      const note = isMerchant ? ` (상인 완화: 원래 Lv.${next.requireLv}, -4)` : '';
      this.out(`${next.name}: Lv.${effectiveReq} 필요${note}.`);
      return;
    }
    // 엔드게임 조건: 마스터리 요구 / 히든 직업 요구
    if (next.requireMastery && (this.state.masteredLines || []).length < next.requireMastery) {
      this.out(`${next.name}: ${next.requireMastery}개 직업 마스터 필요 (현재 ${(this.state.masteredLines||[]).length}).`);
      return;
    }
    if (next.requireHidden) {
      const curJob = JOBS[this.state.job];
      if (!curJob || !curJob.hidden) {
        this.out(`${next.name}: 히든 직업 (만능의 달인/대통합자) 필요.`);
        return;
      }
    }
    if (this.state.flags.carriage) {
      hours = Math.max(1, Math.round(hours * 0.5));
      this.state.flags.carriage = false;
      this.out(`🐎 마차로 빠르게 이동.`);
    }
    this.out(`\n[${next.name}으로 이동 시작 — ${hours}시간 거리]`);

    // 이동 도중 시간별 인카운트
    for (let h = 0; h < hours; h++) {
      this.advanceTime(1);
      // 인카운트 굴림 (상인 캐러밴 스킬로 감소 가능)
      const encRate = 0.20 * (1 - this.tradeBonus().safeTravel);
      if (chance(encRate)) {
        const pool = (loc.encounters || []).concat(next.encounters || []);
        if (pool.length) {
          const roll = Math.random();
          let num, elite = false;
          if (roll < 0.03)      { num = 1; elite = true; }
          else if (roll < 0.10) { num = 3 + rnd(3); }   // 길목 매복 무리
          else if (roll < 0.30) { num = 2; }
          else                  { num = 1; }
          const foes = [];
          for (let i = 0; i < num; i++) foes.push(pool[rnd(pool.length)]);
          this.out(`  [${this.timeStr()}] 길에서 ${elite ? '엘리트 ' : ''}${foes.map(f => MONSTERS[f].name).join(', ')} 조우!`);
          this.startCombat(foes, false, { elite });
          return;
        }
      } else if (chance(0.05)) {
        const g = 5 + rnd(15);
        this.state.gold += g;
        this.out(`  [${this.timeStr()}] 길가에 떨어진 ${g}G 발견.`);
      }
    }
    this.state.location = toKey;
    this.out(`[${this.timeStr()}] ${next.name} 도착.`);
    this.lookAround();
  }

  explore() {
    const loc = LOCATIONS[this.state.location];
    if (loc.boss && !this.state.flags['boss_'+loc.boss+'_dead']) {
      this.out(`\n${MONSTERS[loc.boss].name}이 모습을 드러냈다!`);
      this.startCombat([loc.boss]);
      return;
    }
    if (loc.treasure && !this.state.flags['treasure_'+this.state.location]) {
      this.state.flags['treasure_'+this.state.location] = true;
      this.state.inv[loc.treasure] = (this.state.inv[loc.treasure]||0) + 1;
      this.out(`\n✦ 숨겨진 보물을 발견했다! [${ITEMS[loc.treasure].name}] 획득!`);
      return;
    }
    this.advanceTime(1);
    if (!loc.encounters || !loc.encounters.length) { this.out('적이 없다.'); return; }
    if (chance(loc.encounterRate || 0.4)) {
      // 조우 롤: 1마리(60%) · 2마리(25%) · 3마리(10%) · 무리 4-6마리(4%) · 엘리트(1%)
      const roll = Math.random();
      let num, elite = false, swarm = false;
      if (roll < 0.01)       { num = 1; elite = true; }
      else if (roll < 0.05)  { num = 4 + rnd(3); swarm = true; }
      else if (roll < 0.15)  { num = 3; }
      else if (roll < 0.40)  { num = 2; }
      else                   { num = 1; }
      const foes = [];
      for (let i = 0; i < num; i++) foes.push(loc.encounters[rnd(loc.encounters.length)]);
      if (elite) {
        this.out(`\n⚠ 엘리트 조우! ${MONSTERS[foes[0]].name}의 강화된 개체가 나타났다!`, 'warn');
      } else if (swarm) {
        this.out(`\n⚠⚠ 무리가 몰려온다! ${num}마리!`, 'warn');
        this.out(`  (${foes.map(f => MONSTERS[f].name).join(', ')})`);
      } else {
        this.out(`\n조우! (${foes.map(f => MONSTERS[f].name).join(', ')})`);
      }
      this.startCombat(foes, false, { elite });
    } else {
      if (chance(0.3)) { const g = 5 + rnd(20); this.state.gold += g; this.out(`동전 ${g}G.`); }
      else this.out('별일 없다.');
    }
  }

  // ════════════════ 전투 ════════════════
  startCombat(foeKeys, trialMode = false, opts = {}) {
    let buff;
    if (trialMode && this.trial) buff = AWAKENINGS[this.trial.target].battle.buff;
    else if (opts.elite) buff = { hp: 2.0, atk: 1.6, exp: 2.5, gold: 2.5 };
    else buff = { hp: 1, atk: 1 };
    const foes = foeKeys.map((k, i) => {
      const m = MONSTERS[k];
      return {
        key: k, id: i, ...m,
        name: opts.elite ? ('엘리트 ' + m.name) : m.name,
        hp: Math.round(m.hp * (buff.hp||1)), hpMax: Math.round(m.hp * (buff.hp||1)),
        atk: Math.round(m.atk * (buff.atk||1)),
        exp: Math.round(m.exp * (buff.exp||1)),
        gold: Math.round(m.gold * (buff.gold||1)),
        elite: !!opts.elite,
        buffs: {},
      };
    });
    this.combat = {
      foes, buffs: {}, turn: 1, trialMode,
      reviveReady: false, undyingLeft: 0, extraTurn: false, lockOn: false,
      summons: [],
    };
    Object.keys(this.state.buffsPersistent).forEach(k => this.combat.buffs[k] = 99);
    this.renderCombat();
    this.out('\n[명령: attack / skill <id> / use <item> / run]');
  }

  renderCombat() {
    if (!this.combat) return;
    this.out('\n┌─ 전투 ─────────────────────┐');
    this.combat.foes.forEach((f, i) => {
      if (f.hp > 0) {
        const bar = this.hpBar(f.hp, f.hpMax, 14);
        const eff = [];
        if (f.poison) eff.push(`독${f.poison}`);
        if (f.burn) eff.push(`화상${f.burn}`);
        if (f.freeze) eff.push(`빙결${f.freeze}`);
        if (f.stun) eff.push(`기절${f.stun}`);
        if (f.mark) eff.push('표식');
        this.out(`  [${i}] ${f.name.padEnd(10)} ${bar} ${f.hp}/${f.hpMax} ${eff.join(' ')}`);
      }
    });
    const s = this.state;
    const myEff = Object.keys(this.combat.buffs).filter(k => this.combat.buffs[k] > 0);
    this.out(`  ─ 나: ${this.hpBar(s.hp, this.getHpMax(), 14)} HP ${s.hp}/${this.getHpMax()} MP ${s.mp}/${this.getMpMax()} ${myEff.join(' ')}`);
    this.out('└───────────────────────────┘');
  }

  hpBar(cur, max, len) {
    const n = Math.max(0, Math.round((cur / max) * len));
    return '[' + '='.repeat(n) + '-'.repeat(len - n) + ']';
  }

  combatInput(raw) {
    const [cmd, ...rest] = raw.split(/\s+/);
    const arg = rest.join(' ').trim();
    const c = cmd.toLowerCase();
    if (c === 'attack' || c === 'a') return this.cAttack();
    if (c === 'skill' || c === 'sk') return this.cSkill(arg);
    if (c === 'use')    return this.cUse(arg);
    if (c === 'run')    return this.cRun();
    if (c === 'runsac' || c === 'run_sacrifice') return this.cRun(true);
    if (c === 'status' || c === 's') { this.showStatus(); this.renderCombat(); return; }
    if (c === 'skills') { this.showSkills(); this.renderCombat(); return; }
    this.out('전투 중: attack / skill <id> / use <item> / run');
  }

  pickTarget(idx) {
    const foes = this.combat.foes;
    if (idx !== undefined && foes[idx] && foes[idx].hp > 0) return foes[idx];
    return foes.find(f => f.hp > 0);
  }

  calcAtk(base, useMag = false) {
    const b = this.combat.buffs;
    let atk = useMag ? this.getMag() : this.getAtk();
    if (b.atk_up) atk *= 1.4;
    if (b.atk_up_big) atk *= 1.6;
    if (b.berserk) atk *= 2.0;
    if (b.beast) atk *= 1.5;
    if (b.inner_peace || b.all_up) atk *= 1.3;
    if (b.all_up_big) atk *= 1.5;
    if (b.dark_power) atk *= 1.6;
    if (b.wild_lord) atk *= 1.4;
    if (b.duel) atk *= 1.8;
    if (b.sage_aura) atk *= 1.3;
    if (b.phantom_weapon) atk *= 2.0;
    if (b.accuracy_up) atk *= 1.2;
    if (b.wealth) atk *= 1 + Math.min(1, this.state.gold/10000) * 0.5;  // 황금왕
    return atk * base;
  }

  applyFoeDmg(f, raw, opt = {}) {
    let dmg = Math.max(1, Math.round(raw - (opt.ignoreDef ? 0 : f.def * 0.4)));
    if (f.mark) dmg = Math.round(dmg * 1.5);
    if (f.deathMark) dmg = Math.round(dmg * 1.5);
    if (f.huntMark && opt.phys) dmg = Math.round(dmg * 1.3);
    if (f.appraised) dmg = Math.round(dmg * 1.3);
    if (this.combat.buffs.boss_slay && f.boss) dmg = Math.round(dmg * 1.8);
    if (opt.dragonSlay && (f.tags||[]).includes('dragon')) dmg = Math.round(dmg * 2.0);
    if (opt.undeadSlay && (f.tags||[]).includes('undead')) dmg = Math.round(dmg * 2.0);
    if (opt.magSlay && (f.tags||[]).includes('mag')) dmg = Math.round(dmg * 1.8);
    f.hp -= dmg;
    return dmg;
  }

  cAttack() {
    const t = this.pickTarget(); if (!t) return;
    const procs = this.getProcs();
    let dmg = this.calcAtk(1);
    let crit = chance(this.getCritRate() + (procs.crit_bonus || 0));
    if (this.combat.lockOn) { crit = true; this.combat.lockOn = false; }
    if (crit) dmg *= 1.8;
    // double_dmg proc
    let doubled = false;
    if (procs.double_dmg && chance(procs.double_dmg)) { dmg *= 2; doubled = true; }
    const d = this.applyFoeDmg(t, dmg, { phys: true });
    this.out(`▶ ${this.state.name}의 공격! ${t.name}에 ${d}${crit?' (치명!)':''}${doubled?' (2배!)':''}`);
    // burn_on_hit / freeze_on_hit / poison_on_hit
    if (procs.burn_on_hit && chance(procs.burn_on_hit)) { t.burn = 3; this.out(`  🔥 화상!`); }
    if (procs.freeze_on_hit && chance(procs.freeze_on_hit)) { t.freeze = 2; this.out(`  ❄ 빙결!`); }
    if (procs.poison_on_hit && chance(procs.poison_on_hit)) { t.poison = 4; this.out(`  ☠ 중독!`); }
    if (t.hp <= 0) this.out(`  ${t.name} 쓰러짐.`);
    this.endPlayerTurn();
  }

  cSkill(arg) {
    if (!arg) { this.out('skill <id>'); return; }
    const sk = this.findSkill(arg);
    if (!sk) { this.out('미습득.'); return; }
    let mpCost = sk.mp;
    if (this.combat.buffs.mag_mastery) mpCost = Math.round(mpCost * 0.5);
    const procs = this.getProcs();
    if (procs.mp_cost_down) mpCost = Math.round(mpCost * (1 - procs.mp_cost_down));
    mpCost = Math.max(1, mpCost);
    if (this.state.mp < mpCost) { this.out(`MP 부족 (${mpCost}).`); return; }
    this.state.mp -= mpCost;
    this.executeSkill(sk);
  }

  findSkill(id) {
    if (!this.state.skills.includes(id)) return null;
    for (const jk of this.state.jobs) {
      const sk = JOBS[jk].skills.find(s => s.id === id);
      if (sk) return sk;
    }
    // 조합 스킬 체크
    const combo = COMBO_SKILLS.find(c => c.skill.id === id);
    if (combo && this.hasComboLines(combo.lines)) return combo.skill;
    return null;
  }

  hasLine(line) {
    return (this.state.jobs || []).some(jk => JOBS[jk] && JOBS[jk].line === line);
  }
  hasComboLines(lines) { return lines.every(l => this.hasLine(l)); }

  availableCombos() {
    return COMBO_SKILLS.filter(c => this.hasComboLines(c.lines));
  }

  // 마스터리 체크 (4차 직업 + Lv.90 + 해당 직업 전 스킬 습득)
  checkMastery() {
    if (!this.state.masteredLines) this.state.masteredLines = [];
    const curJob = JOBS[this.state.job];
    if (!curJob || curJob.tier < 4) return;
    if (this.state.lv < 90) return;
    const line = curJob.line;
    if (this.state.masteredLines.includes(line)) return;
    // 현재 4차 직업의 모든 스킬 습득 체크
    const allLearned = curJob.skills.every(sk => this.state.skills.includes(sk.id));
    if (!allLearned) return;
    // 마스터!
    this.state.masteredLines.push(line);
    const count = this.state.masteredLines.length;
    this.out(`\n═══════════ 직업 마스터 ═══════════`, 'title');
    this.out(`✦ ${curJob.name} 계열을 마스터했다! (총 ${count}개 마스터)`, 'good');
    this.out(`  주스탯 +5 영구, HP +100 영구 보너스`, 'good');
    // 영구 보너스 적용
    (curJob.mainStats || []).forEach(s => { this.state.stats[s] += 5; });
    this.state.hpMaxBase += 100;
    // 히든 직업 해금 알림
    if (count === 3) this.out(`\n★★ 히든 직업 [파라곤(Paragon)] 해금! respec 명령 시 선택 가능`, 'good');
    if (count === 5) this.out(`\n★★★ 초히든 [반신(半神)] 해금! respec 명령 시 업그레이드 가능`, 'good');
    this.out(`\n재전직하여 다른 계열 도전 가능: respec <1차직업키>`, 'sys');
  }

  // 재전직 — 레벨/스탯 유지, 스킬 누적, 새 1차 직업으로 전환
  respec(jobKey) {
    if (!jobKey) {
      this.out('\n[재전직 대상 선택]');
      this.out('각 계열의 1차 직업만 선택 가능. 레벨/스탯/기존 스킬 모두 유지.');
      Object.entries(JOBS).filter(([, j]) => j.tier === 1 && !j.hidden).forEach(([k, j]) => {
        if (j.raceOnly && j.raceOnly !== this.state.race) return;
        const mastered = this.state.masteredLines && this.state.masteredLines.includes(j.line) ? ' ✓마스터됨' : '';
        this.out(`  ${k.padEnd(14)} ${j.name}${mastered}`);
      });
      // 히든 직업 안내
      const hidden = Object.entries(JOBS).filter(([, j]) => j.hidden);
      hidden.forEach(([k, j]) => {
        const ok = (this.state.masteredLines || []).length >= (j.masteryReq || 99);
        if (ok) this.out(`  ★ ${k.padEnd(12)} ${j.name} (요구 마스터 ${j.masteryReq})`);
      });
      this.out('\nrespec <직업키>');
      return;
    }
    const next = JOBS[jobKey];
    if (!next) { this.out('없는 직업.'); return; }
    // 히든 직업은 마스터리 조건 체크
    if (next.hidden) {
      const count = (this.state.masteredLines || []).length;
      if (count < (next.masteryReq || 99)) {
        this.out(`${next.name}: ${next.masteryReq}개 마스터 필요 (현재 ${count}).`);
        return;
      }
    } else if (next.tier !== 1) {
      this.out('1차 직업 또는 히든 직업만 재전직 가능.');
      return;
    }
    if (next.raceOnly && next.raceOnly !== this.state.race) {
      this.out(`${next.name}은 ${RACES[next.raceOnly].name} 전용.`);
      return;
    }
    // 전환 — 레벨/스탯/기존 스킬 유지
    const prevJob = JOBS[this.state.job];
    this.state.job = jobKey;
    if (!this.state.jobs.includes(jobKey)) this.state.jobs.push(jobKey);
    // base 스탯 차이만큼 보정 (부드럽게)
    this.state.hpMaxBase += Math.round((next.base.hp - prevJob.base.hp) * 0.3);
    this.state.mpMaxBase += Math.round((next.base.mp - prevJob.base.mp) * 0.3);
    this.state.atkBase += Math.round((next.base.atk - prevJob.base.atk) * 0.3);
    this.state.defBase += Math.round((next.base.def - prevJob.base.def) * 0.3);
    this.state.magBase += Math.round((next.base.mag - prevJob.base.mag) * 0.3);
    // 새 직업의 현재 레벨 이하 스킬 즉시 습득
    (next.skills || []).forEach(sk => {
      if ((sk.lv || 1) <= this.state.lv && !this.state.skills.includes(sk.id)) {
        learnSkill(this.state, sk.id);
      }
    });
    this.state.hp = this.getHpMax(); this.state.mp = this.getMpMax();
    this.out(`\n★★ 재전직 완료! ${prevJob.name} → ${next.name}`, 'good');
    this.out(`  레벨/스탯/기존 스킬 유지. 새 계열 성장 시작.`, 'good');
  }

  executeSkill(sk) {
    const b = this.combat.buffs;
    if (sk.type === 'buff') {
      const turns = sk.turns || 3;
      b[sk.effect] = turns;
      if (['sage_aura','cha_up','gold_up','accuracy_up','phantom_weapon','boss_slay','poison_plus','wealth'].includes(sk.effect))
        this.state.buffsPersistent[sk.effect] = true;
      this.out(`▶ ${sk.name}! (${turns}턴)`);
      if (sk.effect === 'lock_on') this.combat.lockOn = true;
      if (sk.effect === 'undying') this.combat.undyingLeft = turns;
      this.endPlayerTurn(); return;
    }
    if (sk.type === 'heal') {
      const heal = Math.round((sk.power||1) * (this.getMag()+20) * this.getHealBonus());
      this.state.hp = Math.min(this.getHpMax(), this.state.hp + heal);
      this.out(`▶ ${sk.name}! HP +${heal}`);
      this.endPlayerTurn(); return;
    }
    if (sk.type === 'revive') {
      this.combat.reviveReady = true;
      this.out(`▶ ${sk.name}! 치명상 시 부활.`);
      this.endPlayerTurn(); return;
    }
    if (sk.type === 'utility') {
      if (sk.effect === 'steal_gold') {
        const t = this.pickTarget();
        if (t) { const g = Math.round(t.gold * 0.5); this.state.gold += g; this.out(`▶ 훔치기! +${g}G`); }
      } else if (sk.effect === 'mp_restore') {
        const r = Math.round(this.getMpMax()*0.5);
        this.state.mp = Math.min(this.getMpMax(), this.state.mp + r);
        this.out(`▶ 명상! MP +${r}`);
      } else if (sk.effect === 'extra_turn') {
        this.combat.extraTurn = true;
        this.out(`▶ ${sk.name}! 추가 턴.`);
      } else if (sk.effect === 'full_heal_self') {
        this.state.hp = this.getHpMax(); this.state.mp = this.getMpMax();
        this.out(`▶ 완전회복!`);
      } else if (sk.effect === 'reveal') {
        const t = this.pickTarget();
        if (t) { t.appraised = true; this.out(`▶ ${t.name} 약점 노출. 받는 피해 +30%`); }
      } else if (sk.effect === 'shop_open') {
        this.out(`▶ 암시장 호출! 어디서든 거래 가능.`);
        this.state.flags.black_market = true;
      } else if (sk.effect === 'summon_beast' || sk.effect === 'summon_skel') {
        this.combat.summons.push({ name: sk.effect==='summon_beast'?'소환수':'해골병', atk: Math.round(this.getAtk()*0.6) });
        this.out(`▶ 소환!`);
      }
      this.endPlayerTurn(); return;
    }
    if (sk.type === 'debuff') {
      const t = this.pickTarget(); if (!t) return;
      const turns = sk.turns || 3;
      const map = { poison:'poison', atk_def_down:'weakened', atk_down:'weakened', blind:'blind',
                    mark:'mark', death_mark:'deathMark', hunt_mark:'huntMark', fear:'fear',
                    soul_link:'soulLink', possess:'possess' };
      const k = map[sk.effect] || sk.effect;
      t[k] = turns;
      if (sk.effect === 'mark' || sk.effect === 'death_mark') t.mark = turns;
      this.out(`▶ ${sk.name}! ${t.name} ${sk.effect}.`);
      this.endPlayerTurn(); return;
    }

    // 공격 스킬
    const isMag = sk.type.startsWith('mag');
    const isAoe = sk.type.endsWith('_aoe');
    const hits  = sk.hits || 1;
    const pw    = sk.power || 1;
    const opts = { phys: !isMag };
    if (sk.effect === 'pierce_def') opts.ignoreDef = true;
    if (sk.effect === 'dragon_slay') opts.dragonSlay = true;
    if (sk.effect === 'undead_slay' || sk.effect === 'holy') opts.undeadSlay = true;
    if (sk.effect === 'mag_slayer') opts.magSlay = true;

    const targets = isAoe ? this.combat.foes.filter(f => f.hp > 0) : [this.pickTarget()].filter(Boolean);
    if (!targets.length) return;

    // 골드 강타
    let goldBonus = 1;
    if (sk.effect === 'gold_strike') {
      const cost = Math.min(this.state.gold, 100 + this.state.lv * 50);
      this.state.gold -= cost;
      goldBonus = 1 + cost / 200;
      this.out(`  💰 ${cost}G 소비, 데미지 ×${goldBonus.toFixed(2)}`);
    }
    if (sk.effect === 'gold_dmg') {
      const cost = Math.min(this.state.gold, 20);
      this.state.gold -= cost;
      goldBonus = 1 + cost / 30;
    }

    for (let h = 0; h < hits; h++) {
      targets.forEach(t => {
        if (t.hp <= 0) return;
        let base = this.calcAtk(pw, isMag) * goldBonus;
        if (sk.effect === 'finisher' && t.hp < t.hpMax*0.3) base *= 1.6;
        if (sk.effect === 'finisher_big' && t.hp < t.hpMax*0.3) base *= 2.5;
        if (sk.effect === 'gamble') base *= (0.5 + Math.random() * 2.5);
        if (sk.effect === 'lucky_seven' && this.combat.turn % 7 === 0) base *= 3.0;
        let crit = chance(this.getCritRate());
        if (sk.effect === 'crit_100' || sk.effect === 'assassinate') crit = true;
        if (sk.effect === 'crit_plus' && chance(0.5)) crit = true;
        if (this.combat.lockOn) { crit = true; this.combat.lockOn = false; }
        if (crit) base *= 1.8;
        const d = this.applyFoeDmg(t, base, opts);
        this.out(`▶ ${sk.name}${hits>1?` (${h+1}타)`:''} → ${t.name} ${d}${crit?' (치명!)':''}`);

        if (sk.effect === 'lifesteal' || sk.effect === 'lifesteal_mag' || sk.effect === 'lifesteal_big') {
          const rate = sk.effect === 'lifesteal_big' ? 0.8 : 0.5;
          const heal = Math.round(d*rate);
          this.state.hp = Math.min(this.getHpMax(), this.state.hp + heal);
          this.out(`  ↺ HP +${heal}`);
        }
        if (sk.effect === 'gold_drain') {
          const g = Math.round(d * 0.3);
          this.state.gold += g;
          this.out(`  💰 +${g}G`);
        }
        if (sk.effect === 'burn')    t.burn = sk.turns || 3;
        if (sk.effect === 'freeze')  t.freeze = sk.turns || 2;
        if (sk.effect === 'stun')    t.stun = sk.turns || 1;
        if (sk.effect === 'poison')  t.poison = sk.turns || 3;
        if (sk.effect === 'slow')    t.slow = sk.turns || 2;
        if (sk.effect === 'mark')    t.mark = sk.turns || 4;
        if (sk.effect === 'immobilize') t.stun = sk.turns || 2;
        if (sk.effect === 'fear')    t.fear = sk.turns || 2;
        if (t.hp <= 0) this.out(`  ${t.name} 쓰러짐.`);
      });
    }
    this.endPlayerTurn();
  }

  cUse(arg) {
    if (!arg || !this.state.inv[arg] || this.state.inv[arg]<=0) { this.out('없음.'); return; }
    const it = ITEMS[arg];
    // 스킬북 — 사용 시 해당 스킬 습득.
    if (it.type === 'skillbook') {
      if (this.combat) { this.out('전투 중에는 책을 읽을 수 없다.'); return; }
      if (!it.teaches) { this.out('손상된 책.'); return; }
      if (this.state.skills.includes(it.teaches)) {
        this.out(`이미 습득한 스킬: ${it.name}`); return;
      }
      const sk = findSkillByIdLocal(it.teaches);
      if (sk && sk.lv && this.state.lv < sk.lv) {
        this.out(`레벨 부족 — ${it.name} 은(는) Lv.${sk.lv} 이상 필요.`); return;
      }
      learnSkill(this.state, it.teaches);
      this.state.inv[arg]--;
      this.out(`▶ ${it.name} — 새 스킬 습득!`);
      return;
    }
    if (it.type !== 'use') { this.out('소비 아이템 아님.'); return; }
    if (it.effect === 'heal') { this.state.hp = Math.min(this.getHpMax(), this.state.hp + it.amount); this.out(`▶ ${it.name} HP+${it.amount}`); }
    else if (it.effect === 'mp') { this.state.mp = Math.min(this.getMpMax(), this.state.mp + it.amount); this.out(`▶ ${it.name} MP+${it.amount}`); }
    else if (it.effect === 'full') { this.state.hp = this.getHpMax(); this.state.mp = this.getMpMax(); this.out(`▶ 완전회복!`); }
    this.state.inv[arg]--;
    if (this.combat) this.endPlayerTurn();
  }

  cRun(sacrificeGoods) {
    if (this.combat.trialMode) { this.out('시련에서 도주할 수 없다.'); return; }
    // 기본 40% + DEX/400 + 회피율 절반 반영
    let runChance = 0.40 + this.S('dex') / 400 + this.getEvaRate() * 0.5;
    // 적 체력 비율 보너스 — 적이 약해졌을수록 도주 쉬움 (최대 +40%)
    const foesAlive = this.combat.foes.filter(f => f.hp > 0);
    if (foesAlive.length > 0) {
      const avgHpPct = foesAlive.reduce((s, f) => s + f.hp / f.hpMax, 0) / foesAlive.length;
      const hpBonus = (1 - avgHpPct) * 0.40;  // 0%HP → +40%, 100%HP → +0%
      runChance += hpBonus;
      if (hpBonus > 0.05) this.out(`  (적이 약해져 도주 +${Math.round(hpBonus*100)}%)`, 'dim');
    }
    // 보스면 성공률 대폭 감소
    if (this.combat.foes.some(f => f.boss || f.hp > 1500)) runChance *= 0.5;
    // 상인 계열: 캐러밴 스킬이 적용되어 있어도 여기엔 반영 안 함 (별도 패시브)
    if (JOBS[this.state.job].line === 'merchant') runChance += 0.10;  // 상인은 기본 +10%

    // 특수 도주: 무역품 20% 희생 → 도주 확률 +50%
    if (sacrificeGoods) {
      const tradeInv = this.state.tradeInv || {};
      const keys = Object.keys(tradeInv).filter(k => tradeInv[k] > 0);
      if (keys.length === 0) {
        this.out('버릴 무역품이 없다. 평범하게 도주.');
      } else {
        runChance += 0.50;
        let totalLost = 0;
        keys.forEach(k => {
          const loss = Math.ceil(tradeInv[k] * 0.20);
          this.state.tradeInv[k] -= loss;
          // 평균 매입가도 비례 차감
          if (this.state.tradeBook && this.state.tradeBook[k]) {
            const avgCost = this.state.tradeBook[k] / (tradeInv[k] + loss);
            this.state.tradeBook[k] = Math.max(0, this.state.tradeBook[k] - Math.round(avgCost * loss));
          }
          totalLost += loss;
        });
        this.out(`💰 무역품 ${totalLost}개를 버리며 도주! 확률 +50%.`);
      }
    }
    runChance = Math.min(0.95, runChance);
    if (chance(runChance)) { this.out(`도주 성공! (${Math.round(runChance*100)}%)`); this.combat = null; }
    else { this.out(`도주 실패! (${Math.round(runChance*100)}%)`); this.foesTurn(); }
  }

  endPlayerTurn() {
    this.combat.foes.forEach(f => {
      if (f.hp <= 0) return;
      if (f.poison) {
        let d = 10 + rnd(12);
        if (this.combat.buffs.poison_plus) d *= 3;
        f.hp -= d; this.out(`  ☠ ${f.name} 독 ${d}`); f.poison--;
      }
      if (f.burn) { const d = 15 + rnd(15); f.hp -= d; this.out(`  🔥 ${f.name} 화상 ${d}`); f.burn--; }
      if (f.hp <= 0) this.out(`  ${f.name} 쓰러짐.`);
    });
    (this.combat.summons||[]).forEach(s => {
      const t = this.pickTarget(); if (!t) return;
      const d = this.applyFoeDmg(t, s.atk, {phys:true});
      this.out(`  🐾 ${s.name} → ${t.name} ${d}`);
      if (t.hp <= 0) this.out(`  ${t.name} 쓰러짐.`);
    });
    // 용병 행동
    (this.state.mercs || []).forEach(mk => {
      const m = MERCENARIES[mk];
      if (m.heal) {
        this.state.hp = Math.min(this.getHpMax(), this.state.hp + m.heal);
        this.out(`  ⛑ ${m.name} 치유 +${m.heal}`);
      } else if (m.atk || m.mag) {
        const t = this.pickTarget(); if (!t) return;
        const power = m.atk || m.mag;
        const d = this.applyFoeDmg(t, power, {phys: !!m.atk});
        this.out(`  ⚔ ${m.name} → ${t.name} ${d}`);
        if (t.hp <= 0) this.out(`  ${t.name} 쓰러짐.`);
      }
    });
    // 펫 행동
    if (this.state.pet) {
      const p = PETS[this.state.pet], sk = p.skill;
      if (sk.heal) {
        this.state.hp = Math.min(this.getHpMax(), this.state.hp + sk.heal);
        this.out(`  🪶 ${p.name} ${sk.name} +${sk.heal}`);
      } else if (sk.atk) {
        const t = this.pickTarget();
        if (t) {
          const d = this.applyFoeDmg(t, sk.atk, {phys:true});
          this.out(`  🐉 ${p.name} ${sk.name} → ${t.name} ${d}`);
          if (t.hp <= 0) this.out(`  ${t.name} 쓰러짐.`);
        }
      }
    }
    // HP/MP regen proc + 수련 passive
    const procs = this.getProcs();
    const tb = this.trainBonus();
    const totalHpRegen = (procs.hp_regen || 0) + (tb.hpRegenT || 0);
    const totalMpRegen = (procs.mp_regen || 0) + (tb.mpRegenT || 0);
    if (totalHpRegen) {
      const h = Math.round(this.getHpMax() * totalHpRegen);
      if (h > 0) {
        this.state.hp = Math.min(this.getHpMax(), this.state.hp + h);
        this.out(`  ✚ 재생 HP +${h}`);
      }
    }
    if (totalMpRegen) {
      this.state.mp = Math.min(this.getMpMax(), this.state.mp + totalMpRegen);
      this.out(`  ✦ 마나 회복 MP +${totalMpRegen}`);
    }
    if (this.checkVictory()) return;
    // extra turn: skill buff 또는 아이템 proc
    if (this.combat.extraTurn || (procs.extra_turn_chance && chance(procs.extra_turn_chance))) {
      this.combat.extraTurn = false;
      this.out('\n[추가 턴!]');
      this.renderCombat();
      return;
    }
    this.foesTurn();
  }

  foesTurn() {
    const b = this.combat.buffs;
    this.combat.foes.forEach(f => {
      if (f.hp <= 0) return;
      if (f.stun) { this.out(`◀ ${f.name} 기절`); f.stun--; return; }
      if (f.freeze) { this.out(`◀ ${f.name} 빙결`); f.freeze--; return; }
      if (f.fear) { if (chance(0.6)) { this.out(`◀ ${f.name} 공포`); f.fear--; return; } f.fear--; }
      if (f.possess) { this.out(`◀ ${f.name} 빙의`); f.possess--; return; }
      let atk = f.atk;
      if (f.weakened) atk *= 0.5;
      if (f.slow) { atk *= 0.7; f.slow--; }
      if (f.blind && chance(0.6)) { this.out(`◀ ${f.name} 빗나감`); f.blind--; return; }
      let def = this.getDef();
      if (b.def_up) def *= 1.5;
      if (b.def_up_big) def *= 1.8;
      if (b.dmg_reduce) atk *= 0.6;
      if (b.holy_shield || b.all_defense) atk *= 0.5;
      if (b.berserk) def *= 0.5;
      if (b.inner_peace || b.all_up) def *= 1.3;
      if (b.all_up_big) def *= 1.5;
      if (b.sage_aura) def *= 1.3;
      let eva = this.getEvaRate();
      if (b.eva_up) eva += 0.3;
      if (b.flight) eva += 0.5;
      if (b.free) eva += 0.3;
      if (b.invisible) eva = 1.0;
      if (chance(eva)) { this.out(`◀ ${f.name} 회피!`); return; }
      if (b.invul_short) { this.out(`◀ ${f.name} 무적!`); return; }
      // 장비 proc: dodge_chance
      const procs = this.getProcs();
      if (procs.dodge_chance && chance(procs.dodge_chance)) {
        this.out(`◀ ${f.name} 공격 무시! [무효의 부적]`);
        return;
      }
      let dmg = Math.max(1, Math.round(atk - def*0.6));
      const trainBonus = this.trainBonus();
      if (procs.dmg_reduce)  dmg = Math.round(dmg * (1 - procs.dmg_reduce));
      if (trainBonus.dmgReduce) dmg = Math.round(dmg * (1 - trainBonus.dmgReduce));
      if (procs.mag_resist && (f.tags||[]).includes('mag')) dmg = Math.round(dmg * (1 - procs.mag_resist));
      this.state.hp -= dmg;
      this.out(`◀ ${f.name} ${dmg}`);
      // 반사
      if (procs.reflect_chance && chance(procs.reflect_chance)) {
        const back = Math.round(dmg * 0.8);
        f.hp -= back;
        this.out(`  ↻ 반사! ${f.name}에 ${back}`);
        if (f.hp <= 0) this.out(`  ${f.name} 쓰러짐.`);
      }
      if (f.soulLink) { const back = Math.round(dmg*0.3); f.hp -= back; this.out(`  ↻ 반사 ${back}`); if (f.hp<=0) this.out(`  ${f.name} 쓰러짐.`); }
    });
    if (b.regen) { const h = Math.round(this.getHpMax()*0.3); this.state.hp = Math.min(this.getHpMax(), this.state.hp + h); this.out(`  ✚ 기도 +${h}`); }
    Object.keys(b).forEach(k => {
      if (['sage_aura','cha_up','gold_up','accuracy_up','phantom_weapon','boss_slay','poison_plus','wealth'].includes(k)) return;
      b[k]--; if (b[k]<=0) delete b[k];
    });
    this.combat.foes.forEach(f => {
      ['mark','deathMark','huntMark','soulLink'].forEach(k => { if (f[k]) { f[k]--; if (f[k]<=0) delete f[k]; } });
    });
    if (this.state.hp <= 0) {
      const procs = this.getProcs();
      if (this.combat.reviveReady) { this.combat.reviveReady=false; this.state.hp = Math.round(this.getHpMax()*0.5); this.out(`\n✦ 소생술!`); }
      else if (this.combat.buffs.phylactery) { delete this.combat.buffs.phylactery; this.state.hp = Math.round(this.getHpMax()*0.5); this.out(`\n✦ 성물!`); }
      else if (this.combat.buffs.undying) { this.state.hp = 1; this.out(`\n✦ 불멸!`); }
      else if (this.combat.buffs.angel) { this.combat.buffs.angel--; this.state.hp = Math.round(this.getHpMax()*0.3); this.out(`\n✦ 수호천사!`); }
      else if (this.state.pet === 'phoenix' && !this.combat.phoenixUsed) {
        this.combat.phoenixUsed = true;
        this.state.hp = Math.round(this.getHpMax()*0.5);
        this.out(`\n🔥 불사조의 깃털! HP ${this.state.hp} 부활!`);
      }
      else if (procs.auto_revive && !this.combat.autoRevivedUsed) {
        this.combat.autoRevivedUsed = true;
        this.state.hp = Math.round(this.getHpMax() * 0.5);
        this.out(`\n✦ 장신구 발동! HP ${this.state.hp} 부활!`);
      }
      else { this.defeat(); return; }
    }
    this.combat.turn++;
    this.renderCombat();
    this.out('[명령: attack / skill / use / run]');
  }

  checkVictory() {
    if (!this.combat.foes.every(f => f.hp <= 0)) return false;
    let exp = 0, gold = 0, drops = [];
    this.combat.foes.forEach(f => {
      exp += f.exp; gold += f.gold;
      this.state.killCount[f.key] = (this.state.killCount[f.key]||0) + 1;
      if (f.boss) this.state.flags['boss_'+f.key+'_dead'] = true;
      // 드랍 (proc/종족 배율 적용, 엘리트 2배)
      let dropBoost = ((this.racePassive().drop_mul || 1) * (this.getProcs().drop_mul || 1));
      if (f.elite) dropBoost *= 2.0;
      (MONSTERS[f.key].drops||[]).forEach(([item, p]) => {
        if (chance(Math.min(1, p * dropBoost))) {
          this.state.inv[item] = (this.state.inv[item]||0) + 1;
          drops.push(ITEMS[item].name);
        }
      });
      // 퀘스트
      Object.entries(this.state.quests).forEach(([qid, q]) => {
        const qi = QUESTS[qid];
        if (!q.done && qi.target.monster === f.key) {
          q.progress = Math.min(qi.target.count, q.progress + 1);
          if (q.progress >= qi.target.count) this.out(`  ✓ [${qi.name}] 목표 달성! (complete ${qid})`);
        }
      });
    });
    if (this.combat.buffs.gold_up) gold *= 3;
    // 종족 패시브
    const rp = this.racePassive();
    if (rp.gold_mul)  gold = Math.round(gold * rp.gold_mul);
    if (rp.exp_mul)   exp  = Math.round(exp * rp.exp_mul);
    // 장신구 proc
    const procs = this.getProcs();
    if (procs.gold_mul)  gold = Math.round(gold * procs.gold_mul);
    // 수련 스킬 보너스
    const tb = this.trainBonus();
    if (tb.expMul)  exp  = Math.round(exp  * tb.expMul);
    if (tb.goldMul) gold = Math.round(gold * tb.goldMul);
    // 상인 스킬 보너스
    const trb = this.tradeBonus();
    if (trb.goldMul) gold = Math.round(gold * trb.goldMul);
    // 상인 계열은 전투 특화 직업이 아니므로 전투 XP -20% (거래 XP로 보상 받음)
    if (JOBS[this.state.job].line === 'merchant') exp = Math.round(exp * 0.8);
    // 드랍 proc 효과는 위에서 체크 필요하나 간단히 로그만
    this.state.exp += exp; this.state.gold += gold;
    this.out(`\n승리! EXP +${exp}, GOLD +${gold}`);
    if (drops.length) this.out(`  📦 드랍: ${drops.join(', ')}`);
    this.checkLevel();

    // 시련 모드 처리
    const wasTrialMode = this.combat.trialMode;
    this.combat = null;
    if (wasTrialMode) this.trialFinishBattle();
    return true;
  }

  defeat() {
    this.out(`\n✦ ${this.state.name}은(는) 쓰러졌다...`);
    if (this.combat && this.combat.trialMode) {
      this.out('시련에 실패. 다시 도전 가능.');
      this.trial = null;
      this.combat = null;
      this.state.hp = Math.round(this.getHpMax()*0.3);
      this.state.mp = Math.round(this.getMpMax()*0.3);
      return;
    }
    const lost = Math.round(this.state.gold*0.3);
    this.state.gold -= lost;
    this.state.hp = Math.round(this.getHpMax()*0.3);
    this.state.mp = Math.round(this.getMpMax()*0.3);
    this.state.location = 'heltant';
    this.advanceTime(12);
    this.out(`골드 ${lost} 소실. 12시간 후 헬턴트에서 깨어났다.`);
    this.combat = null;
  }

  // ════════════════ 레벨/분배/전직 ════════════════
  expForNext(lv) {
    // 고레벨일수록 가파른 곡선. Lv 150+는 진짜 고행.
    if (lv < 20)  return 80 + lv*lv*30;
    if (lv < 45)  return 2000 + (lv-20)*800;
    if (lv < 75)  return 30000 + (lv-45)*4000;      // 3차 구간
    if (lv < 120) return 160000 + (lv-75)*15000;    // 4차 구간
    if (lv < 150) return 840000 + (lv-120)*40000;   // 드래곤 전 구간
    if (lv < 200) return 2040000 + (lv-150)*100000; // 5차 구간
    return 7040000 + (lv-200)*300000;               // 신화급
  }

  checkLevel() {
    while (this.state.exp >= this.expForNext(this.state.lv)) {
      this.state.exp -= this.expForNext(this.state.lv);
      this.state.lv++;
      const job = JOBS[this.state.job];
      this.state.hpMaxBase += job.grow.hp;
      this.state.mpMaxBase += job.grow.mp;
      this.state.atkBase += job.grow.atk;
      this.state.defBase += job.grow.def;
      this.state.magBase += job.grow.mag;
      Object.keys(this.state.stats).forEach(k => this.state.stats[k]++);
      (job.mainStats||[]).forEach(k => this.state.stats[k]++);
      this.state.pendingPoints += 3;
      this.state.hp = this.getHpMax(); this.state.mp = this.getMpMax();
      this.out(`\n★ Lv.${this.state.lv}! 분배 +3 (총 ${this.state.pendingPoints})`);
      this.state.jobs.forEach(jk => JOBS[jk].skills.forEach(sk => {
        if (sk.lv === this.state.lv && !this.state.skills.includes(sk.id)) {
          learnSkill(this.state, sk.id);
          this.out(`  ✦ 스킬: [${JOBS[jk].name}] ${sk.name}`);
        }
      }));
      if (this.state.lv === 20) {
        const cs = Object.entries(JOBS).filter(([,j]) => j.from === this.state.job && j.tier === 2).map(([k])=>k);
        if (cs.length) this.out(`\n  ⚔ 2차 전직 가능: ${cs.join(', ')} → trial <직업>`);
      } else if (this.state.lv === 45) {
        const cs = Object.entries(JOBS).filter(([,j]) => j.from === this.state.job && j.tier === 3).map(([k])=>k);
        if (cs.length) this.out(`\n  ⚔ 3차 전직 가능: ${cs.join(', ')} → trial <직업>`);
      } else if (this.state.lv === 75) {
        const cs = Object.entries(JOBS).filter(([,j]) => (j.from === this.state.job || (j.altFrom||[]).includes(this.state.job)) && j.tier === 4).map(([k])=>k);
        if (cs.length) this.out(`\n  ⚔ 4차 전직 가능: ${cs.join(', ')} → trial <직업>`);
      } else if (this.state.lv === 120) {
        const cs = Object.entries(JOBS).filter(([,j]) => (j.from === this.state.job || (j.altFrom||[]).includes(this.state.job)) && j.tier === 5 && !j.hidden).map(([k])=>k);
        if (cs.length) this.out(`\n  ⚔ 5차 신화 전직 가능: ${cs.join(', ')} → trial <직업>`);
      }
      // 마스터리 체크 (4차 + Lv.90+ + 전 스킬)
      this.checkMastery();
    }
  }

  showMastery() {
    this.out('\n[직업 마스터리]');
    const m = this.state.masteredLines || [];
    this.out(`마스터한 계열: ${m.length}개  ${m.length === 0 ? '(없음)' : `— ${m.join(', ')}`}`);
    this.out(`\n조건: 4차 직업 + Lv.90 이상 + 해당 4차 직업의 모든 스킬 습득`);
    this.out(`보상: 주스탯 +5, HP +100 영구`);
    this.out(`\n마일스톤:`);
    this.out(`  3개 마스터 — ★ 파라곤(Paragon) 해금 (respec polymath)`);
    this.out(`  5개 마스터 — ★★ 반신(半神) 해금 (respec grand_unifier)`);
    if (m.length >= 3) this.out(`\n  ✓ 파라곤 사용 가능`, 'good');
    if (m.length >= 5) this.out(`  ✓ 반신 사용 가능`, 'good');
    // 조합 스킬
    const combos = this.availableCombos();
    if (combos.length) {
      this.out(`\n[사용 가능 조합 스킬 ${combos.length}개]`);
      combos.forEach(c => this.out(`  ${c.skill.name} — ${c.skill.desc}`));
    }
  }

  allocate(raw) {
    if (!raw) { this.out(`분배 ${this.state.pendingPoints}점. 예: allocate str 3`); return; }
    const [stat, num] = raw.trim().split(/\s+/);
    const n = parseInt(num, 10);
    if (!stat || !this.state.stats.hasOwnProperty(stat)) { this.out('스탯: str/dex/int/vit/wis/luk/cha'); return; }
    if (!n || n <= 0 || n > this.state.pendingPoints) { this.out(`0~${this.state.pendingPoints}`); return; }
    this.state.stats[stat] += n;
    this.state.pendingPoints -= n;
    this.out(`${stat.toUpperCase()} +${n} (남은 ${this.state.pendingPoints})`);
  }

  // ════════════════ 깨달음 시련 ════════════════
  startTrial(jobKey) {
    if (!jobKey) { this.out('trial <직업키> — 시련 후 advance 가능.'); return; }
    const target = JOBS[jobKey];
    if (!target || !target.from) { this.out('전직 직업이 아니다.'); return; }
    const trialValidFrom = [target.from].concat(target.altFrom || []);
    if (!trialValidFrom.includes(this.state.job)) { this.out(`현재 직업(${JOBS[this.state.job].name})에서 ${target.name}으로 전직 불가.`); return; }
    if (target.raceOnly && target.raceOnly !== this.state.race) { this.out(`${target.name}은 ${RACES[target.raceOnly].name} 전용.`); return; }
    if (this.state.lv < target.reqLv) { this.out(`Lv.${target.reqLv} 필요.`); return; }
    if (this.state.completedTrials[jobKey]) { this.out('이미 시련을 통과했다. advance 로 전직.'); return; }
    const trial = AWAKENINGS[jobKey];
    if (!trial) { this.out('시련이 정의되지 않은 직업.'); return; }
    // 재료 확인 (현자 등)
    if (trial.requireItems) {
      const missing = trial.requireItems.filter(it => !this.state.inv[it] || this.state.inv[it] < 1);
      if (missing.length) { this.out(`재료 부족: ${missing.map(k=>ITEMS[k].name).join(', ')}`); return; }
    }
    this.trial = { target: jobKey, stage: 'meditation' };
    this.out('\n══════════ 깨달음의 시련 ══════════');
    this.out(`【 ${trial.name} 】`);
    this.out(trial.intro);
    this.out('\n─── 1단계: 명상 ───');
    this.out(trial.meditation.q);
    trial.meditation.options.forEach((o, i) => this.out(`  ${i+1}. ${o}`));
    this.out('\n번호를 입력하라 (1, 2, 3)');
  }

  trialInput(text) {
    const trial = AWAKENINGS[this.trial.target];
    if (this.trial.stage === 'meditation') {
      const choice = parseInt(text, 10) - 1;
      if (isNaN(choice) || choice < 0 || choice >= trial.meditation.options.length) {
        this.out('번호를 입력하라.'); return;
      }
      if (choice !== trial.meditation.correct) {
        const hint = trial.meditation.hints[choice];
        this.out(`\n... 그것은 답이 아니다. ${hint}`);
        this.out('\n다시 명상하라:');
        this.out(trial.meditation.q);
        trial.meditation.options.forEach((o, i) => this.out(`  ${i+1}. ${o}`));
        return;
      }
      this.out(`\n✦ ${trial.meditation.options[choice]}`);
      this.out(`그대는 깊이 깨달았다.`);
      this.out('\n─── 2단계: 시련의 전투 ───');
      this.out('이제 그대의 깨달음을 행동으로 증명하라.');
      this.trial.stage = 'battle';
      this.startCombat(trial.battle.foes, true);
      return;
    }
  }

  trialFinishBattle() {
    const trial = AWAKENINGS[this.trial.target];
    this.out('\n─── 3단계: 깨달음 ───');
    this.out(trial.awakening);
    this.state.completedTrials[this.trial.target] = true;
    this.out(`\n✦ 시련 통과! [${trial.name}] — 이제 advance ${this.trial.target} 로 전직 가능.`);
    // 현자: 재료 소모
    if (trial.requireItems) {
      trial.requireItems.forEach(it => { this.state.inv[it]--; });
    }
    this.trial = null;
  }

  advance(jobKey) {
    if (!jobKey) { this.out('advance <직업>'); return; }
    const next = JOBS[jobKey];
    if (!next || !next.from) { this.out('전직 직업 아님.'); return; }
    const validFrom = [next.from].concat(next.altFrom || []);
    if (!validFrom.includes(this.state.job)) { this.out(`${validFrom.map(f => JOBS[f].name).join('/')}에서만 전직.`); return; }
    if (next.raceOnly && next.raceOnly !== this.state.race) {
      this.out(`${next.name}은 ${RACES[next.raceOnly].name} 전용.`);
      return;
    }
    if (this.state.lv < next.reqLv) { this.out(`Lv.${next.reqLv} 필요.`); return; }
    if (!this.state.completedTrials[jobKey]) { this.out(`먼저 시련을 통과해야 한다: trial ${jobKey}`); return; }
    if (this.state.gold < (next.cost||0)) { this.out(`${next.cost}G 필요.`); return; }
    const adv = ADVANCE_NPC[jobKey];
    if (adv && adv.loc !== this.state.location) { this.out(`${LOCATIONS[adv.loc].name}의 ${adv.npc}에게.`); return; }

    this.state.gold -= (next.cost||0);
    this.state.job = jobKey;
    this.state.jobs.push(jobKey);
    this.state.hpMaxBase += Math.round((next.base.hp - JOBS[next.from].base.hp)*0.5);
    this.state.mpMaxBase += Math.round((next.base.mp - JOBS[next.from].base.mp)*0.5);
    this.state.atkBase += Math.round((next.base.atk - JOBS[next.from].base.atk)*0.5);
    this.state.defBase += Math.round((next.base.def - JOBS[next.from].base.def)*0.5);
    this.state.magBase += Math.round((next.base.mag - JOBS[next.from].base.mag)*0.5);
    this.state.pendingPoints += 5;
    next.skills.forEach(sk => {
      if (sk.lv <= this.state.lv && !this.state.skills.includes(sk.id)) {
        learnSkill(this.state, sk.id);
        this.out(`  ✦ 스킬: ${sk.name}`);
      }
    });
    this.state.hp = this.getHpMax(); this.state.mp = this.getMpMax();
    this.out(`\n★★ 전직 완료! ${JOBS[this.state.job].name}!`);
    this.out(`  분배포인트 +5 (총 ${this.state.pendingPoints})`);
  }

  // ════════════════ NPC 대화 ════════════════
  talk(npcName) {
    const loc = LOCATIONS[this.state.location];
    if (!loc.npcs || !loc.npcs.some(n => n.includes(npcName))) { this.out('없다.'); return; }
    const npc = loc.npcs.find(n => n.includes(npcName));
    const advances = Object.entries(ADVANCE_NPC).filter(([,v]) => v.loc === this.state.location && v.npc === npc);
    const availAdvance = advances.map(([jk]) => ({ jk, j: JOBS[jk] }))
      .filter(({j}) => j.from === this.state.job && this.state.lv >= j.reqLv);
    const quest = Object.values(QUESTS).find(q => q.location === this.state.location && q.giver === npc &&
      this.state.lv >= q.requireLv && !this.state.quests[q.id]);

    const lines = {
      '촌장': '"마을 짐승이 시끄럽네."',
      '대장장이 게롤트': '"강철은 두드려야 나온다."',
      '술집주인 메이린': '"북방에서 용의 울음이 들린다더구나."',
      '장로 엘리안': '"바람이 심상치 않다."',
      '상인 실바나': '"엘프의 활은 흔치 않지."',
      '수색자 카일란': '"발자국을 읽는 법을 배우겠나?"',
      '왕궁 마법사 핸드레이크': '"드래곤 라자의 전승... 자네가 그 아이인가?"',
      '기사단장 리프크네': '"검을 든 자여, 왕국이 그대를 부른다."',
      '대주교 유스티스': '"신의 뜻이 그대와 함께."',
      '암살자 길드장': '"...그림자는 이미 그대를 안다."',
      '궁사 길드장 이무스': '"천 걸음 밖의 과녁을 맞출 수 있나?"',
      '국왕 다케온': '"아무르타트가 깨어났다."',
      '재상': '"폐하께서 부르실 것이오."',
      '암흑 사제 모르간': '"...죽음은 끝이 아닐세."',
      '대장장이 마스터 흐랄': '"미스릴은 비싸지만 값을 한다."',
      '상인 길드장 자히드': '"황금만큼 정직한 것은 없지."',
      '검투사 챔피언 라크살': '"투기장에서 살아남은 자만 진정한 전사다."',
      '수련생 알라잔': '"탑의 마지막 층까지 가본 적은 없네..."',
    };
    this.out('\n' + (lines[npc] || `${npc}: "..."`));
    if (quest) this.out(`  [📜 accept ${quest.id} — ${quest.name}]`);
    if (availAdvance.length) {
      this.out(`  [⚔ 전직 가능:]`);
      availAdvance.forEach(({jk, j}) => {
        const trialDone = this.state.completedTrials[jk] ? ' ✦시련완료' : '';
        this.out(`    ${jk.padEnd(14)} → ${j.name} (Lv.${j.reqLv}, ${j.cost}G)${trialDone}`);
      });
      this.out(`  [trial <직업> 으로 시련 시작 / advance <직업> 으로 전직]`);
    }
  }

  acceptQuest(id) {
    const q = QUESTS[id]; if (!q) { this.out('없음'); return; }
    if (this.state.quests[id]) { this.out('이미 수락'); return; }
    if (this.state.lv < q.requireLv) { this.out(`Lv.${q.requireLv} 필요`); return; }
    this.state.quests[id] = { progress: 0, done: false };
    this.out(`\n📜 [${q.name}] ${q.desc}`);
  }

  completeQuest(id) {
    const q = QUESTS[id], cur = this.state.quests[id];
    if (!q || !cur) { this.out('없음'); return; }
    if (cur.done) { this.out('완료됨'); return; }
    if (cur.progress < q.target.count) { this.out('미달성'); return; }
    cur.done = true;
    this.state.exp += q.reward.exp; this.state.gold += q.reward.gold;
    if (q.reward.item) {
      this.state.inv[q.reward.item] = (this.state.inv[q.reward.item]||0) + 1;
      this.out(`  보상 EXP+${q.reward.exp} GOLD+${q.reward.gold} [${ITEMS[q.reward.item].name}]`);
    } else this.out(`  보상 EXP+${q.reward.exp} GOLD+${q.reward.gold}`);
    this.checkLevel();
  }

  // ════════════════ 상점 / 무역 / 장비 ════════════════
  shop() {
    const list = SHOP_ITEMS[this.state.location];
    if (!list && !this.state.flags.black_market) { this.out('상점 없다.'); return; }
    const useList = list || ['potion_l', 'ether_l', 'sword', 'plate'];
    const disc = this.getShopDisc();
    this.out('\n[🛒 상점]');
    if (disc > 0) this.out(`  CHA 할인: -${(disc*100).toFixed(1)}%`);
    useList.forEach(k => {
      const it = ITEMS[k];
      const price = Math.round(it.price * (1 - disc));
      this.out(`  ${k.padEnd(18)} ${price.toString().padStart(5)}G  ${it.name} — ${it.desc}`);
    });
    this.out('  buy <키> / sell <키>');
  }

  buy(key) {
    const list = SHOP_ITEMS[this.state.location];
    if ((!list || !list.includes(key)) && !this.state.flags.black_market) { this.out('여긴 그 아이템 없다.'); return; }
    const it = ITEMS[key]; if (!it) { this.out('아이템 없음.'); return; }
    const price = Math.round(it.price * (1 - this.getShopDisc()));
    if (this.state.gold < price) { this.out('골드 부족.'); return; }
    this.state.gold -= price;
    this.state.inv[key] = (this.state.inv[key]||0) + 1;
    this.out(`${it.name} 구매 (-${price}G)`);
  }

  sell(key) {
    if (!this.state.inv[key] || this.state.inv[key]<=0) { this.out('없음'); return; }
    const it = ITEMS[key];
    const price = Math.round((it.price||10)*0.5);
    this.state.inv[key]--;
    this.state.gold += price;
    this.out(`${it.name} 판매 (+${price}G)`);
  }

  useItem(arg) { this.cUse(arg); }

  equip(key) {
    if (!this.state.inv[key]) { this.out('없음'); return; }
    const it = ITEMS[key];
    if (!['weapon','armor','acc'].includes(it.type)) { this.out('장비 불가'); return; }
    if (it.restricted) {
      const myLine = JOBS[this.state.job].line;
      if (!it.restricted.includes(myLine)) { this.out(`${it.restricted.join(',')} 계열 전용 장비.`); return; }
    }
    const slot = it.type;
    if (this.state.equip[slot]) {
      const prev = this.state.equip[slot];
      this.state.inv[prev] = (this.state.inv[prev]||0) + 1;
    }
    this.state.equip[slot] = key;
    this.state.inv[key]--;
    this.out(`${it.name} 장착.`);
  }

  unequip(slot) {
    if (!['weapon','armor','acc'].includes(slot)) { this.out('weapon/armor/acc'); return; }
    const cur = this.state.equip[slot];
    if (!cur) { this.out('빈 슬롯'); return; }
    this.state.inv[cur] = (this.state.inv[cur]||0) + 1;
    this.state.equip[slot] = null;
    this.out(`${ITEMS[cur].name} 해제`);
  }

  rest() {
    const loc = LOCATIONS[this.state.location];
    // 저택 보유 시 무료
    const myProp = Object.entries(this.state.properties || {}).find(([k]) => PROPERTIES[k].loc === this.state.location);
    if (myProp) {
      this.state.hp = this.getHpMax(); this.state.mp = this.getMpMax();
      this.advanceTime(8);
      this.out(`✦ 보유 저택(${PROPERTIES[myProp[0]].name})에서 휴식. 무료. HP/MP 완전회복.`);
      this.out(`현재 ${this.timeStr()}`);
      return;
    }
    if (!loc.inn) { this.out('여관 없음'); return; }
    let cost = 20 + this.state.lv * 5;
    if (this.state.title) cost = Math.max(0, cost - 20);  // 작위 할인
    if (this.state.gold < cost) { this.out(`${cost}G 필요`); return; }
    this.state.gold -= cost;
    this.state.hp = this.getHpMax(); this.state.mp = this.getMpMax();
    this.advanceTime(8);
    this.out(`여관에서 8시간 휴식. (-${cost}G) HP/MP 완전회복`);
    this.out(`현재 ${this.timeStr()}`);
  }

  // ════════════════ 무역 시스템 (시세차익) ════════════════
  // 상품별 평균 매입가 유지 → 매도 시 이익 계산
  // state.tradeInv[key] = 보유 수량
  // state.tradeBook[key] = 총 매입 지출 (평균가 계산용)
  // state.totalTradeProfit = 누적 이익 (스킬 해금용)

  trade(arg) {
    const here = TRADE_PRICES[this.state.location];
    if (!here) { this.out('이 지역엔 거래소가 없다.'); return; }
    if (!arg) { this.showTradePrices(); return; }
    const parts = arg.trim().split(/\s+/);
    const action = parts[0], item = parts[1], qty = parseInt(parts[2]||'1', 10);
    if (action === 'buy')  return this.tradeBuy(item, qty);
    if (action === 'sell') return this.tradeSell(item, qty);
    this.out('trade [buy|sell] <상품> [수량]');
  }

  // 상인 스킬 bonus 합산
  tradeBonus() {
    const acc = { tradeMul: 1, shopDisc: 0, goldMul: 1, dropMul: 1, safeTravel: 0 };
    const learned = this.state.tradeSkills || [];
    TRADE_SKILLS.forEach(ts => {
      if (!learned.includes(ts.id)) return;
      const e = ts.effect || {};
      if (e.tradeMul) acc.tradeMul *= e.tradeMul;
      if (e.shopDisc) acc.shopDisc += e.shopDisc;
      if (e.goldMul)  acc.goldMul *= e.goldMul;
      if (e.dropMul)  acc.dropMul *= e.dropMul;
      if (e.safeTravel) acc.safeTravel = Math.max(acc.safeTravel, e.safeTravel);
    });
    return acc;
  }

  addTradeProfit(profit) {
    if (profit <= 0) return;
    if (!this.state.totalTradeProfit) this.state.totalTradeProfit = 0;
    if (!this.state.tradeSkills) this.state.tradeSkills = [];
    this.state.totalTradeProfit += profit;
    // 상인 계열 특화: 거래 XP 대폭 증가
    // 상인: 이익 × 0.50  /  일반: 이익 × 0.15
    const isMerch = JOBS[this.state.job].line === 'merchant';
    const xp = Math.round(profit * (isMerch ? 0.50 : 0.15));
    if (xp > 0) {
      this.state.exp += xp;
      this.out(`  ✦ 거래 EXP +${xp}${isMerch ? ' (상인 특화)' : ''}`);
      this.checkLevel();
    }
    // 스킬 해금 체크
    const unlocked = [];
    TRADE_SKILLS.forEach(ts => {
      if (!this.state.tradeSkills.includes(ts.id) && this.state.totalTradeProfit >= ts.reqProfit) {
        this.state.tradeSkills.push(ts.id);
        unlocked.push(ts);
      }
    });
    if (unlocked.length) {
      this.out('\n═══ 상인 스킬 해금 ═══', 'title');
      unlocked.forEach(ts => this.out(`  ✦ [${ts.name}] — ${ts.desc}`, 'good'));
    }
  }

  showTradePrices() {
    const here = TRADE_PRICES[this.state.location];
    this.out(`\n[📦 ${LOCATIONS[this.state.location].name} 거래소]`);
    this.out(`  상품            시세    매도시 수령  보유  평균 매입`);
    Object.entries(here).forEach(([k, price]) => {
      const have = (this.state.tradeInv||{})[k] || 0;
      const book = (this.state.tradeBook||{})[k] || 0;
      const avg = have > 0 ? Math.round(book / have) : 0;
      const sellReceive = Math.round(price * TRADE_SELL_TAX);
      this.out(`  ${TRADE_GOODS[k].name.padEnd(14)} ${String(price).padStart(5)}G  ${String(sellReceive).padStart(5)}G      x${have.toString().padStart(3)}  ${avg ? avg + 'G' : '-'}`);
    });
    // 다른 도시 시세 비교 (최고 매도지 표시)
    this.out('\n  [💡 다른 도시 시세 — 같은 상품 어디서 팔면 이득?]');
    const goodsHere = Object.keys(here);
    goodsHere.forEach(k => {
      const myPrice = here[k];
      const bookAvg = ((this.state.tradeBook||{})[k]) / Math.max(1, ((this.state.tradeInv||{})[k] || 1));
      const bases = Object.entries(TRADE_PRICES)
        .filter(([city, prices]) => city !== this.state.location && prices[k])
        .map(([city, prices]) => ({ city, price: prices[k], profit: Math.round(prices[k] * TRADE_SELL_TAX - myPrice) }))
        .sort((a, b) => b.profit - a.profit);
      if (bases.length === 0) return;
      const best = bases[0];
      const sign = best.profit > 0 ? '+' : '';
      this.out(`    ${TRADE_GOODS[k].name.padEnd(12)} → ${LOCATIONS[best.city].name} 시세 ${best.price}G (매입가 대비 개당 ${sign}${best.profit}G)`);
    });
    // 누적 이익
    this.out(`\n  누적 거래 이익: ${(this.state.totalTradeProfit||0).toLocaleString()}G`);
  }

  tradeBuy(key, qty) {
    const here = TRADE_PRICES[this.state.location];
    if (!here || !here[key]) { this.out('이 거래소엔 그 상품 없다.'); return; }
    const price = Math.round(here[key] * TRADE_BUY_MARKUP) * qty;
    if (this.state.gold < price) { this.out(`골드 부족 (${price}G).`); return; }
    this.state.gold -= price;
    if (!this.state.tradeInv) this.state.tradeInv = {};
    if (!this.state.tradeBook) this.state.tradeBook = {};
    this.state.tradeInv[key] = (this.state.tradeInv[key]||0) + qty;
    this.state.tradeBook[key] = (this.state.tradeBook[key]||0) + price;
    this.out(`${TRADE_GOODS[key].name} x${qty} 매입 (-${price}G, 개당 ${here[key]}G)`);
  }

  tradeSell(key, qty) {
    const have = (this.state.tradeInv||{})[key] || 0;
    if (have < qty) { this.out(`보유량 부족 (${have}개).`); return; }
    const here = TRADE_PRICES[this.state.location];
    if (!here || !here[key]) { this.out('이 거래소는 그 상품을 사지 않는다.'); return; }
    const book = (this.state.tradeBook||{})[key] || 0;
    const avgCost = have > 0 ? book / have : 0;
    const sellPerUnit = Math.round(here[key] * TRADE_SELL_TAX);
    const received = sellPerUnit * qty;
    const costShare = Math.round(avgCost * qty);
    const rawProfit = received - costShare;
    // 상인 스킬 이익 배율
    const tb = this.tradeBonus();
    const profit = Math.round(rawProfit * tb.tradeMul);
    const finalReceived = received + (profit - rawProfit); // 이익에만 배율 적용
    this.state.tradeInv[key] -= qty;
    this.state.tradeBook[key] = Math.max(0, (this.state.tradeBook[key]||0) - costShare);
    this.state.gold += finalReceived;
    const sign = profit >= 0 ? '+' : '';
    this.out(`${TRADE_GOODS[key].name} x${qty} 매도 (+${finalReceived}G)`);
    this.out(`  평균 매입 개당 ${Math.round(avgCost)}G · 이익 ${sign}${profit}G`);
    if (profit > 0) this.addTradeProfit(profit);
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { Game };
if (typeof window !== 'undefined') window.__GAME_ENGINE__ = { Game };
