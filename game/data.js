// 드래곤 라자 세계관 텍스트 RPG
// 35 직업 (5→10→20), 7 스탯, 전직 시스템
// ※ 이영도 작가의 "드래곤 라자" 세계관에서 모티브

const WORLD = {
  name: '바이서스 왕국',
  intro: `때는 폴라리스력 1011년.
북부의 용 '아무르타트'가 깨어나고, 남부에서는 오크 부족이 결집하며 대륙은 혼란에 빠졌다.
전설에 따르면, 드래곤과 대화할 수 있는 단 한 사람 '드래곤 라자'만이 이 혼돈을 잠재울 수 있다 한다.
헬턴트의 작은 마을에서 자란 그대는, 오늘 운명의 첫걸음을 내딛는다.`,
};

// ───── 종족 (7스탯 + 전용 직업 + 패시브) ─────
const RACES = {
  human:   { name: '인간',     desc: '균형잡힌 능력치. 어디서든 적응한다.',        mod: { str:0,  dex:0,  int:0,  vit:0,  wis:1,  luk:1,  cha:1 },
    passive: { name: '적응력',       desc: '모든 경험치 획득 +10%',       exp_mul: 1.10 } },
  elf:     { name: '엘프',     desc: '정령과 대화하는 숲의 종족.',                 mod: { str:-1, dex:2,  int:2,  vit:-1, wis:2,  luk:0,  cha:1 },
    passive: { name: '정령 친화',    desc: '마법 피해 +15%',              mag_mul: 1.15 } },
  dwarf:   { name: '드워프',   desc: '대장장이의 민족. 단단하고 고집스럽다.',      mod: { str:2,  dex:-1, int:0,  vit:2,  wis:1,  luk:-1, cha:-2 },
    passive: { name: '광맥의 눈',    desc: '골드·드랍 +25%',              gold_mul: 1.25, drop_mul: 1.25 } },
  halfelf: { name: '하프엘프', desc: '두 세계 사이에 선 자. 외로우나 자유롭다.',   mod: { str:0,  dex:1,  int:1,  vit:0,  wis:1,  luk:1,  cha:2 },
    passive: { name: '타고난 흥정꾼', desc: '상점·무역 -15%',              shop_disc: 0.15 } },
  ogre:    { name: '오우거',   desc: '문명화된 거인. 후치의 친구들이다.',          mod: { str:3,  dex:-2, int:-1, vit:3,  wis:0,  luk:0,  cha:-3 },
    passive: { name: '거체',         desc: 'HP 최대치 +30%',              hp_mul: 1.30 } },
};

// ───── 직업 (35개: 5 + 10 + 20) ─────
// tier 1 → tier 2 (Lv 20) → tier 3 (Lv 45)
const JOBS = {
  // ═════════════ 1차 5직업 (Lv 1~) ═════════════
  warrior: {
    tier: 1, name: '전사', line: 'warrior',
    desc: '검과 방패. 바이서스 정규군 출신.',
    base: { hp: 120, mp: 20, atk: 14, def: 10, mag: 4 },
    grow: { hp: 18, mp: 3, atk: 3, def: 2, mag: 0 },
    mainStats: ['str', 'vit'],
    skills: [
      { id: 'slash',   name: '강타',     lv: 1,  mp: 6,  power: 1.6, type: 'phys',     desc: '강한 일격.' },
      { id: 'guard',   name: '방어태세', lv: 3,  mp: 8,              type: 'buff', effect: 'def_up', turns: 3, desc: '방어력 +50% (3턴).' },
      { id: 'whirl',   name: '회전베기', lv: 6,  mp: 14, power: 1.3, type: 'phys_aoe', desc: '모든 적을 벤다.' },
      { id: 'execute', name: '처형',     lv: 10, mp: 20, power: 2.4, type: 'phys',     effect: 'finisher', desc: '빈사의 적에게 치명타.' },
    ],
  },
  mage: {
    tier: 1, name: '마법사', line: 'mage',
    desc: '공주의 탑에서 수학한 견습 현자.',
    base: { hp: 70, mp: 80, atk: 4, def: 5, mag: 16 },
    grow: { hp: 9, mp: 12, atk: 0, def: 1, mag: 3 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'fireball', name: '화염구',   lv: 1,  mp: 8,  power: 1.6, type: 'mag',     desc: '화염 투사체.' },
      { id: 'icebolt',  name: '얼음화살', lv: 3,  mp: 10, power: 1.4, type: 'mag',     effect: 'slow',  desc: '적 속도 감소.' },
      { id: 'thunder',  name: '낙뢰',     lv: 6,  mp: 18, power: 2.0, type: 'mag_aoe', desc: '전 적에게 번개.' },
      { id: 'meteor',   name: '메테오',   lv: 12, mp: 40, power: 3.5, type: 'mag_aoe', desc: '유성을 떨어뜨린다.' },
    ],
  },
  priest: {
    tier: 1, name: '사제', line: 'priest',
    desc: '헬카네스 신전의 신관. 치유와 성법.',
    base: { hp: 90, mp: 70, atk: 6, def: 8, mag: 12 },
    grow: { hp: 12, mp: 10, atk: 1, def: 2, mag: 2 },
    mainStats: ['wis', 'vit'],
    skills: [
      { id: 'heal',   name: '치유',   lv: 1,  mp: 10, type: 'heal', power: 1.8, desc: 'HP 회복.' },
      { id: 'smite',  name: '천벌',   lv: 2,  mp: 8,  power: 1.4,   type: 'mag', desc: '신성 데미지.' },
      { id: 'bless',  name: '축복',   lv: 5,  mp: 14, type: 'buff', effect: 'atk_up', turns: 3, desc: '공격력 +40% (3턴).' },
      { id: 'revive', name: '소생술', lv: 10, mp: 50, type: 'revive', desc: '전투 중 1회 부활.' },
    ],
  },
  thief: {
    tier: 1, name: '도적', line: 'thief',
    desc: '팔라레온의 그림자. 빠르고 약삭빠르다.',
    base: { hp: 85, mp: 40, atk: 12, def: 6, mag: 6 },
    grow: { hp: 11, mp: 6, atk: 3, def: 1, mag: 1 },
    mainStats: ['dex', 'luk'],
    skills: [
      { id: 'backstab', name: '기습',       lv: 1, mp: 5,  power: 1.8, type: 'phys',    effect: 'crit_plus', desc: '크리티컬 확률 증가.' },
      { id: 'poison',   name: '독묻히기',   lv: 3, mp: 8,               type: 'debuff', effect: 'poison',    turns: 4, desc: '독 DoT (4턴).' },
      { id: 'shadow',   name: '그림자분신', lv: 7, mp: 18,              type: 'buff',   effect: 'eva_up',    turns: 3, desc: '회피 +50% (3턴).' },
      { id: 'steal',    name: '훔치기',     lv: 5, mp: 6,                type: 'utility', effect: 'steal_gold', desc: '적 골드를 훔친다.' },
    ],
  },
  ranger: {
    tier: 1, name: '궁사', line: 'ranger',
    desc: '엘프의 숲에서 훈련받은 사냥꾼.',
    base: { hp: 95, mp: 45, atk: 13, def: 7, mag: 5 },
    grow: { hp: 13, mp: 6, atk: 3, def: 1, mag: 1 },
    mainStats: ['dex', 'str'],
    skills: [
      { id: 'aimshot',   name: '정조준', lv: 1,  mp: 6,  power: 1.5, type: 'phys',     desc: '명중 +. 강타.' },
      { id: 'multi',     name: '연사',   lv: 4,  mp: 12, power: 0.8, type: 'phys',     hits: 3, desc: '3연속 공격.' },
      { id: 'arrowrain', name: '화살비', lv: 8,  mp: 20, power: 1.4, type: 'phys_aoe', desc: '전 적 공격.' },
      { id: 'snipe',     name: '저격',   lv: 12, mp: 25, power: 3.0, type: 'phys',     effect: 'crit_plus', desc: '치명적 일격.' },
    ],
  },
  // ═════════════ 종족 전용 1차 직업 ═════════════
  hero: {
    tier: 1, name: '영웅', line: 'hero', raceOnly: 'human',
    desc: '인간의 가능성 그 자체. 무엇이든 배우는 만능.',
    base: { hp: 110, mp: 55, atk: 13, def: 9, mag: 11 },
    grow: { hp: 15, mp: 7, atk: 2, def: 2, mag: 2 },
    mainStats: ['str', 'cha'],
    skills: [
      { id: 'hero_strike', name: '영웅의 일격', lv: 1, mp: 6, power: 1.6, type: 'phys', desc: '단일 강타.' },
      { id: 'inspire',     name: '고무',       lv: 3, mp: 10, type: 'buff', effect: 'atk_up', turns: 3, desc: '공격 +40%.' },
      { id: 'hero_guard',  name: '영웅의 수호', lv: 6, mp: 14, type: 'buff', effect: 'dmg_reduce', turns: 4, desc: '받는 피해 -40%.' },
      { id: 'heroic_aura', name: '영웅의 아우라', lv: 10, mp: 22, type: 'buff', effect: 'all_up', turns: 4, desc: '전 능력 +30%.' },
    ],
  },
  spiritcaller: {
    tier: 1, name: '정령술사', line: 'spiritcaller', raceOnly: 'elf',
    desc: '4대 정령과 대화하는 엘프의 기예.',
    base: { hp: 65, mp: 100, atk: 4, def: 6, mag: 20 },
    grow: { hp: 8, mp: 14, atk: 0, def: 1, mag: 4 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'summon_flame', name: '화염 정령',   lv: 1, mp: 10, power: 1.8, type: 'mag', effect: 'burn', turns: 3, desc: '불의 정령 소환.' },
      { id: 'summon_wind',  name: '바람 정령',   lv: 3, mp: 12, type: 'buff', effect: 'eva_up', turns: 3, desc: '회피 +40%.' },
      { id: 'summon_water', name: '물 정령',     lv: 5, mp: 14, type: 'heal', power: 2.2, desc: '치유의 물.' },
      { id: 'elem_rage',    name: '정령의 분노', lv: 10, mp: 28, power: 2.4, type: 'mag_aoe', desc: '4원소 대폭발.' },
    ],
  },
  runemaster: {
    tier: 1, name: '룬마스터', line: 'runemaster', raceOnly: 'dwarf',
    desc: '고대 룬을 새기는 드워프의 비기.',
    base: { hp: 120, mp: 65, atk: 14, def: 13, mag: 14 },
    grow: { hp: 16, mp: 7, atk: 3, def: 3, mag: 2 },
    mainStats: ['str', 'int'],
    skills: [
      { id: 'rune_strike',  name: '룬 일격',   lv: 1, mp: 8, power: 1.6, type: 'phys', effect: 'pierce_def', desc: '방어 무시.' },
      { id: 'rune_shield',  name: '룬 방벽',   lv: 3, mp: 12, type: 'buff', effect: 'def_up_big', turns: 4, desc: '방어 +80%.' },
      { id: 'rune_enchant', name: '룬 부여',   lv: 6, mp: 16, type: 'buff', effect: 'atk_up_big', turns: 4, desc: '공격 +60%.' },
      { id: 'ancient_rune', name: '고대 룬',   lv: 10, mp: 25, power: 2.2, type: 'phys_aoe', desc: '고대 룬 폭발.' },
    ],
  },
  titan: {
    tier: 1, name: '거신투사', line: 'titan', raceOnly: 'ogre',
    desc: '거대한 체구와 원시적 힘.',
    base: { hp: 160, mp: 20, atk: 19, def: 13, mag: 2 },
    grow: { hp: 22, mp: 3, atk: 4, def: 2, mag: 0 },
    mainStats: ['str', 'vit'],
    skills: [
      { id: 'titan_slam',  name: '거신 슬램', lv: 1, mp: 6, power: 2.0, type: 'phys', effect: 'stun', turns: 1, desc: '기절 1턴.' },
      { id: 'titan_roar',  name: '거신의 포효', lv: 3, mp: 10, type: 'buff', effect: 'atk_up_big', turns: 3, desc: '공격 +60%.' },
      { id: 'earthquake',  name: '대지 진동', lv: 6, mp: 18, power: 1.6, type: 'phys_aoe', effect: 'stun', turns: 1, desc: '전체 기절.' },
      { id: 'titan_rage',  name: '거신의 분노', lv: 10, mp: 25, type: 'buff', effect: 'berserk', turns: 4, desc: '광폭화.' },
    ],
  },
  bard: {
    tier: 1, name: '음유시인', line: 'bard', raceOnly: 'halfelf',
    desc: '노래와 시로 전장을 뒤바꾸는 자.',
    base: { hp: 85, mp: 75, atk: 9, def: 7, mag: 13 },
    grow: { hp: 11, mp: 10, atk: 2, def: 1, mag: 2 },
    mainStats: ['cha', 'dex'],
    skills: [
      { id: 'battle_song',  name: '전투의 노래', lv: 1, mp: 8, type: 'buff', effect: 'atk_up', turns: 3, desc: '공격 +40%.' },
      { id: 'healing_song', name: '치유의 선율', lv: 3, mp: 12, type: 'heal', power: 2.0, desc: 'HP 회복.' },
      { id: 'cacophony',    name: '불협화음',   lv: 6, mp: 14, power: 1.3, type: 'mag_aoe', effect: 'fear', turns: 2, desc: '공포.' },
      { id: 'epic_ballad',  name: '서사 발라드', lv: 10, mp: 25, type: 'buff', effect: 'all_up', turns: 4, desc: '전 능력 +40%.' },
    ],
  },

  merchant: {
    tier: 1, name: '상인', line: 'merchant',
    desc: '돈이 곧 힘. 흥정과 거래의 달인.',
    base: { hp: 80, mp: 40, atk: 8, def: 6, mag: 6 },
    grow: { hp: 11, mp: 5, atk: 2, def: 1, mag: 1 },
    mainStats: ['cha', 'luk'],
    skills: [
      { id: 'coin_toss',     name: '동전 던지기', lv: 1,  mp: 4, power: 1.2, type: 'phys', effect: 'gold_dmg', desc: '소량 골드 소모, 데미지 +.' },
      { id: 'bargain',       name: '흥정',       lv: 3,  mp: 8,             type: 'buff', effect: 'cha_up', turns: 99, desc: '상점 할인 +30% (영구 패시브).' },
      { id: 'appraise',      name: '감정',       lv: 5,  mp: 10,            type: 'utility', effect: 'reveal', desc: '적 약점 노출 (받는 데미지 +30% 영구).' },
      { id: 'gold_strike',   name: '황금 일격',   lv: 10, mp: 20, power: 2.0, type: 'phys', effect: 'gold_strike', desc: '소지 골드에 비례한 추가 피해.' },
    ],
  },
  // ─── merchant 계열 2차 ───
  trader: {
    tier: 2, name: '무역상', from: 'merchant', reqLv: 20, cost: 1500, line: 'merchant',
    desc: '대륙을 누비는 상인. 거상의 길.',
    base: { hp: 200, mp: 90, atk: 24, def: 18, mag: 14 },
    grow: { hp: 14, mp: 7, atk: 3, def: 2, mag: 1 },
    mainStats: ['cha', 'luk'],
    skills: [
      { id: 'bulk_strike',   name: '대량 타격',  lv: 20, mp: 14, power: 1.4, type: 'phys_aoe', desc: '전 적 강타.' },
      { id: 'caravan',       name: '캐러밴',    lv: 24, mp: 20,             type: 'buff', effect: 'gold_up', turns: 99, desc: '획득 골드/거래 이익 +50%.' },
      { id: 'gem_throw',     name: '보석 투척',  lv: 28, mp: 18, power: 2.0, type: 'phys', effect: 'crit_plus', desc: '값비싼 일격.' },
      { id: 'rich_blessing', name: '풍요의 축복', lv: 34, mp: 25,            type: 'buff', effect: 'all_up', turns: 4, desc: '전 능력치 +25%.' },
    ],
  },
  informer: {
    tier: 2, name: '정보상', from: 'merchant', reqLv: 20, cost: 1500, line: 'merchant',
    desc: '비밀을 사고파는 자. 약점이 무기다.',
    base: { hp: 180, mp: 130, atk: 20, def: 15, mag: 22 },
    grow: { hp: 13, mp: 9, atk: 2, def: 2, mag: 2 },
    mainStats: ['int', 'cha'],
    skills: [
      { id: 'weakness',      name: '약점 분석', lv: 20, mp: 12,             type: 'debuff', effect: 'mark', turns: 5, desc: '적 받는 피해 +50%.' },
      { id: 'foresight',     name: '예지',     lv: 24, mp: 16,             type: 'buff', effect: 'eva_up', turns: 4, desc: '회피 +50%.' },
      { id: 'deception',     name: '기만',     lv: 28, mp: 20,             type: 'debuff', effect: 'blind', turns: 4, desc: '적 명중 -60%.' },
      { id: 'info_blast',    name: '정보 폭발', lv: 34, mp: 28, power: 2.5, type: 'mag', desc: '치명적 비밀 공개.' },
    ],
  },
  // ─── merchant 계열 3차 ───
  guildmaster: {
    tier: 3, name: '길드마스터', from: 'trader', reqLv: 45, cost: 10000, line: 'merchant',
    desc: '거대 상단의 정점. 황금이 곧 군대다.',
    base: { hp: 480, mp: 280, atk: 70, def: 50, mag: 50 },
    grow: { hp: 24, mp: 12, atk: 4, def: 3, mag: 3 },
    mainStats: ['cha', 'int'],
    skills: [
      { id: 'mercenary',  name: '용병 호출',   lv: 45, mp: 50, power: 2.0, type: 'phys_aoe', desc: '용병들이 적을 친다.' },
      { id: 'gold_river', name: '황금의 강',   lv: 48, mp: 40,            type: 'buff', effect: 'gold_up', turns: 99, desc: '골드 획득 +200% (영구).' },
      { id: 'guild_aura', name: '길드의 비호', lv: 55, mp: 50,            type: 'buff', effect: 'all_up_big', turns: 5, desc: '전 능력 +50%.' },
      { id: 'auction',    name: '경매',       lv: 62, mp: 60, power: 4.0, type: 'phys', effect: 'gold_strike', desc: '소지 골드 비례 초강타.' },
    ],
  },
  goldking: {
    tier: 3, name: '황금왕', from: 'trader', reqLv: 45, cost: 10000, line: 'merchant',
    desc: '돈으로 신을 살 수 있다 믿는 자.',
    base: { hp: 460, mp: 260, atk: 75, def: 45, mag: 55 },
    grow: { hp: 23, mp: 11, atk: 5, def: 3, mag: 3 },
    mainStats: ['cha', 'luk'],
    skills: [
      { id: 'midas',         name: '미다스의 손', lv: 45, mp: 35, power: 2.5, type: 'phys', effect: 'gold_drain', desc: '적의 골드/생명을 흡수.' },
      { id: 'wealth_aura',   name: '부의 기운',  lv: 48, mp: 40,            type: 'buff', effect: 'wealth', turns: 99, desc: '소지 골드 비례 공/방 +.' },
      { id: 'gold_meteor',   name: '황금 운석',  lv: 55, mp: 50, power: 3.5, type: 'phys_aoe', desc: '황금 폭격.' },
      { id: 'eternal_riches',name: '영원한 부',  lv: 62, mp: 55,            type: 'buff', effect: 'all_up_big', turns: 5, desc: '전 능력 +50%.' },
    ],
  },
  shadowmerchant: {
    tier: 3, name: '그림자상인', from: 'informer', reqLv: 45, cost: 10000, line: 'merchant',
    desc: '암시장의 군주. 모든 비밀을 거래한다.',
    base: { hp: 430, mp: 320, atk: 65, def: 40, mag: 75 },
    grow: { hp: 22, mp: 14, atk: 4, def: 3, mag: 4 },
    mainStats: ['int', 'cha'],
    skills: [
      { id: 'black_market', name: '암시장 호출', lv: 45, mp: 45,             type: 'utility', effect: 'shop_open', desc: '어디서든 상점 열기.' },
      { id: 'shadow_deal',  name: '그림자 거래', lv: 48, mp: 30, power: 2.5, type: 'mag', effect: 'lifesteal', desc: '거래의 일격.' },
      { id: 'whisper',      name: '속삭임',     lv: 55, mp: 35,             type: 'debuff', effect: 'fear', turns: 3, desc: '공포.' },
      { id: 'truth_unveil', name: '진실의 폭로', lv: 62, mp: 55, power: 4.0, type: 'mag_aoe', effect: 'mark', turns: 4, desc: '전체 약점 노출.' },
    ],
  },
  informerking: {
    tier: 3, name: '정보왕', from: 'informer', reqLv: 45, cost: 10000, line: 'merchant',
    desc: '대륙의 모든 정보가 그대 손에. 왕도 두려워한다.',
    base: { hp: 410, mp: 360, atk: 60, def: 38, mag: 80 },
    grow: { hp: 21, mp: 16, atk: 4, def: 3, mag: 5 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'omniscience', name: '전지',       lv: 45, mp: 40,             type: 'buff', effect: 'all_up_big', turns: 5, desc: '모든 것을 안다 — 전 능력 +50%.' },
      { id: 'mind_break',  name: '정신 붕괴',  lv: 48, mp: 35, power: 3.0, type: 'mag', effect: 'fear', turns: 3, desc: '정신 파괴.' },
      { id: 'prophecy',    name: '예언',       lv: 55, mp: 50,             type: 'utility', effect: 'extra_turn', desc: '미래를 보고 추가 턴.' },
      { id: 'truth_blast', name: '진실의 일격', lv: 62, mp: 60, power: 4.5, type: 'mag', effect: 'pierce_def', desc: '진실은 모든 거짓을 꿰뚫는다.' },
    ],
  },

  // ═════════════ 2차 10직업 (Lv 20~) ═════════════
  // ─── warrior 계열 ───
  knight: {
    tier: 2, name: '기사', from: 'warrior', reqLv: 20, cost: 1000, line: 'warrior',
    desc: '바이서스의 수호기사. 방어와 지휘에 능하다.',
    base: { hp: 280, mp: 60, atk: 32, def: 28, mag: 12 },
    grow: { hp: 22, mp: 4, atk: 3, def: 3, mag: 1 },
    mainStats: ['vit', 'str'],
    skills: [
      { id: 'shield_bash', name: '방패치기',   lv: 20, mp: 12, power: 1.5, type: 'phys', effect: 'stun',       turns: 1, desc: '기절 1턴.' },
      { id: 'fortress',    name: '철벽',       lv: 23, mp: 18,             type: 'buff', effect: 'def_up_big', turns: 4, desc: '방어 +80% (4턴).' },
      { id: 'taunt',       name: '도발',       lv: 27, mp: 10,             type: 'buff', effect: 'taunt',      turns: 3, desc: '적의 공격을 유도.' },
      { id: 'iron_will',   name: '철의 의지', lv: 32, mp: 20,              type: 'buff', effect: 'dmg_reduce', turns: 3, desc: '받는 피해 -40% (3턴).' },
    ],
  },
  gladiator: {
    tier: 2, name: '검투사', from: 'warrior', reqLv: 20, cost: 1000, line: 'warrior',
    desc: '투기장의 화신. 공격이 최선의 방어다.',
    base: { hp: 250, mp: 50, atk: 42, def: 18, mag: 8 },
    grow: { hp: 20, mp: 3, atk: 5, def: 2, mag: 0 },
    mainStats: ['str', 'dex'],
    skills: [
      { id: 'double_slash',  name: '쌍검격',     lv: 20, mp: 14, power: 1.0, type: 'phys', hits: 2, desc: '2연타.' },
      { id: 'bloodlust',     name: '피갈망',     lv: 24, mp: 12, power: 1.5, type: 'phys', effect: 'lifesteal',    desc: '가한 피해 50% 흡수.' },
      { id: 'roar',          name: '전투 포효', lv: 28, mp: 14,              type: 'buff', effect: 'atk_up_big', turns: 3, desc: '공격 +60% (3턴).' },
      { id: 'crushing_blow', name: '분쇄일격',   lv: 34, mp: 22, power: 2.8, type: 'phys', effect: 'finisher',     desc: '분쇄. 빈사에 특효.' },
    ],
  },
  // ─── mage 계열 ───
  elementalist: {
    tier: 2, name: '원소술사', from: 'mage', reqLv: 20, cost: 1000, line: 'mage',
    desc: '4대 원소를 지배하는 현자 지망생.',
    base: { hp: 150, mp: 220, atk: 8, def: 14, mag: 42 },
    grow: { hp: 10, mp: 14, atk: 1, def: 1, mag: 4 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'flame_wave',       name: '화염파',    lv: 20, mp: 25, power: 1.8, type: 'mag_aoe', effect: 'burn',       desc: '화염의 파도.' },
      { id: 'blizzard',         name: '눈보라',    lv: 23, mp: 28, power: 1.6, type: 'mag_aoe', effect: 'slow',       desc: '빙결.' },
      { id: 'chain_lightning',  name: '연쇄번개',  lv: 27, mp: 25, power: 1.6, type: 'mag', hits: 3, desc: '번개가 이어진다.' },
      { id: 'elemental_shield', name: '원소 방패', lv: 32, mp: 25,             type: 'buff',    effect: 'mag_resist', turns: 4, desc: '마법저항 +80% (4턴).' },
    ],
  },
  necromancer: {
    tier: 2, name: '강령술사', from: 'mage', reqLv: 20, cost: 1000, line: 'mage',
    desc: '금단의 학문. 죽음을 다룬다.',
    base: { hp: 160, mp: 200, atk: 10, def: 12, mag: 38 },
    grow: { hp: 11, mp: 13, atk: 1, def: 1, mag: 4 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'drain_life',    name: '생명흡수', lv: 20, mp: 15, power: 1.5, type: 'mag', effect: 'lifesteal_mag', desc: 'MAG 피해 50% 회복.' },
      { id: 'summon_undead', name: '언데드 소환', lv: 24, mp: 30,           type: 'utility', effect: 'summon_skel', desc: '(결속 효과: 공격력 +30%)' },
      { id: 'curse',         name: '저주',      lv: 28, mp: 18,            type: 'debuff', effect: 'atk_def_down', turns: 4, desc: '공/방 -30% (4턴).' },
      { id: 'death_touch',   name: '죽음의 손길', lv: 34, mp: 30, power: 3.0, type: 'mag', effect: 'crit_plus',    desc: '대마법.' },
    ],
  },
  // ─── priest 계열 ───
  paladin: {
    tier: 2, name: '성기사', from: 'priest', reqLv: 20, cost: 1000, line: 'priest',
    desc: '검을 든 사제. 빛의 전사.',
    base: { hp: 240, mp: 140, atk: 26, def: 24, mag: 30 },
    grow: { hp: 18, mp: 8, atk: 2, def: 3, mag: 2 },
    mainStats: ['vit', 'wis'],
    skills: [
      { id: 'holy_strike',   name: '성스러운 일격', lv: 20, mp: 14, power: 1.8, type: 'mag', effect: 'holy',       desc: '성속성.' },
      { id: 'divine_shield', name: '신성 방패',    lv: 24, mp: 22,             type: 'buff', effect: 'holy_shield', turns: 3, desc: '물/마 피해 -50%.' },
      { id: 'holy_word',     name: '성스러운 말씀', lv: 28, mp: 25, power: 2.5, type: 'mag', effect: 'undead_slay',  desc: '언데드에 치명.' },
      { id: 'consecrate',    name: '축성',         lv: 34, mp: 30, power: 1.5, type: 'mag_aoe', effect: 'holy_dot', turns: 3, desc: '신성 DoT (3턴).' },
    ],
  },
  bishop: {
    tier: 2, name: '주교', from: 'priest', reqLv: 20, cost: 1000, line: 'priest',
    desc: '순수 신앙의 화신. 치유의 대가.',
    base: { hp: 180, mp: 220, atk: 12, def: 18, mag: 38 },
    grow: { hp: 13, mp: 13, atk: 1, def: 2, mag: 3 },
    mainStats: ['wis', 'int'],
    skills: [
      { id: 'greater_heal',   name: '상위 치유', lv: 20, mp: 18, power: 2.5, type: 'heal', desc: '대량 회복.' },
      { id: 'mass_heal',      name: '전체 치유', lv: 24, mp: 28, power: 1.5, type: 'heal', desc: '단체 회복(본체 한정).' },
      { id: 'resurrect',      name: '완전 부활', lv: 32, mp: 50,             type: 'revive',                      desc: '죽음에서 되살아남.' },
      { id: 'holy_blessing',  name: '대축복',   lv: 36, mp: 30,              type: 'buff',  effect: 'all_up',     turns: 5, desc: '전 능력치 +25% (5턴).' },
    ],
  },
  // ─── thief 계열 ───
  assassin: {
    tier: 2, name: '암살자', from: 'thief', reqLv: 20, cost: 1000, line: 'thief',
    desc: '그림자 속의 칼날. 한 방에 끝낸다.',
    base: { hp: 190, mp: 100, atk: 40, def: 14, mag: 12 },
    grow: { hp: 14, mp: 7, atk: 4, def: 1, mag: 1 },
    mainStats: ['dex', 'luk'],
    skills: [
      { id: 'assassinate',    name: '암살',       lv: 20, mp: 18, power: 2.5, type: 'phys', effect: 'crit_100', desc: '확정 치명타.' },
      { id: 'shadow_step',    name: '그림자도약', lv: 24, mp: 15, power: 1.8, type: 'phys', effect: 'eva_up',   turns: 2, desc: '회피 +.' },
      { id: 'dagger_throw',   name: '투검',       lv: 28, mp: 12, power: 1.5, type: 'phys', hits: 2,            desc: '단검 투척.' },
      { id: 'poison_mastery', name: '독 숙련',    lv: 34, mp: 20,             type: 'buff', effect: 'poison_plus', turns: 99, desc: '독 데미지 +200%.' },
    ],
  },
  outlaw: {
    tier: 2, name: '협객', from: 'thief', reqLv: 20, cost: 1000, line: 'thief',
    desc: '가도의 무법자. 빠르고 잡기 어렵다.',
    base: { hp: 210, mp: 90, atk: 34, def: 16, mag: 10 },
    grow: { hp: 15, mp: 6, atk: 3, def: 2, mag: 1 },
    mainStats: ['dex', 'cha'],
    skills: [
      { id: 'gamble_strike', name: '도박일격',   lv: 20, mp: 12, power: 1.5, type: 'phys', effect: 'gamble', desc: '0.5~3.0배 랜덤.' },
      { id: 'smoke_bomb',    name: '연막탄',     lv: 24, mp: 14,             type: 'debuff', effect: 'blind', turns: 3, desc: '적 명중 -60%.' },
      { id: 'disarm',        name: '무장해제',   lv: 28, mp: 16,             type: 'debuff', effect: 'atk_down', turns: 4, desc: '적 공격 -50%.' },
      { id: 'lucky_strike',  name: '행운의 일격', lv: 34, mp: 18, power: 2.5, type: 'phys', effect: 'extra_gold', desc: '+추가 골드.' },
    ],
  },
  // ─── ranger 계열 ───
  sniper: {
    tier: 2, name: '저격수', from: 'ranger', reqLv: 20, cost: 1000, line: 'ranger',
    desc: '천 걸음 밖에서 심장을 꿰뚫는다.',
    base: { hp: 200, mp: 110, atk: 42, def: 14, mag: 10 },
    grow: { hp: 14, mp: 7, atk: 4, def: 1, mag: 1 },
    mainStats: ['dex', 'str'],
    skills: [
      { id: 'headshot',       name: '헤드샷',       lv: 20, mp: 16, power: 2.5, type: 'phys', effect: 'crit_100', desc: '확정 치명타.' },
      { id: 'piercing_shot',  name: '관통사격',     lv: 23, mp: 18, power: 2.2, type: 'phys', effect: 'pierce_def', desc: '방어 무시.' },
      { id: 'lock_on',        name: '조준',         lv: 27, mp: 14,             type: 'buff', effect: 'lock_on', turns: 2, desc: '다음 공격 확정 치명타.' },
      { id: 'death_mark',     name: '죽음의 표식', lv: 32, mp: 20,              type: 'debuff', effect: 'death_mark', turns: 4, desc: '표식된 적 받는피해 +50%.' },
    ],
  },
  tracker: {
    tier: 2, name: '수색꾼', from: 'ranger', reqLv: 20, cost: 1000, line: 'ranger',
    desc: '숲의 친구. 자연과 함께 싸운다.',
    base: { hp: 220, mp: 100, atk: 36, def: 18, mag: 14 },
    grow: { hp: 15, mp: 7, atk: 3, def: 2, mag: 1 },
    mainStats: ['dex', 'wis'],
    skills: [
      { id: 'trap',              name: '함정',       lv: 20, mp: 15, power: 2.0, type: 'phys', effect: 'immobilize', turns: 2, desc: '발동시 기동불능.' },
      { id: 'animal_companion',  name: '동물 동료',  lv: 24, mp: 25,             type: 'utility', effect: 'summon_beast', desc: '매/늑대 소환.' },
      { id: 'hunter_mark',       name: '사냥꾼의 표식', lv: 28, mp: 18,           type: 'debuff', effect: 'hunt_mark', turns: 4, desc: '적 받는 물리피해 +30%.' },
      { id: 'nature_sense',      name: '자연의 감각', lv: 32, mp: 22,             type: 'buff', effect: 'eva_up', turns: 3, desc: '회피 +40%.' },
    ],
  },

  // ═════════════ 3차 20직업 (Lv 45~) ═════════════
  // ─── knight 계열 ───
  crusader: {
    tier: 3, name: '성전사', from: 'knight', reqLv: 45, cost: 8000, line: 'warrior',
    desc: '바이서스 성전의 선봉장.',
    base: { hp: 600, mp: 200, atk: 80, def: 70, mag: 50 },
    grow: { hp: 35, mp: 8, atk: 5, def: 5, mag: 3 },
    mainStats: ['vit', 'wis'],
    skills: [
      { id: 'holy_crusade',     name: '성전 돌격', lv: 45, mp: 30, power: 2.2, type: 'phys_aoe', effect: 'holy', desc: '성스러운 돌격.' },
      { id: 'aegis',            name: '아이기스',  lv: 48, mp: 25,             type: 'buff', effect: 'all_defense', turns: 5, desc: '전방어 +70%.' },
      { id: 'divine_judgment',  name: '신의 심판', lv: 52, mp: 35, power: 3.0, type: 'mag',  effect: 'holy',         desc: '심판.' },
      { id: 'martyr',           name: '순교자',    lv: 60, mp: 50,             type: 'buff', effect: 'invul_short', turns: 2, desc: '무적 2턴.' },
    ],
  },
  dragoon: {
    tier: 3, name: '용기병', from: 'knight', reqLv: 45, cost: 8000, line: 'warrior',
    desc: '와이번 위에 올라 용을 사냥한다.',
    base: { hp: 560, mp: 180, atk: 95, def: 55, mag: 40 },
    grow: { hp: 32, mp: 7, atk: 6, def: 4, mag: 2 },
    mainStats: ['str', 'dex'],
    skills: [
      { id: 'dragon_leap',        name: '용의 도약', lv: 45, mp: 25, power: 2.5, type: 'phys',     desc: '하늘에서 내려찍는다.' },
      { id: 'lancer_charge',      name: '창기병 돌격', lv: 48, mp: 28, power: 1.8, type: 'phys_aoe', desc: '관통 돌격.' },
      { id: 'dragonfire_strike',  name: '용염격',   lv: 55, mp: 35, power: 3.2, type: 'mag',     effect: 'burn', turns: 3, desc: '드래곤 화염.' },
      { id: 'wyvern_rider',       name: '와이번 기승', lv: 62, mp: 40,            type: 'buff',    effect: 'flight', turns: 4, desc: '비행: 물리회피 +80%.' },
    ],
  },
  // ─── gladiator 계열 ───
  berserker: {
    tier: 3, name: '광전사', from: 'gladiator', reqLv: 45, cost: 8000, line: 'warrior',
    desc: '피에 취한 광기. 죽음을 두려워하지 않는다.',
    base: { hp: 550, mp: 150, atk: 110, def: 40, mag: 30 },
    grow: { hp: 30, mp: 6, atk: 7, def: 3, mag: 2 },
    mainStats: ['str', 'vit'],
    skills: [
      { id: 'rage',          name: '광란',       lv: 45, mp: 20,             type: 'buff', effect: 'berserk',    turns: 4, desc: '공격 +100%, 방어 -50%.' },
      { id: 'blood_frenzy',  name: '피의 광기',   lv: 48, mp: 15, power: 2.0, type: 'phys', hits: 2, effect: 'lifesteal_big', desc: '흡혈 공격 2회.' },
      { id: 'earth_shatter', name: '대지 분쇄',   lv: 52, mp: 35, power: 2.5, type: 'phys_aoe', effect: 'stun',  turns: 1, desc: '지진 + 기절.' },
      { id: 'undying',       name: '불멸',       lv: 60, mp: 60,             type: 'buff', effect: 'undying',    turns: 3, desc: '3턴간 HP 1 이하 시 유지.' },
    ],
  },
  monk: {
    tier: 3, name: '무투가', from: 'gladiator', reqLv: 45, cost: 8000, line: 'warrior',
    desc: '무술의 극치. 기(氣)를 다룬다.',
    base: { hp: 500, mp: 220, atk: 85, def: 50, mag: 60 },
    grow: { hp: 28, mp: 10, atk: 5, def: 4, mag: 4 },
    mainStats: ['dex', 'wis'],
    skills: [
      { id: 'thousand_fists', name: '천의 주먹', lv: 45, mp: 20, power: 0.7, type: 'phys', hits: 5, desc: '5연타.' },
      { id: 'meditation',     name: '명상',      lv: 48, mp: 0,              type: 'utility', effect: 'mp_restore', desc: 'MP 50% 회복(1턴 소비).' },
      { id: 'chi_blast',      name: '기공파',    lv: 52, mp: 25, power: 2.4, type: 'mag',   desc: '기의 파동.' },
      { id: 'inner_peace',    name: '심안',      lv: 62, mp: 35,             type: 'buff',  effect: 'all_up',   turns: 4, desc: '모든 능력 +30%.' },
    ],
  },
  // ─── elementalist 계열 ───
  archmage: {
    tier: 3, name: '대마법사', from: 'elementalist', reqLv: 45, cost: 8000, line: 'mage',
    desc: '마법의 정수에 도달한 자.',
    base: { hp: 350, mp: 500, atk: 15, def: 30, mag: 120 },
    grow: { hp: 18, mp: 22, atk: 1, def: 2, mag: 7 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'inferno',         name: '대화염',   lv: 45, mp: 45, power: 3.0, type: 'mag_aoe', effect: 'burn', turns: 3, desc: '지옥불.' },
      { id: 'absolute_zero',   name: '절대영도', lv: 48, mp: 50, power: 2.8, type: 'mag_aoe', effect: 'freeze', turns: 2, desc: '빙결.' },
      { id: 'lightning_storm', name: '뇌운',    lv: 52, mp: 55, power: 2.0, type: 'mag_aoe', hits: 2, desc: '번개 폭풍 2연.' },
      { id: 'arcane_mastery',  name: '비전 숙련', lv: 60, mp: 40,            type: 'buff',   effect: 'mag_mastery', turns: 5, desc: '마력 +80%, MP소모 -50%.' },
    ],
  },
  sage: {
    tier: 3, name: '현자(賢者)', from: 'elementalist', reqLv: 45, cost: 15000, line: 'mage',
    desc: '핸드레이크의 계보를 잇는 지혜의 사도. 드래곤과도 대화가 가능하다.',
    special: '용의 지혜 3개 수집 필요 (추후 구현)',
    base: { hp: 380, mp: 600, atk: 20, def: 35, mag: 130 },
    grow: { hp: 20, mp: 25, atk: 2, def: 3, mag: 8 },
    mainStats: ['int', 'wis', 'cha'],
    skills: [
      { id: 'dragon_wisdom',     name: '용의 지혜',    lv: 45, mp: 40,             type: 'buff',    effect: 'all_up_big', turns: 5, desc: '모든 능력치 +50% (5턴).' },
      { id: 'elemental_converg', name: '원소 수렴',   lv: 50, mp: 60, power: 4.0, type: 'mag_aoe',                        desc: '4원소가 하나로. 최강 마법.' },
      { id: 'time_manipulation', name: '시공 조작',   lv: 58, mp: 80,              type: 'utility', effect: 'extra_turn',   desc: '추가 턴 획득.' },
      { id: 'sage_aura',         name: '현자의 기운', lv: 65, mp: 50,              type: 'buff',    effect: 'sage_aura', turns: 99, desc: '이 전투 내내 공/마/방 +30%.' },
    ],
  },
  // ─── necromancer 계열 ───
  lich: {
    tier: 3, name: '리치', from: 'necromancer', reqLv: 45, cost: 8000, line: 'mage',
    desc: '불멸을 얻은 대마도사. 영원한 죽음.',
    base: { hp: 400, mp: 480, atk: 25, def: 40, mag: 110 },
    grow: { hp: 20, mp: 20, atk: 2, def: 3, mag: 6 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'soul_harvest',  name: '영혼수확', lv: 45, mp: 40, power: 2.5, type: 'mag_aoe', effect: 'lifesteal_mag', desc: '전체 흡수.' },
      { id: 'death_cloud',   name: '죽음의 구름', lv: 48, mp: 50, power: 1.5, type: 'mag_aoe', hits: 3, effect: 'poison', turns: 3, desc: '독 구름 3연.' },
      { id: 'phylactery',    name: '생명성물', lv: 55, mp: 60,              type: 'buff',    effect: 'phylactery', turns: 1, desc: '1회 부활.' },
      { id: 'undead_army',   name: '언데드 군단', lv: 62, mp: 70, power: 1.8, type: 'phys_aoe', desc: '군단 소환 공격.' },
    ],
  },
  soulbinder: {
    tier: 3, name: '영혼결속사', from: 'necromancer', reqLv: 45, cost: 8000, line: 'mage',
    desc: '영혼을 조종하는 자. 죽은 자와 산 자를 이어놓는다.',
    base: { hp: 380, mp: 460, atk: 22, def: 35, mag: 100 },
    grow: { hp: 19, mp: 19, atk: 2, def: 3, mag: 6 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'soul_link',       name: '영혼 결속', lv: 45, mp: 35,             type: 'debuff', effect: 'soul_link', turns: 4, desc: '적 피해 30% 공유.' },
      { id: 'spirit_weapon',   name: '영혼 무기', lv: 48, mp: 40,             type: 'buff', effect: 'phantom_weapon', turns: 4, desc: '일반공격 +100%.' },
      { id: 'banshee_scream',  name: '밴시의 비명', lv: 55, mp: 45, power: 2.2, type: 'mag_aoe', effect: 'fear',   turns: 2, desc: '공포. 적 무력화.' },
      { id: 'possession',      name: '빙의',     lv: 60, mp: 55,              type: 'debuff', effect: 'possess', turns: 1, desc: '1턴 아군화.' },
    ],
  },
  // ─── paladin 계열 ───
  avatar: {
    tier: 3, name: '신의 화신', from: 'paladin', reqLv: 45, cost: 8000, line: 'priest',
    desc: '신의 뜻을 이 땅에 행하는 자.',
    base: { hp: 580, mp: 320, atk: 70, def: 65, mag: 90 },
    grow: { hp: 30, mp: 15, atk: 4, def: 5, mag: 5 },
    mainStats: ['vit', 'wis'],
    skills: [
      { id: 'divine_incarnation', name: '신의 화신', lv: 45, mp: 50,             type: 'buff', effect: 'all_up_big', turns: 4, desc: '전 능력 +50%.' },
      { id: 'holy_nova',          name: '성스러운 신성포', lv: 48, mp: 40, power: 2.8, type: 'mag_aoe', effect: 'holy', desc: '성광 폭발.' },
      { id: 'guardian_angel',     name: '수호천사', lv: 55, mp: 45,              type: 'buff', effect: 'angel',      turns: 99, desc: '치명상 3회 회피.' },
      { id: 'ultimate_purge',     name: '궁극의 정화', lv: 62, mp: 60, power: 4.0, type: 'mag', effect: 'purge',      desc: '모든 것을 정화.' },
    ],
  },
  inquisitor: {
    tier: 3, name: '심판관', from: 'paladin', reqLv: 45, cost: 8000, line: 'priest',
    desc: '이단자를 쫓는 교회의 창.',
    base: { hp: 540, mp: 280, atk: 75, def: 55, mag: 80 },
    grow: { hp: 28, mp: 13, atk: 5, def: 4, mag: 4 },
    mainStats: ['wis', 'str'],
    skills: [
      { id: 'purification', name: '정화',   lv: 45, mp: 30, power: 1.5, type: 'mag_aoe', effect: 'dispel_all', desc: '버프 제거.' },
      { id: 'divine_mark',  name: '신의 표식', lv: 48, mp: 25,           type: 'debuff', effect: 'mark',       turns: 5, desc: '표식 적 +100% 피해.' },
      { id: 'witch_hunt',   name: '마녀사냥', lv: 52, mp: 35, power: 3.5, type: 'mag', effect: 'mag_slayer',   desc: '마법사 계열에 치명.' },
      { id: 'holy_flame',   name: '성화',    lv: 60, mp: 45, power: 2.5, type: 'mag_aoe', effect: 'burn',    turns: 3, desc: '성스러운 화염.' },
    ],
  },
  // ─── bishop 계열 ───
  archbishop: {
    tier: 3, name: '대주교', from: 'bishop', reqLv: 45, cost: 8000, line: 'priest',
    desc: '교회의 정점. 기적을 일으킨다.',
    base: { hp: 420, mp: 520, atk: 25, def: 45, mag: 110 },
    grow: { hp: 22, mp: 22, atk: 2, def: 4, mag: 6 },
    mainStats: ['wis', 'int'],
    skills: [
      { id: 'miracle',            name: '기적',         lv: 45, mp: 60, power: 3.5, type: 'heal', desc: '대량 완전회복.' },
      { id: 'divine_intervention',name: '신의 개입',    lv: 50, mp: 80,             type: 'utility', effect: 'full_heal_self', desc: 'HP/MP 전부 회복.' },
      { id: 'prayer',             name: '기도',         lv: 55, mp: 70,             type: 'buff',    effect: 'regen',       turns: 5, desc: '매턴 30% HP 회복.' },
      { id: 'sanctuary',          name: '성역',         lv: 62, mp: 55,             type: 'buff',    effect: 'invul_short', turns: 1, desc: '1턴 무적.' },
    ],
  },
  warpriest: {
    tier: 3, name: '신관전사', from: 'bishop', reqLv: 45, cost: 8000, line: 'priest',
    desc: '기도와 검을 함께 드는 자.',
    base: { hp: 500, mp: 400, atk: 55, def: 50, mag: 90 },
    grow: { hp: 26, mp: 18, atk: 4, def: 4, mag: 5 },
    mainStats: ['wis', 'str'],
    skills: [
      { id: 'blessed_blade', name: '축복의 검', lv: 45, mp: 25, power: 2.8, type: 'mag', effect: 'holy', desc: '빛의 검격.' },
      { id: 'divine_wrath',  name: '신의 분노', lv: 48, mp: 35, power: 2.5, type: 'mag_aoe', effect: 'holy', desc: '심판의 번개.' },
      { id: 'holy_smite',    name: '성타',     lv: 55, mp: 40, power: 3.5, type: 'mag',  effect: 'holy', desc: '극대 성타.' },
      { id: 'warding_hymn',  name: '수호의 찬송', lv: 62, mp: 50,           type: 'buff', effect: 'party_up', turns: 4, desc: '공/방/치유 +40%.' },
    ],
  },
  // ─── assassin 계열 ───
  shadow: {
    tier: 3, name: '섀도우', from: 'assassin', reqLv: 45, cost: 8000, line: 'thief',
    desc: '어둠 그 자체가 된 암살자.',
    base: { hp: 450, mp: 240, atk: 100, def: 32, mag: 35 },
    grow: { hp: 22, mp: 10, atk: 6, def: 2, mag: 2 },
    mainStats: ['dex', 'luk'],
    skills: [
      { id: 'shadow_cloak',    name: '암야',         lv: 45, mp: 25,             type: 'buff', effect: 'invisible', turns: 3, desc: '3턴간 물리 회피 100%.' },
      { id: 'night_assassin',  name: '밤의 암살자', lv: 48, mp: 20, power: 3.0, type: 'phys', effect: 'assassinate', desc: '낮 적에게 추가 피해.' },
      { id: 'void_dagger',     name: '공허의 단검', lv: 55, mp: 30, power: 2.5, type: 'phys', hits: 3, effect: 'crit_plus', desc: '3연타 고크리.' },
      { id: 'death_strike',    name: '사격(死擊)',   lv: 62, mp: 40, power: 4.0, type: 'phys', effect: 'finisher_big', desc: '빈사 적 즉사급.' },
    ],
  },
  nightblade: {
    tier: 3, name: '나이트블레이드', from: 'assassin', reqLv: 45, cost: 8000, line: 'thief',
    desc: '달빛 아래 춤추는 칼날.',
    base: { hp: 430, mp: 260, atk: 95, def: 30, mag: 45 },
    grow: { hp: 21, mp: 11, atk: 6, def: 2, mag: 3 },
    mainStats: ['dex', 'int'],
    skills: [
      { id: 'blade_dance',     name: '검무',       lv: 45, mp: 25, power: 2.0, type: 'phys_aoe', hits: 2, desc: '칼춤.' },
      { id: 'phantom_strike',  name: '환영격',     lv: 48, mp: 22, power: 2.5, type: 'phys', hits: 2, effect: 'crit_plus', desc: '환영 타격.' },
      { id: 'dark_veil',       name: '어둠의 장막', lv: 55, mp: 30,            type: 'buff', effect: 'dark_power', turns: 4, desc: '공격 +60%.' },
      { id: 'soul_reap',       name: '영혼 수확',  lv: 62, mp: 35, power: 3.5, type: 'phys', effect: 'lifesteal',  desc: '흡혈 대검.' },
    ],
  },
  // ─── outlaw 계열 ───
  swashbuckler: {
    tier: 3, name: '풍운아', from: 'outlaw', reqLv: 45, cost: 8000, line: 'thief',
    desc: '화려한 검술가. 결투의 제왕.',
    base: { hp: 470, mp: 240, atk: 85, def: 38, mag: 35 },
    grow: { hp: 22, mp: 10, atk: 5, def: 3, mag: 2 },
    mainStats: ['dex', 'cha'],
    skills: [
      { id: 'duelist',         name: '결투자',     lv: 45, mp: 20,             type: 'buff', effect: 'duel', turns: 4, desc: '단일 대상 공격 +80%.' },
      { id: 'grappling_hook',  name: '갈고리',     lv: 48, mp: 18, power: 1.5, type: 'phys', effect: 'stun', turns: 1, desc: '기절.' },
      { id: 'trickshot',       name: '속임수',     lv: 55, mp: 25, power: 2.0, type: 'phys', effect: 'dispel', desc: '적 버프 제거.' },
      { id: 'charm',           name: '도적의 매력', lv: 62, mp: 30,            type: 'buff', effect: 'cha_up', turns: 99, desc: '매력 +100% (금화/상점).' },
    ],
  },
  adventurer: {
    tier: 3, name: '모험가', from: 'outlaw', reqLv: 45, cost: 8000, line: 'thief',
    desc: '세상 모든 곳을 걷는 자.',
    base: { hp: 490, mp: 220, atk: 80, def: 40, mag: 32 },
    grow: { hp: 23, mp: 9, atk: 5, def: 3, mag: 2 },
    mainStats: ['luk', 'cha'],
    skills: [
      { id: 'wild_swing',      name: '야생 일격',   lv: 45, mp: 20, power: 2.0, type: 'phys', hits: 2, effect: 'gamble', desc: '와일드 히트.' },
      { id: 'lucky_seven',     name: '럭키 세븐',  lv: 48, mp: 25, power: 2.2, type: 'phys', effect: 'lucky_seven',    desc: '7의 배수 턴 +200%.' },
      { id: 'treasure_hunter', name: '보물사냥',   lv: 55, mp: 20,              type: 'buff', effect: 'gold_up',       turns: 99, desc: '획득 골드 +200%.' },
      { id: 'free_spirit',     name: '자유혼',     lv: 62, mp: 35,              type: 'buff', effect: 'free',          turns: 4, desc: 'CC 면역, 회피 +50%.' },
    ],
  },
  // ─── sniper 계열 ───
  dragonslayer: {
    tier: 3, name: '드래곤슬레이어', from: 'sniper', reqLv: 45, cost: 8000, line: 'ranger',
    desc: '용을 사냥하기 위해 태어난 자.',
    base: { hp: 500, mp: 260, atk: 110, def: 40, mag: 30 },
    grow: { hp: 24, mp: 11, atk: 7, def: 3, mag: 2 },
    mainStats: ['dex', 'str'],
    skills: [
      { id: 'dragon_breaker',  name: '용도박',     lv: 45, mp: 30, power: 4.0, type: 'phys', effect: 'dragon_slay', desc: '드래곤에게 +200%.' },
      { id: 'piercing_light',  name: '관통의 빛', lv: 48, mp: 35, power: 3.0, type: 'phys', effect: 'pierce_def', desc: '모든 방어 무시.' },
      { id: 'titan_shot',      name: '거신의 일격', lv: 55, mp: 40, power: 5.0, type: 'phys', desc: '거신전용 일격.' },
      { id: 'slayer_instinct', name: '슬레이어 본능', lv: 62, mp: 30,           type: 'buff', effect: 'boss_slay', turns: 99, desc: '보스에게 +80%.' },
    ],
  },
  magicshot: {
    tier: 3, name: '마탄의 사수', from: 'sniper', reqLv: 45, cost: 8000, line: 'ranger',
    desc: '마력을 화살에 깃들이는 자.',
    base: { hp: 460, mp: 360, atk: 80, def: 35, mag: 80 },
    grow: { hp: 22, mp: 16, atk: 5, def: 3, mag: 5 },
    mainStats: ['dex', 'int'],
    skills: [
      { id: 'magic_arrow',      name: '마법 화살', lv: 45, mp: 25, power: 2.5, type: 'mag', desc: '물리+마법 혼합.' },
      { id: 'homing_shot',      name: '유도사격',  lv: 48, mp: 28, power: 2.0, type: 'mag', hits: 3, desc: '3연 유도.' },
      { id: 'elemental_bullet', name: '원소탄',    lv: 55, mp: 35, power: 2.2, type: 'mag_aoe', effect: 'random_elem', desc: '랜덤 원소.' },
      { id: 'magic_burst',      name: '마력폭발',  lv: 62, mp: 45, power: 4.5, type: 'mag', desc: '마력 폭발 단일.' },
    ],
  },
  // ─── tracker 계열 ───
  druid: {
    tier: 3, name: '드루이드', from: 'tracker', reqLv: 45, cost: 8000, line: 'ranger',
    desc: '자연의 대변자.',
    base: { hp: 480, mp: 400, atk: 65, def: 45, mag: 90 },
    grow: { hp: 24, mp: 17, atk: 4, def: 4, mag: 5 },
    mainStats: ['wis', 'dex'],
    skills: [
      { id: 'nature_wrath', name: '자연의 분노', lv: 45, mp: 30, power: 2.5, type: 'mag_aoe', effect: 'thorns', desc: '가시덤불.' },
      { id: 'wild_growth',  name: '야생의 성장', lv: 48, mp: 35, power: 2.5, type: 'heal', desc: '대량 회복.' },
      { id: 'beast_form',   name: '야수 변신', lv: 55, mp: 40,               type: 'buff', effect: 'beast', turns: 4, desc: '공/방 +50%.' },
      { id: 'starfall',     name: '별의 비',   lv: 62, mp: 55, power: 3.0, type: 'mag_aoe', hits: 3, desc: '별비.' },
    ],
  },
  rangerking: {
    tier: 3, name: '숲의 왕', from: 'tracker', reqLv: 45, cost: 8000, line: 'ranger',
    desc: '숲의 지배자. 모든 야수가 따른다.',
    base: { hp: 510, mp: 320, atk: 90, def: 45, mag: 60 },
    grow: { hp: 25, mp: 14, atk: 5, def: 4, mag: 3 },
    mainStats: ['dex', 'cha'],
    skills: [
      { id: 'eagle_eye',      name: '매의 눈',    lv: 45, mp: 20,             type: 'buff', effect: 'accuracy_up', turns: 99, desc: '명중/치명 +50%.' },
      { id: 'lord_of_wild',   name: '야생의 군주', lv: 48, mp: 30,             type: 'buff', effect: 'wild_lord',  turns: 4, desc: '공/방 +40%.' },
      { id: 'army_of_beasts', name: '야수 군단',  lv: 55, mp: 50, power: 2.5, type: 'phys_aoe', desc: '야수 군단 공격.' },
      { id: 'royal_hunt',     name: '왕실 사냥', lv: 62, mp: 45, power: 3.5, type: 'phys_aoe', effect: 'hunt_mark', turns: 3, desc: '전체 표식.' },
    ],
  },

  // ═════════════ 종족 전용 2차 ═════════════
  hero_lord: {
    tier: 2, name: '영웅왕', from: 'hero', reqLv: 20, cost: 1500, line: 'hero', raceOnly: 'human',
    desc: '전설이 된 인간.',
    base: { hp: 240, mp: 130, atk: 34, def: 24, mag: 28 },
    grow: { hp: 20, mp: 10, atk: 3, def: 3, mag: 2 },
    mainStats: ['str', 'cha'],
    skills: [
      { id: 'hero_wrath',   name: '영웅의 분노',   lv: 20, mp: 18, power: 2.2, type: 'phys', desc: '단일 강타.' },
      { id: 'rally',        name: '집결',          lv: 23, mp: 25, type: 'buff', effect: 'all_up', turns: 4, desc: '전 능력 +30%.' },
      { id: 'crown_strike', name: '왕관의 일격',   lv: 28, mp: 30, power: 2.6, type: 'phys_aoe', desc: '광역.' },
      { id: 'heroic_will',  name: '영웅의 의지',   lv: 34, mp: 40, type: 'buff', effect: 'undying', turns: 3, desc: '3턴 불멸.' },
    ],
  },
  archspirit: {
    tier: 2, name: '대정령술사', from: 'spiritcaller', reqLv: 20, cost: 1500, line: 'spiritcaller', raceOnly: 'elf',
    desc: '정령과 완전히 교감하는 엘프.',
    base: { hp: 140, mp: 260, atk: 6, def: 15, mag: 48 },
    grow: { hp: 9, mp: 16, atk: 1, def: 1, mag: 5 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'spirit_storm', name: '정령 폭풍',    lv: 20, mp: 26, power: 2.0, type: 'mag_aoe', desc: '전체 공격.' },
      { id: 'spirit_bond',  name: '정령 결속',    lv: 24, mp: 30, type: 'buff', effect: 'mag_mastery', turns: 4, desc: 'MP -50% 마력 +80%.' },
      { id: 'spirit_king',  name: '정령왕 현신',  lv: 28, mp: 42, power: 3.2, type: 'mag_aoe', desc: '4원소의 왕.' },
      { id: 'ancient_elem', name: '원초의 정령',  lv: 34, mp: 52, power: 4.0, type: 'mag', desc: '원초의 힘.' },
    ],
  },
  runeblade: {
    tier: 2, name: '룬블레이드', from: 'runemaster', reqLv: 20, cost: 1500, line: 'runemaster', raceOnly: 'dwarf',
    desc: '룬과 검의 조화. 드워프 최강.',
    base: { hp: 270, mp: 150, atk: 38, def: 30, mag: 30 },
    grow: { hp: 20, mp: 9, atk: 3, def: 3, mag: 2 },
    mainStats: ['str', 'int'],
    skills: [
      { id: 'rune_slash',    name: '룬 베기',    lv: 20, mp: 16, power: 2.0, type: 'phys', effect: 'pierce_def', desc: '방어 무시.' },
      { id: 'rune_ward',     name: '룬 결계',    lv: 23, mp: 24, type: 'buff', effect: 'all_defense', turns: 5, desc: '전 방어 +70%.' },
      { id: 'rune_explosion',name: '룬 폭발',    lv: 28, mp: 32, power: 2.5, type: 'mag_aoe', desc: '룬 폭발.' },
      { id: 'grand_rune',    name: '대룬',       lv: 34, mp: 42, power: 3.5, type: 'phys', desc: '거대 일격.' },
    ],
  },
  titan_king: {
    tier: 2, name: '거신왕', from: 'titan', reqLv: 20, cost: 1500, line: 'titan', raceOnly: 'ogre',
    desc: '산과 같은 거인의 왕.',
    base: { hp: 380, mp: 50, atk: 50, def: 30, mag: 8 },
    grow: { hp: 28, mp: 4, atk: 5, def: 3, mag: 0 },
    mainStats: ['str', 'vit'],
    skills: [
      { id: 'mountain_break', name: '산 부수기', lv: 20, mp: 14, power: 2.5, type: 'phys', effect: 'finisher', desc: '빈사에 대폭딜.' },
      { id: 'titan_form',     name: '거신화',    lv: 24, mp: 25, type: 'buff', effect: 'all_up_big', turns: 4, desc: '전 능력 +50%.' },
      { id: 'world_shake',    name: '세계 진동', lv: 28, mp: 35, power: 2.8, type: 'phys_aoe', effect: 'stun', turns: 1, desc: '전체 기절.' },
      { id: 'titan_judgement',name: '거신의 심판', lv: 34, mp: 45, power: 4.0, type: 'phys', desc: '결정타.' },
    ],
  },
  grand_bard: {
    tier: 2, name: '대음유시인', from: 'bard', reqLv: 20, cost: 1500, line: 'bard', raceOnly: 'halfelf',
    desc: '전설을 노래하는 자.',
    base: { hp: 180, mp: 200, atk: 22, def: 16, mag: 34 },
    grow: { hp: 12, mp: 13, atk: 2, def: 2, mag: 3 },
    mainStats: ['cha', 'int'],
    skills: [
      { id: 'hero_song',    name: '영웅의 노래', lv: 20, mp: 22, type: 'buff', effect: 'all_up_big', turns: 4, desc: '전 능력 +50%.' },
      { id: 'requiem',      name: '레퀴엠',      lv: 24, mp: 28, power: 2.2, type: 'mag_aoe', effect: 'fear', turns: 2, desc: '광역+공포.' },
      { id: 'inspiration',  name: '영감',        lv: 28, mp: 26, type: 'utility', effect: 'extra_turn', desc: '추가 턴.' },
      { id: 'legend_song',  name: '전설의 시',   lv: 34, mp: 40, power: 3.0, type: 'mag_aoe', desc: '대서사시.' },
    ],
  },

  // ═════════════ 종족 전용 3차 ═════════════
  hero_god: {
    tier: 3, name: '영웅신', from: 'hero_lord', reqLv: 45, cost: 12000, line: 'hero', raceOnly: 'human',
    desc: '인간이 신에 닿는 지점.',
    base: { hp: 550, mp: 320, atk: 80, def: 55, mag: 65 },
    grow: { hp: 28, mp: 14, atk: 5, def: 4, mag: 4 },
    mainStats: ['str', 'cha'],
    skills: [
      { id: 'godly_slash',   name: '신의 일격',    lv: 45, mp: 35, power: 3.5, type: 'phys', desc: '단일 극딜.' },
      { id: 'divine_form',   name: '신의 모습',    lv: 48, mp: 50, type: 'buff', effect: 'all_up_big', turns: 5, desc: '전 능력 +50%.' },
      { id: 'world_savior',  name: '세계 구원자',  lv: 55, mp: 60, power: 3.0, type: 'phys_aoe', desc: '전체 구원.' },
      { id: 'immortal_hero', name: '불멸 영웅',    lv: 62, mp: 70, type: 'buff', effect: 'undying', turns: 5, desc: '5턴 불멸.' },
    ],
  },
  elemental_sage: {
    tier: 3, name: '정령의 현자', from: 'archspirit', reqLv: 45, cost: 15000, line: 'spiritcaller', raceOnly: 'elf',
    desc: '엘프 현자의 정점. 사실상 현자와 동급.',
    base: { hp: 360, mp: 580, atk: 18, def: 32, mag: 128 },
    grow: { hp: 19, mp: 24, atk: 2, def: 3, mag: 8 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'prime_spirit',   name: '원초 정령',   lv: 45, mp: 50, power: 3.5, type: 'mag_aoe', desc: '원초적 원소.' },
      { id: 'spirit_aura',    name: '정령의 기운', lv: 48, mp: 40, type: 'buff', effect: 'sage_aura', turns: 99, desc: '전투 내내 +30%.' },
      { id: 'convergence',    name: '수렴',        lv: 55, mp: 60, power: 4.5, type: 'mag_aoe', desc: '4원소 수렴.' },
      { id: 'elem_apotheosis',name: '정령 승화',   lv: 62, mp: 80, type: 'utility', effect: 'extra_turn', desc: '추가 턴.' },
    ],
  },
  rune_dragon: {
    tier: 3, name: '룬드래곤', from: 'runeblade', reqLv: 45, cost: 12000, line: 'runemaster', raceOnly: 'dwarf',
    desc: '룬이 용을 부른다. 드워프 최고 경지.',
    base: { hp: 600, mp: 280, atk: 95, def: 75, mag: 70 },
    grow: { hp: 32, mp: 13, atk: 6, def: 5, mag: 4 },
    mainStats: ['str', 'int'],
    skills: [
      { id: 'dragon_rune',    name: '용 룬',       lv: 45, mp: 40, power: 3.5, type: 'phys', effect: 'pierce_def', desc: '방어 무시.' },
      { id: 'rune_fortress',  name: '룬 요새',     lv: 48, mp: 50, type: 'buff', effect: 'all_defense', turns: 5, desc: '전 방어 +70%.' },
      { id: 'rune_dragon_breath', name: '룬 브레스', lv: 55, mp: 55, power: 3.2, type: 'mag_aoe', effect: 'burn', turns: 3, desc: '용염.' },
      { id: 'divine_rune',    name: '신성 룬',     lv: 62, mp: 75, power: 4.2, type: 'mag', desc: '극대 룬.' },
    ],
  },
  titan_god: {
    tier: 3, name: '거신왕의 화신', from: 'titan_king', reqLv: 45, cost: 12000, line: 'titan', raceOnly: 'ogre',
    desc: '오우거 전설. 산을 무너뜨린다.',
    base: { hp: 780, mp: 100, atk: 120, def: 65, mag: 18 },
    grow: { hp: 38, mp: 5, atk: 7, def: 4, mag: 1 },
    mainStats: ['str', 'vit'],
    skills: [
      { id: 'apocalypse_slam', name: '종말의 내려침', lv: 45, mp: 30, power: 3.8, type: 'phys', effect: 'stun', turns: 2, desc: '2턴 기절.' },
      { id: 'god_form',        name: '거신 형상',    lv: 48, mp: 50, type: 'buff', effect: 'all_up_big', turns: 5, desc: '전 능력 +50%.' },
      { id: 'worldender',      name: '세계 파쇄',    lv: 55, mp: 60, power: 4.5, type: 'phys_aoe', desc: '광역 절대 딜.' },
      { id: 'titan_immortal',  name: '거신 불멸',    lv: 62, mp: 75, type: 'buff', effect: 'undying', turns: 5, desc: '5턴 불멸.' },
    ],
  },
  fate_bard: {
    tier: 3, name: '운명의 시인', from: 'grand_bard', reqLv: 45, cost: 12000, line: 'bard', raceOnly: 'halfelf',
    desc: '운명을 노래로 바꾸는 하프엘프 전설.',
    base: { hp: 380, mp: 440, atk: 55, def: 40, mag: 95 },
    grow: { hp: 22, mp: 18, atk: 4, def: 3, mag: 5 },
    mainStats: ['cha', 'int'],
    skills: [
      { id: 'fate_song',    name: '운명의 노래',  lv: 45, mp: 40, type: 'buff', effect: 'all_up_big', turns: 5, desc: '전 능력 +50%.' },
      { id: 'dirge',        name: '장송곡',       lv: 48, mp: 38, power: 2.8, type: 'mag_aoe', effect: 'fear', turns: 3, desc: '공포.' },
      { id: 'time_verse',   name: '시간의 시',    lv: 55, mp: 70, type: 'utility', effect: 'extra_turn', desc: '추가 턴.' },
      { id: 'legendary',    name: '전설이 되다',  lv: 62, mp: 80, power: 4.0, type: 'mag_aoe', desc: '전설의 시.' },
    ],
  },

  // ═════════════ 4차 초월직 (Lv 75~) — 공용 12개 ═════════════
  dragon_emperor: {
    tier: 4, name: '용제(龍帝)', from: 'crusader', altFrom: ['dragoon'], reqLv: 75, cost: 50000, line: 'warrior',
    desc: '용을 다스리는 황제. 크루세이더·드라군의 정점.',
    base: { hp: 1400, mp: 500, atk: 180, def: 150, mag: 120 },
    grow: { hp: 60, mp: 18, atk: 10, def: 8, mag: 6 },
    mainStats: ['str', 'vit'],
    skills: [
      { id: 'dragon_descent', name: '용의 강림',     lv: 75, mp: 60, power: 4.5, type: 'phys_aoe', effect: 'burn', turns: 4, desc: '하늘에서 내려찍는 용.' },
      { id: 'emperor_aura',   name: '황제의 기운',   lv: 80, mp: 70, type: 'buff', effect: 'all_up_big', turns: 6, desc: '전 능력 +50%.' },
      { id: 'world_strike',   name: '세계 가르기',   lv: 90, mp: 90, power: 6.0, type: 'phys', effect: 'pierce_def', desc: '절대 관통.' },
      { id: 'divine_wings',   name: '신성의 날개',   lv: 100, mp: 100, type: 'buff', effect: 'invul_short', turns: 2, desc: '2턴 무적.' },
    ],
  },
  sword_god: {
    tier: 4, name: '검신(劍神)', from: 'berserker', altFrom: ['monk'], reqLv: 75, cost: 50000, line: 'warrior',
    desc: '검 하나로 신의 경지에 이른 자.',
    base: { hp: 1200, mp: 400, atk: 220, def: 120, mag: 80 },
    grow: { hp: 55, mp: 15, atk: 12, def: 7, mag: 4 },
    mainStats: ['str', 'dex'],
    skills: [
      { id: 'sword_of_light', name: '빛의 검격',     lv: 75, mp: 50, power: 5.0, type: 'phys', desc: '검광이 세계를 가른다.' },
      { id: 'god_slash',      name: '신의 일섬',     lv: 80, mp: 70, power: 7.0, type: 'phys', effect: 'crit_100', desc: '확정 치명타.' },
      { id: 'ten_thousand',   name: '만검', lv: 90, mp: 100, power: 1.2, type: 'phys_aoe', hits: 5, desc: '만 개의 검.' },
      { id: 'transcendent',   name: '초월',         lv: 100, mp: 120, type: 'buff', effect: 'all_up_big', turns: 5, desc: '신이 된 감각.' },
    ],
  },
  great_sage: {
    tier: 4, name: '대현자(大賢者)', from: 'archmage', altFrom: ['sage'], reqLv: 75, cost: 60000, line: 'mage',
    desc: '모든 마법의 궁극. 현자의 완성형.',
    base: { hp: 800, mp: 1200, atk: 40, def: 80, mag: 300 },
    grow: { hp: 35, mp: 40, atk: 3, def: 5, mag: 16 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'arcane_storm',   name: '아케인 폭풍',   lv: 75, mp: 80, power: 5.0, type: 'mag_aoe', hits: 2, desc: '비전 폭풍 2연.' },
      { id: 'reality_bend',   name: '현실 조작',     lv: 80, mp: 90, type: 'utility', effect: 'extra_turn', desc: '추가 턴.' },
      { id: 'omnimagic',      name: '만마법',       lv: 90, mp: 120, power: 7.0, type: 'mag_aoe', effect: 'burn', turns: 5, desc: '전 원소 융합.' },
      { id: 'mana_mastery',   name: '마나 지배',    lv: 100, mp: 100, type: 'buff', effect: 'mag_mastery', turns: 6, desc: 'MP -50%, 마력 +100%.' },
    ],
  },
  death_god: {
    tier: 4, name: '사신(死神)', from: 'lich', altFrom: ['soulbinder'], reqLv: 75, cost: 60000, line: 'mage',
    desc: '죽음 그 자체가 된 존재.',
    base: { hp: 900, mp: 1100, atk: 50, def: 90, mag: 280 },
    grow: { hp: 38, mp: 38, atk: 4, def: 5, mag: 15 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'soul_drain',    name: '영혼 갈취',     lv: 75, mp: 70, power: 4.8, type: 'mag_aoe', effect: 'lifesteal_big', desc: '영혼 갈취.' },
      { id: 'death_field',   name: '죽음의 영역',   lv: 80, mp: 90, power: 3.5, type: 'mag_aoe', effect: 'poison', turns: 8, desc: '광역 독 지속.' },
      { id: 'eternal_night', name: '영겁의 밤',     lv: 90, mp: 110, power: 6.0, type: 'mag_aoe', effect: 'fear', turns: 4, desc: '영원한 밤.' },
      { id: 'immortal_will', name: '불멸의 의지',   lv: 100, mp: 100, type: 'buff', effect: 'phylactery', turns: 1, desc: '죽음 무효.' },
    ],
  },
  holy_king: {
    tier: 4, name: '성왕(聖王)', from: 'avatar', altFrom: ['inquisitor'], reqLv: 75, cost: 50000, line: 'priest',
    desc: '신의 대리인. 사제의 정점.',
    base: { hp: 1300, mp: 900, atk: 120, def: 140, mag: 200 },
    grow: { hp: 55, mp: 30, atk: 7, def: 7, mag: 10 },
    mainStats: ['wis', 'vit'],
    skills: [
      { id: 'judgment',      name: '신의 심판',     lv: 75, mp: 70, power: 5.5, type: 'mag', effect: 'holy', desc: '단일 성심판.' },
      { id: 'holy_war',      name: '성전 선포',     lv: 80, mp: 90, type: 'buff', effect: 'all_up_big', turns: 6, desc: '전 능력 +50%.' },
      { id: 'divine_apocalypse', name: '신의 종말', lv: 90, mp: 120, power: 6.5, type: 'mag_aoe', effect: 'undead_slay', desc: '언데드 +200%.' },
      { id: 'ascension',     name: '승천',         lv: 100, mp: 150, type: 'buff', effect: 'invul_short', turns: 3, desc: '3턴 무적.' },
    ],
  },
  saint: {
    tier: 4, name: '대성인(大聖人)', from: 'archbishop', altFrom: ['warpriest'], reqLv: 75, cost: 50000, line: 'priest',
    desc: '기적의 화신.',
    base: { hp: 1100, mp: 1000, atk: 80, def: 110, mag: 230 },
    grow: { hp: 45, mp: 35, atk: 5, def: 6, mag: 12 },
    mainStats: ['wis', 'int'],
    skills: [
      { id: 'true_miracle',  name: '진정한 기적',   lv: 75, mp: 80, power: 5.0, type: 'heal', desc: '완전 회복.' },
      { id: 'holy_bloom',    name: '성스러운 개화', lv: 80, mp: 90, power: 4.0, type: 'mag_aoe', effect: 'holy', desc: '광역 성광.' },
      { id: 'revelation',    name: '계시',         lv: 90, mp: 100, type: 'buff', effect: 'regen', turns: 6, desc: '매턴 HP 30%.' },
      { id: 'sanctity',      name: '성역화',       lv: 100, mp: 130, type: 'buff', effect: 'invul_short', turns: 2, desc: '2턴 무적.' },
    ],
  },
  shadow_emperor: {
    tier: 4, name: '암제(暗帝)', from: 'shadow', altFrom: ['nightblade'], reqLv: 75, cost: 50000, line: 'thief',
    desc: '그림자의 황제. 어둠 그 자체.',
    base: { hp: 1000, mp: 600, atk: 240, def: 90, mag: 120 },
    grow: { hp: 45, mp: 22, atk: 14, def: 5, mag: 6 },
    mainStats: ['dex', 'luk'],
    skills: [
      { id: 'void_slash',    name: '공허 베기',     lv: 75, mp: 50, power: 5.5, type: 'phys', effect: 'pierce_def', desc: '방어 무시.' },
      { id: 'shadow_realm',  name: '그림자 영역',   lv: 80, mp: 70, type: 'buff', effect: 'invisible', turns: 5, desc: '5턴 무적.' },
      { id: 'thousand_blades', name: '천의 칼날',   lv: 90, mp: 100, power: 1.0, type: 'phys', hits: 10, desc: '10연타.' },
      { id: 'assassinate_ult', name: '극암살',     lv: 100, mp: 130, power: 10.0, type: 'phys', effect: 'crit_100', desc: '확정 치명 초딜.' },
    ],
  },
  freeman_king: {
    tier: 4, name: '무림왕', from: 'swashbuckler', altFrom: ['adventurer'], reqLv: 75, cost: 50000, line: 'thief',
    desc: '규칙 밖의 왕.',
    base: { hp: 1050, mp: 580, atk: 210, def: 100, mag: 100 },
    grow: { hp: 48, mp: 21, atk: 13, def: 6, mag: 6 },
    mainStats: ['dex', 'luk'],
    skills: [
      { id: 'unbound_strike', name: '무구속',       lv: 75, mp: 40, power: 4.8, type: 'phys', effect: 'gamble', desc: '랜덤 강타.' },
      { id: 'legendary_gamble', name: '전설의 도박', lv: 85, mp: 60, power: 5.5, type: 'phys', effect: 'gamble', hits: 2, desc: '2연 도박.' },
      { id: 'infinite_fortune', name: '무한 행운', lv: 92, mp: 80, type: 'buff', effect: 'all_up_big', turns: 5, desc: '전 능력 +50%.' },
      { id: 'king_strike',   name: '왕의 일격',     lv: 100, mp: 120, power: 8.0, type: 'phys', effect: 'crit_plus', desc: '극딜.' },
    ],
  },
  dragon_slayer_god: {
    tier: 4, name: '용살제', from: 'dragonslayer', altFrom: ['magicshot'], reqLv: 75, cost: 55000, line: 'ranger',
    desc: '모든 용을 쓰러뜨리는 자.',
    base: { hp: 1100, mp: 650, atk: 250, def: 100, mag: 120 },
    grow: { hp: 48, mp: 24, atk: 14, def: 6, mag: 7 },
    mainStats: ['dex', 'str'],
    skills: [
      { id: 'dragon_killer',  name: '용살',         lv: 75, mp: 60, power: 6.0, type: 'phys', effect: 'dragon_slay', desc: '용에 2배.' },
      { id: 'world_piercer',  name: '세계 관통',    lv: 80, mp: 80, power: 6.5, type: 'phys', effect: 'pierce_def', desc: '방어 무시.' },
      { id: 'star_arrow',     name: '별의 화살',    lv: 90, mp: 100, power: 7.5, type: 'phys_aoe', desc: '별의 화살비.' },
      { id: 'god_killer',     name: '신살',        lv: 100, mp: 140, power: 12.0, type: 'phys', effect: 'crit_100', desc: '확정 치명 극딜.' },
    ],
  },
  nature_king: {
    tier: 4, name: '자연의 왕', from: 'druid', altFrom: ['rangerking'], reqLv: 75, cost: 55000, line: 'ranger',
    desc: '자연 그 자체가 된 자.',
    base: { hp: 1150, mp: 900, atk: 180, def: 120, mag: 200 },
    grow: { hp: 50, mp: 33, atk: 10, def: 7, mag: 10 },
    mainStats: ['wis', 'dex'],
    skills: [
      { id: 'gaea_wrath',     name: '대지모의 분노', lv: 75, mp: 70, power: 5.0, type: 'mag_aoe', desc: '광역 자연.' },
      { id: 'forest_lord',    name: '숲의 군주',    lv: 80, mp: 85, type: 'buff', effect: 'all_up_big', turns: 6, desc: '전 능력 +50%.' },
      { id: 'world_tree',     name: '세계수',       lv: 90, mp: 110, power: 4.5, type: 'heal', desc: '대량 회복.' },
      { id: 'nature_god',     name: '자연 현신',    lv: 100, mp: 150, power: 8.0, type: 'mag_aoe', effect: 'thorns', desc: '자연의 심판.' },
    ],
  },
  gold_god: {
    tier: 4, name: '황금제', from: 'guildmaster', altFrom: ['goldking'], reqLv: 75, cost: 80000, line: 'merchant',
    desc: '돈의 신. 대륙의 경제를 지배한다.',
    base: { hp: 1000, mp: 700, atk: 180, def: 120, mag: 150 },
    grow: { hp: 46, mp: 24, atk: 10, def: 7, mag: 8 },
    mainStats: ['cha', 'luk'],
    skills: [
      { id: 'gold_rain',      name: '황금비',       lv: 75, mp: 60, power: 4.5, type: 'phys_aoe', effect: 'gold_strike', desc: '골드 소비 강타.' },
      { id: 'infinite_wealth', name: '무한한 부',   lv: 80, mp: 70, type: 'buff', effect: 'wealth', turns: 99, desc: '골드 비례 공/방 +.' },
      { id: 'midas_touch',    name: '미다스의 손',  lv: 90, mp: 100, power: 6.0, type: 'phys', effect: 'gold_drain', desc: '골드 흡수.' },
      { id: 'throne_gold',    name: '황금 왕좌',    lv: 100, mp: 120, type: 'buff', effect: 'all_up_big', turns: 5, desc: '전 능력 +50%.' },
    ],
  },
  info_god: {
    tier: 4, name: '정보제', from: 'shadowmerchant', altFrom: ['informerking'], reqLv: 75, cost: 80000, line: 'merchant',
    desc: '모든 비밀의 소유자.',
    base: { hp: 900, mp: 950, atk: 140, def: 100, mag: 230 },
    grow: { hp: 42, mp: 33, atk: 8, def: 6, mag: 11 },
    mainStats: ['int', 'cha'],
    skills: [
      { id: 'all_seeing',     name: '전능시',       lv: 75, mp: 70, type: 'debuff', effect: 'mark', turns: 6, desc: '받는 피해 +50%.' },
      { id: 'mind_shatter',   name: '정신 분쇄',    lv: 80, mp: 85, power: 5.0, type: 'mag', effect: 'fear', turns: 4, desc: '공포.' },
      { id: 'omniscience_2',  name: '전지',        lv: 90, mp: 100, type: 'buff', effect: 'all_up_big', turns: 6, desc: '전 능력 +50%.' },
      { id: 'truth_apocalypse', name: '진실의 종말', lv: 100, mp: 140, power: 7.5, type: 'mag_aoe', effect: 'pierce_def', desc: '절대 진실.' },
    ],
  },

  // ═════════════ 4차 종족 전용 5개 ═════════════
  human_god: {
    tier: 4, name: '초월신', from: 'hero_god', reqLv: 75, cost: 70000, line: 'hero', raceOnly: 'human',
    desc: '인간이 신이 되는 마지막 경지.',
    base: { hp: 1300, mp: 900, atk: 200, def: 140, mag: 180 },
    grow: { hp: 55, mp: 32, atk: 12, def: 7, mag: 9 },
    mainStats: ['str', 'cha'],
    skills: [
      { id: 'transcend',     name: '초월',         lv: 75, mp: 80, type: 'buff', effect: 'all_up_big', turns: 6, desc: '전 능력 +50%.' },
      { id: 'gods_will',     name: '신의 뜻',      lv: 80, mp: 100, power: 6.0, type: 'phys_aoe', desc: '광역 극딜.' },
      { id: 'eternal_legend', name: '영원한 전설', lv: 90, mp: 130, type: 'buff', effect: 'undying', turns: 5, desc: '5턴 불멸.' },
      { id: 'human_divinity', name: '인간의 신성', lv: 100, mp: 150, power: 9.0, type: 'phys', effect: 'crit_100', desc: '확정 치명 극딜.' },
    ],
  },
  primordial_spirit: {
    tier: 4, name: '원초의 지혜', from: 'elemental_sage', reqLv: 75, cost: 80000, line: 'spiritcaller', raceOnly: 'elf',
    desc: '엘프가 도달할 수 있는 궁극의 정령 경지.',
    base: { hp: 800, mp: 1300, atk: 40, def: 90, mag: 320 },
    grow: { hp: 35, mp: 45, atk: 3, def: 5, mag: 18 },
    mainStats: ['int', 'wis'],
    skills: [
      { id: 'primordial_storm', name: '원초 폭풍', lv: 75, mp: 100, power: 6.0, type: 'mag_aoe', hits: 2, desc: '2연 폭풍.' },
      { id: 'world_spirit',   name: '세계의 정령', lv: 80, mp: 120, type: 'buff', effect: 'sage_aura', turns: 99, desc: '영구 +30%.' },
      { id: 'creation',       name: '창세',        lv: 90, mp: 150, power: 8.0, type: 'mag_aoe', desc: '창세의 일격.' },
      { id: 'spirit_god',     name: '정령신 현신', lv: 100, mp: 180, type: 'buff', effect: 'all_up_big', turns: 8, desc: '전 능력 +50%.' },
    ],
  },
  rune_emperor: {
    tier: 4, name: '룬황제', from: 'rune_dragon', reqLv: 75, cost: 70000, line: 'runemaster', raceOnly: 'dwarf',
    desc: '드워프의 최종 경지. 룬으로 세계를 새긴다.',
    base: { hp: 1500, mp: 700, atk: 220, def: 200, mag: 180 },
    grow: { hp: 65, mp: 25, atk: 13, def: 10, mag: 10 },
    mainStats: ['str', 'int'],
    skills: [
      { id: 'world_rune',    name: '세계 룬',      lv: 75, mp: 90, power: 6.0, type: 'phys_aoe', effect: 'pierce_def', desc: '광역 관통.' },
      { id: 'rune_fortress2', name: '룬 대요새',   lv: 80, mp: 100, type: 'buff', effect: 'all_defense', turns: 8, desc: '전 방어 +70%.' },
      { id: 'dragon_rune_breath', name: '룬 드래곤 숨결', lv: 90, mp: 130, power: 7.0, type: 'mag_aoe', effect: 'burn', turns: 5, desc: '용염.' },
      { id: 'divine_rune2',  name: '신성 대룬',    lv: 100, mp: 160, power: 10.0, type: 'mag', effect: 'pierce_def', desc: '신성 극딜.' },
    ],
  },
  primeval_titan: {
    tier: 4, name: '태초 거신', from: 'titan_god', reqLv: 75, cost: 70000, line: 'titan', raceOnly: 'ogre',
    desc: '세계 최초의 거인. 오우거의 전설.',
    base: { hp: 2200, mp: 200, atk: 280, def: 180, mag: 30 },
    grow: { hp: 85, mp: 10, atk: 16, def: 10, mag: 2 },
    mainStats: ['str', 'vit'],
    skills: [
      { id: 'world_crush',   name: '세계 분쇄',    lv: 75, mp: 60, power: 6.5, type: 'phys_aoe', effect: 'stun', turns: 2, desc: '전체 기절.' },
      { id: 'titan_god_form', name: '거신신 형상', lv: 80, mp: 90, type: 'buff', effect: 'all_up_big', turns: 6, desc: '전 능력 +50%.' },
      { id: 'apocalypse',    name: '종말',         lv: 90, mp: 120, power: 9.0, type: 'phys_aoe', desc: '종말급 일격.' },
      { id: 'immortal_titan', name: '불멸 거신',   lv: 100, mp: 140, type: 'buff', effect: 'undying', turns: 6, desc: '6턴 불멸.' },
    ],
  },
  fate_king: {
    tier: 4, name: '운명왕', from: 'fate_bard', reqLv: 75, cost: 80000, line: 'bard', raceOnly: 'halfelf',
    desc: '운명 그 자체를 노래하는 하프엘프 최종 경지.',
    base: { hp: 1000, mp: 1100, atk: 150, def: 110, mag: 260 },
    grow: { hp: 48, mp: 38, atk: 8, def: 6, mag: 13 },
    mainStats: ['cha', 'int'],
    skills: [
      { id: 'fate_rewrite',  name: '운명 재편',    lv: 75, mp: 90, type: 'buff', effect: 'all_up_big', turns: 6, desc: '전 능력 +50%.' },
      { id: 'death_verse',   name: '죽음의 시',    lv: 80, mp: 100, power: 5.5, type: 'mag_aoe', effect: 'fear', turns: 4, desc: '광역 공포.' },
      { id: 'time_mastery',  name: '시간 지배',    lv: 90, mp: 140, type: 'utility', effect: 'extra_turn', desc: '추가 턴.' },
      { id: 'eternal_song',  name: '영원의 노래',  lv: 100, mp: 170, power: 8.0, type: 'mag_aoe', desc: '영원한 선율.' },
    ],
  },

  // ═════════════ 히든 직업 (마스터리 시스템) ═════════════
  // 3개 계열 마스터(4차+Lv.90+전스킬) 시 해금
  polymath: {
    tier: 4, name: '파라곤(Paragon)', line: 'hidden_polymath', hidden: true,
    desc: '3개 직업 계열을 통달한 전설의 영웅. 수많은 길을 걸어본 자.',
    masteryReq: 3,
    base: { hp: 1500, mp: 1500, atk: 200, def: 180, mag: 250 },
    grow: { hp: 70, mp: 50, atk: 12, def: 10, mag: 13 },
    mainStats: ['str', 'dex', 'int', 'vit', 'wis', 'luk', 'cha'],
    skills: [
      { id: 'polymath_unity',   name: '통합', lv: 1, mp: 50, type: 'buff', effect: 'all_up_big', turns: 6, desc: '전 능력 +50%.' },
      { id: 'polymath_burst',   name: '만능 폭격', lv: 5, mp: 80, power: 5.0, type: 'mag_aoe', desc: '광역 강타.' },
      { id: 'polymath_heal',    name: '재생의 길', lv: 10, mp: 60, power: 4.0, type: 'heal', desc: '대량 회복.' },
      { id: 'polymath_extra',   name: '시공 흐름', lv: 20, mp: 90, type: 'utility', effect: 'extra_turn', desc: '추가 턴.' },
      { id: 'polymath_ultimate', name: '만능 극의', lv: 40, mp: 150, power: 8.0, type: 'phys', effect: 'crit_100', desc: '확정 치명 극딜.' },
    ],
  },
  // 5개 계열 마스터 시 폴리매스 → 업그레이드
  grand_unifier: {
    tier: 5, name: '반신(半神)', line: 'hidden_unifier', hidden: true,
    desc: '5개 계열을 모두 통달하여 신에 이른 자. 드래곤 라자조차 뛰어넘는다.',
    masteryReq: 5,
    base: { hp: 3500, mp: 3000, atk: 500, def: 400, mag: 500 },
    grow: { hp: 150, mp: 90, atk: 28, def: 20, mag: 28 },
    mainStats: ['str', 'dex', 'int', 'vit', 'wis', 'luk', 'cha'],
    skills: [
      { id: 'unifier_dominance', name: '지배',     lv: 1, mp: 100, type: 'buff', effect: 'all_up_big', turns: 10, desc: '전 능력 +50% (10턴).' },
      { id: 'unifier_meteor',    name: '대통합 메테오', lv: 10, mp: 150, power: 10.0, type: 'mag_aoe', effect: 'burn', turns: 5, desc: '광역 화염 메테오.' },
      { id: 'unifier_heal',      name: '만유재생',  lv: 20, mp: 120, power: 6.0, type: 'heal', desc: '완전 회복.' },
      { id: 'unifier_time',      name: '시간 정지', lv: 30, mp: 200, type: 'utility', effect: 'extra_turn', desc: '추가 턴.' },
      { id: 'unifier_transcend', name: '초월 일격', lv: 50, mp: 300, power: 25.0, type: 'phys', effect: 'crit_100', desc: '확정 치명. 세계를 베는 일격.' },
      { id: 'unifier_god',       name: '신의 영역', lv: 80, mp: 500, type: 'buff', effect: 'undying', turns: 10, desc: '10턴 불멸.' },
    ],
  },

  // ═════════════ 5차 신화 — 드래곤 라자 ═════════════
  dragon_raja: {
    tier: 5, name: '드래곤 라자', from: 'dragon_emperor',
    altFrom: ['sword_god','great_sage','death_god','holy_king','saint','shadow_emperor','freeman_king','dragon_slayer_god','nature_king','gold_god','info_god','human_god','primordial_spirit','rune_emperor','primeval_titan','fate_king'],
    reqLv: 120, cost: 500000, line: 'raja',
    desc: '드래곤과 대화할 수 있는 유일자. 모든 직업의 궁극.',
    base: { hp: 3000, mp: 2000, atk: 400, def: 300, mag: 400 },
    grow: { hp: 120, mp: 70, atk: 22, def: 15, mag: 22 },
    mainStats: ['str','dex','int','vit','wis','luk','cha'],
    skills: [
      { id: 'raja_strike',    name: '라자의 일격', lv: 120, mp: 100, power: 10.0, type: 'phys', effect: 'crit_100', desc: '확정 치명 절대 강타.' },
      { id: 'dragon_speech',  name: '용의 언어',   lv: 125, mp: 150, type: 'buff', effect: 'sage_aura', turns: 99, desc: '드래곤과 대화. 전투 내내 +30%.' },
      { id: 'raja_meteor',    name: '라자 메테오', lv: 135, mp: 200, power: 8.0, type: 'mag_aoe', effect: 'burn', turns: 5, desc: '광역 파괴.' },
      { id: 'all_attribute',  name: '만상귀일',    lv: 150, mp: 300, type: 'buff', effect: 'all_up_big', turns: 10, desc: '전 능력 +50% (10턴).' },
      { id: 'raja_transcend', name: '라자 초월',   lv: 180, mp: 500, power: 20.0, type: 'phys_aoe', effect: 'pierce_def', desc: '세계를 꿰뚫는 일격.' },
    ],
  },
};

// ───── 지역 & 맵 ─────
// exits: { '표시명': { to: 'key', hours: N } }
// hours: 이동 소요시간 (게임 내 시간). 도중 N회 인카운트 굴림.
const LOCATIONS = {
  heltant: {
    name: '헬턴트',
    desc: '그대가 자란 변방의 작은 마을. 풍차와 밀밭이 펼쳐져 있다.',
    npcs: {
      '촌장':          { band: ['새벽','낮','황혼'] },
      '대장장이 게롤트':{ band: ['낮','황혼'] },
      '술집주인 메이린':{ band: ['황혼','밤'] },
      '암거래상':       { band: ['밤'] },
    },
    shop: true, inn: true,
    exits: {
      '북쪽 숲': { to: 'forest', hours: 2 },
      '남쪽 가도': { to: 'road_south', hours: 2 },
      '페리윙클 평원': { to: 'periwinkle', hours: 3 },
    },
    encounters: ['slime', 'wolf'], encounterRate: 0.3,
    encountersByBand: { '밤': ['shadow_wolf','night_bat','moonlight_spider'] },
  },
  forest: {
    name: '북쪽 숲', desc: '울창한 전나무 숲. 고블린이 종종 출몰한다.',
    exits: {
      '헬턴트로': { to: 'heltant', hours: 2 },
      '더 깊은 숲': { to: 'deep_forest', hours: 3 },
    },
    encounters: ['wolf', 'goblin', 'bigSpider', 'hare', 'forest_bee', 'giant_beetle', 'deer', 'forest_sprite'], encounterRate: 0.6,
    encountersByBand: { '밤': ['shadow_wolf','ghoul','wisp','night_bat','moonlight_spider'] },
  },
  deep_forest: {
    name: '깊은 숲', desc: '햇빛이 겨우 스며드는 엘프의 영역.',
    npcs: {
      '암흑 사제 모르간': { band: ['황혼','밤'] },
    },
    exits: {
      '북쪽 숲으로': { to: 'forest', hours: 3 },
      '엘프의 마을': { to: 'elf_village', hours: 4 },
      '폐허된 성당': { to: 'ruined_cathedral', hours: 5 },
    },
    encounters: ['goblin', 'bigSpider', 'orc', 'forest_troll', 'dark_monk', 'forest_sprite'], encounterRate: 0.7, requireLv: 3,
    encountersByBand: { '밤': ['ghoul','night_wraith','wisp','dark_monk','shadow_wolf'] },
  },
  elf_village: {
    name: '이루릴의 마을', desc: '나무 위에 지어진 엘프 마을. 하프엘프 이루릴의 전설.',
    npcs: {
      '장로 엘리안':  { band: ['새벽','낮','황혼','밤'] },
      '상인 실바나':  { band: ['낮','황혼'] },
      '수색자 카일란':{ band: ['새벽','낮'] },
    },
    shop: true, inn: true,
    exits: {
      '깊은 숲으로': { to: 'deep_forest', hours: 4 },
      '용의 산맥': { to: 'dragon_mt', hours: 8 },
      '드워프 광산': { to: 'dwarf_mine', hours: 6 },
    },
    requireLv: 5,
  },
  road_south: {
    name: '남쪽 가도', desc: '수도로 이어지는 길. 산적이 자주 출몰한다.',
    exits: {
      '헬턴트로': { to: 'heltant', hours: 2 },
      '수도 바이서스': { to: 'capital', hours: 5 },
      '황금사슬 도적굴': { to: 'golden_chain', hours: 4 },
    },
    encounters: ['bandit', 'wolf', 'poor_thief', 'bandit_archer'], encounterRate: 0.5,
    encountersByBand: { '밤': ['shadow_wolf','ghoul','bandit','night_wraith'] },
  },
  capital: {
    name: '수도 바이서스', desc: '왕성 아래 번화한 수도. 모든 길드가 있다.',
    npcs: {
      '왕궁 마법사 핸드레이크': { band: ['새벽','낮','황혼'] },
      '기사단장 리프크네':      { band: ['새벽','낮','황혼'] },
      '대주교 유스티스':        { band: ['새벽','낮','황혼'] },
      '암살자 길드장':          { band: ['황혼','밤'] },
      '궁사 길드장 이무스':     { band: ['낮','황혼'] },
      '대장장이 마스터 흐랄':   { band: ['낮','황혼'] },
      '암거래상':               { band: ['밤'] },
    },
    shop: true, inn: true, quest: true,
    exits: {
      '남쪽 가도로': { to: 'road_south', hours: 5 },
      '왕궁': { to: 'palace', hours: 1 },
      '카밀카르 가는 길': { to: 'carmilkar', hours: 12 },
      '핸드레이크의 탑': { to: 'handrake_tower', hours: 4 },
      '자이펀 지하감옥': { to: 'zaipun_dungeon', hours: 5 },
    },
    requireLv: 4,
  },
  palace: {
    name: '바이서스 왕궁', desc: '대리석 기둥과 푸른 깃발이 휘날린다.',
    npcs: {
      '국왕 다케온': { band: ['낮','황혼'] },
      '재상':        { band: ['새벽','낮','황혼'] },
    },
    exits: { '수도로': { to: 'capital', hours: 1 } },
    requireLv: 8,
  },
  dragon_mt: {
    name: '용의 산맥', desc: '북방의 거대한 산맥. 아무르타트가 잠든 곳.',
    exits: {
      '엘프 마을로': { to: 'elf_village', hours: 8 },
      '용의 둥지': { to: 'dragon_lair', hours: 3 },
      '얼음 황무지': { to: 'ice_wastes', hours: 8 },
    },
    encounters: ['orc', 'troll', 'wyvern', 'mountain_orc', 'griffin', 'stone_drake'], encounterRate: 0.8, requireLv: 10,
  },
  dragon_lair: {
    name: '아무르타트의 둥지', desc: '폐허가 된 고대 요새. 용의 숨결이 느껴진다.',
    exits: { '산맥으로': { to: 'dragon_mt', hours: 3 } },
    boss: 'amurtat', requireLv: 50,
  },

  // ═══════════ 신규 사냥터 ═══════════
  periwinkle: {
    name: '페리윙클 평원', desc: '광활한 푸른 들판. 야생동물이 풍성하다.',
    exits: { '헬턴트로': { to: 'heltant', hours: 3 } },
    encounters: ['plain_wolf', 'wild_orc', 'hyena'], encounterRate: 0.6, requireLv: 4,
    encountersByBand: { '밤': ['shadow_wolf','moonlight_spider','ghoul','night_bat'] },
  },
  golden_chain: {
    name: '황금사슬 도적굴', desc: '바이서스 최대 도적단의 본거지. 깊은 동굴.',
    exits: { '남쪽 가도로': { to: 'road_south', hours: 4 } },
    encounters: ['bandit', 'thug', 'rogue_mage', 'bandit_archer', 'poor_thief'], encounterRate: 0.85,
    boss: 'gold_chain_boss', requireLv: 12,
  },
  ruined_cathedral: {
    name: '폐허된 성당', desc: '잊혀진 신을 모셨던 성당. 망령이 떠돈다.',
    exits: { '깊은 숲으로': { to: 'deep_forest', hours: 5 } },
    encounters: ['zombie', 'skeleton', 'wraith', 'cursed_nun', 'bone_knight', 'dark_monk'], encounterRate: 0.85,
    boss: 'dark_priest_lord', requireLv: 18,
  },
  dwarf_mine: {
    name: '잊혀진 드워프 광산', desc: '오래전 버려진 광산. 보석이 남아있다.',
    exits: { '엘프 마을로': { to: 'elf_village', hours: 6 } },
    encounters: ['kobold', 'cave_spider', 'rock_golem', 'mine_rat', 'crystal_golem'], encounterRate: 0.75,
    boss: 'mine_golem', requireLv: 20,
  },
  carmilkar: {
    name: '카밀카르', desc: '남부의 향신료 무역 도시. 사막의 관문.',
    npcs: {
      '상인 길드장 자히드':   { band: ['새벽','낮','황혼'] },
      '검투사 챔피언 라크살': { band: ['낮','황혼'] },
      '암거래상':              { band: ['밤'] },
    },
    shop: true, inn: true,
    exits: {
      '수도로': { to: 'capital', hours: 12 },
      '비스럴 사막': { to: 'bisrul_desert', hours: 6 },
      '활화산 칼라일': { to: 'volcano_kaleil', hours: 10 },
    },
    requireLv: 25,
  },
  bisrul_desert: {
    name: '비스럴 사막', desc: '끝없는 모래의 바다. 다림 부족이 도사린다.',
    exits: { '카밀카르로': { to: 'carmilkar', hours: 6 } },
    encounters: ['sand_lizard', 'sand_worm', 'mummy', 'darim_warrior', 'desert_wolf', 'scorpion', 'desert_ghost', 'efreet'], encounterRate: 0.7,
    boss: 'sand_pharaoh', requireLv: 30,
  },
  handrake_tower: {
    name: '핸드레이크의 탑', desc: '바이서스 최고 마법사의 탑. 미궁이 펼쳐진다.',
    npcs: {
      '수련생 알라잔': { band: ['새벽','낮','황혼','밤'] },
    },
    exits: { '수도로': { to: 'capital', hours: 4 } },
    encounters: ['arcane_construct', 'mage_apprentice', 'mirror_image', 'book_spirit', 'orb_guardian'], encounterRate: 0.6,
    encountersByBand: { '밤': ['shadow_stalker','wisp','mirror_image','book_spirit'] },
    boss: 'tower_guardian', requireLv: 25,
    treasure: 'dragon_wisdom_1',
  },
  zaipun_dungeon: {
    name: '자이펀 지하감옥', desc: '왕국이 봉인한 악마들이 갇힌 감옥.',
    exits: { '수도로': { to: 'capital', hours: 5 } },
    encounters: ['imp', 'demon', 'hellhound', 'hellbat', 'torturer', 'succubus', 'hell_knight'], encounterRate: 0.85,
    boss: 'demon_lord', requireLv: 35,
  },
  ice_wastes: {
    name: '얼음 황무지', desc: '북극의 얼음 평원. 화이트 드래곤의 영역.',
    exits: { '용의 산맥으로': { to: 'dragon_mt', hours: 8 } },
    encounters: ['ice_wolf', 'frost_giant', 'white_wyrmling', 'snow_leopard', 'ice_turtle', 'frost_serpent'], encounterRate: 0.8,
    boss: 'frost_dragon', requireLv: 40,
    treasure: 'dragon_wisdom_2',
  },
  volcano_kaleil: {
    name: '활화산 칼라일', desc: '용암이 끓는 화산. 화염 정령의 본거지.',
    exits: {
      '카밀카르로': { to: 'carmilkar', hours: 10 },
      '폴라리스 신전': { to: 'polaris_shrine', hours: 24 },
    },
    encounters: ['lava_slime', 'fire_elemental', 'salamander', 'magma_giant', 'fire_bat', 'magma_elem'], encounterRate: 0.85,
    boss: 'volcanic_drake', requireLv: 45,
    treasure: 'dragon_wisdom_3',
  },
  pendragon_peak: {
    name: '백룡의 봉우리', desc: '눈으로 뒤덮인 절대고독의 봉우리. 백룡 펜드래곤이 둥지를 튼다.',
    exits: { '얼음 황무지로': { to: 'ice_wastes', hours: 16 } },
    encounters: ['elder_drake', 'ancient_guard', 'voidling'], encounterRate: 0.6,
    boss: 'pendragon', requireLv: 80,
  },

  // ═══════════ 4대 드래곤 영지 (최종 컨텐츠) ═══════════
  kashirk_canyon: {
    name: '대지룡의 협곡', desc: '대륙을 가르는 거대 협곡. 카쉬르크가 잠들어 있다.',
    exits: { '비스럴 사막으로': { to: 'bisrul_desert', hours: 20 } },
    boss: 'kashirk', requireLv: 110,
  },
  polaris_shrine: {
    name: '폴라리스 신전', desc: '하늘에 떠 있는 신전. 신룡 폴라리스가 세계를 지켜본다.\n전설의 끝. 그를 쓰러뜨린 자는 신이 된다.',
    exits: { '활화산으로': { to: 'volcano_kaleil', hours: 24 } },
    boss: 'polaris', requireLv: 150,
  },
  dark_abyss: {
    name: '어둠의 심연', desc: '펜드래곤이 지키는 땅 너머. 어둠이 살아 움직이는 곳.',
    exits: { '백룡 봉우리로': { to: 'pendragon_peak', hours: 14 } },
    encounters: ['shadow_imp', 'void_wraith', 'abyssal_knight'], encounterRate: 0.7,
    boss: 'shadow_dragon', requireLv: 95,
  },
  rift_world: {
    name: '차원 균열', desc: '시공이 찢어진 틈. 이 너머엔 우리 세계가 아니다.',
    exits: { '대지룡 협곡으로': { to: 'kashirk_canyon', hours: 18 } },
    encounters: ['rift_spawn', 'chaos_elemental', 'void_stalker'], encounterRate: 0.75,
    boss: 'void_dragon', requireLv: 130,
  },
};
// 기존 지역에서 신규 지역으로 연결
LOCATIONS.pendragon_peak.exits['어둠의 심연'] = { to: 'dark_abyss', hours: 14 };
LOCATIONS.kashirk_canyon.exits['차원 균열'] = { to: 'rift_world', hours: 18 };

// ═══════════ Lv 50~80 공백 구간 (일반 사냥터) ═══════════
LOCATIONS.forgotten_ruins = {
  name: '망각의 유적',
  desc: '고대 왕국의 폐허. 잠자던 수호자들이 깨어난다.',
  exits: { '용의 산맥으로': { to: 'dragon_mt', hours: 6 } },
  encounters: ['ancient_warrior', 'cursed_wizard', 'stone_sentinel'], encounterRate: 0.75,
  boss: 'tomb_king', requireLv: 55,
};
LOCATIONS.crimson_canyon = {
  name: '진홍 협곡',
  desc: '피로 물든 붉은 협곡. 강자들이 수련하러 오는 험지.',
  exits: { '활화산으로': { to: 'volcano_kaleil', hours: 8 } },
  encounters: ['blood_wolf', 'crimson_berserker', 'lava_elemental_big'], encounterRate: 0.8,
  boss: 'crimson_lord', requireLv: 65,
};
LOCATIONS.moonlit_grove = {
  name: '달빛 숲',
  desc: '엘프의 비밀 성역. 달빛에만 드러나는 고대의 숲.',
  exits: { '이루릴의 마을로': { to: 'elf_village', hours: 7 } },
  encounters: ['moon_sprite', 'silver_wolf', 'treant'], encounterRate: 0.7,
  boss: 'moon_priestess', requireLv: 75,
};
LOCATIONS.dragon_mt.exits['망각의 유적'] = { to: 'forgotten_ruins', hours: 6 };
LOCATIONS.volcano_kaleil.exits['진홍 협곡'] = { to: 'crimson_canyon', hours: 8 };
LOCATIONS.elf_village.exits['달빛 숲'] = { to: 'moonlit_grove', hours: 7 };

// ═══════════ 진엔드게임: 드래곤 라자 세계관 최강자 ═══════════
// 폴라리스 이후, 마스터리 필요. 3명 모두 처치해야 진 엔드
LOCATIONS.blyer_sanctum = {
  name: '블라이어 고대 성역',
  desc: '폴라리스를 넘어선 자만 도달하는 곳. 어둠의 사제가 영원의 저주를 건다.',
  exits: { '폴라리스 신전으로': { to: 'polaris_shrine', hours: 20 } },
  encounters: ['dark_priest', 'fanatic', 'fallen_knight'], encounterRate: 0.85,
  boss: 'blyer', requireLv: 160, requireMastery: 1,
};
LOCATIONS.palaleon_market = {
  name: '팔라레온 그림자 궁전',
  desc: '진정한 정보왕의 영역. 2개 이상의 직업을 마스터한 자만 들어올 수 있다.',
  exits: { '블라이어 성역으로': { to: 'blyer_sanctum', hours: 15 } },
  encounters: ['shadow_rogue', 'poison_viper', 'info_sniper'], encounterRate: 0.9,
  boss: 'palaleon', requireLv: 180, requireMastery: 2,
};
LOCATIONS.tsiraithos_tower = {
  name: '치프라이쏘스 허공의 탑',
  desc: '시공 너머의 탑. 3개 직업을 마스터하고 히든 직업을 얻은 자만 비전의 왕과 마주할 수 있다.',
  exits: { '팔라레온 궁전으로': { to: 'palaleon_market', hours: 20 } },
  encounters: ['arcane_sphere', 'magi_golem', 'mage_guardian'], encounterRate: 0.85,
  boss: 'tsiraithos', requireLv: 200, requireMastery: 3, requireHidden: true,
};
LOCATIONS.polaris_shrine.exits['블라이어 성역'] = { to: 'blyer_sanctum', hours: 20 };

// ═══════════ 지역 대폭 확장 — 15개 신규 ═══════════

// Lv 1~10 (초반 사이드)
LOCATIONS.old_road = {
  name: '낡은 시골길', desc: '헬턴트 서쪽 오솔길. 순한 짐승과 유랑객.',
  exits: { '헬턴트로': { to: 'heltant', hours: 2 }, '강가': { to: 'river_delta', hours: 2 } },
  encounters: ['hare', 'deer', 'poor_thief', 'forest_bee'], encounterRate: 0.4,
};
LOCATIONS.river_delta = {
  name: '강 하류', desc: '맑은 강물이 흐르는 모래톱. 가끔 나가가 나타난다.',
  exits: { '낡은 시골길': { to: 'old_road', hours: 2 }, '늪지대': { to: 'naga_swamp', hours: 5 } },
  encounters: ['giant_beetle', 'forest_sprite', 'bandit_archer'], encounterRate: 0.5,
  requireLv: 6,
};
LOCATIONS.abandoned_farm = {
  name: '버려진 농장', desc: '역병으로 버려진 농장. 좀비가 기어다닌다.',
  exits: { '페리윙클 평원으로': { to: 'periwinkle', hours: 3 } },
  encounters: ['zombie', 'poor_thief', 'hare', 'wild_orc'], encounterRate: 0.55,
  requireLv: 5,
};

// Lv 10~25 (중반)
LOCATIONS.thief_woods = {
  name: '도적의 숲', desc: '산적 은신처. 가파른 절벽과 함정.',
  exits: { '남쪽 가도로': { to: 'road_south', hours: 3 } },
  encounters: ['bandit', 'bandit_archer', 'thug', 'poor_thief', 'rogue_mage'], encounterRate: 0.7,
  requireLv: 10,
};
LOCATIONS.trade_road = {
  name: '상인 대상로', desc: '수도-카밀카르 교역로. 호위와 매복이 교차한다.',
  exits: { '수도로': { to: 'capital', hours: 6 }, '카밀카르로': { to: 'carmilkar', hours: 8 } },
  encounters: ['bandit', 'bandit_archer', 'plain_wolf', 'hyena'], encounterRate: 0.5,
  requireLv: 12,
};
LOCATIONS.unknown_ruins = {
  name: '미지의 유적', desc: '엘프조차 잊은 고대 폐허. 수수께끼의 석조.',
  exits: { '깊은 숲으로': { to: 'deep_forest', hours: 4 } },
  encounters: ['forest_troll', 'dark_monk', 'skeleton', 'cursed_nun', 'wraith'], encounterRate: 0.7,
  requireLv: 18,
};

// Lv 25~50 (중후반)
LOCATIONS.pirate_cove = {
  name: '해적 소굴', desc: '카밀카르 외곽. 바다를 누비는 해적단 본거지.',
  exits: { '카밀카르로': { to: 'carmilkar', hours: 5 } },
  encounters: ['bandit', 'thug', 'bandit_archer', 'scorpion', 'desert_wolf'], encounterRate: 0.75,
  requireLv: 28,
};
LOCATIONS.ancient_battlefield = {
  name: '고대 전장', desc: '수천의 영혼이 잠든 땅. 밤마다 전투가 재현된다.',
  exits: { '폐허된 성당으로': { to: 'ruined_cathedral', hours: 6 } },
  encounters: ['skeleton', 'bone_knight', 'zombie', 'wraith', 'hell_knight', 'fallen_knight'], encounterRate: 0.8,
  requireLv: 32,
};
LOCATIONS.naga_swamp = {
  name: '나가의 늪', desc: '독기 서린 늪지대. 반수인 나가가 지배한다.',
  exits: { '강 하류로': { to: 'river_delta', hours: 5 }, '비스럴 사막으로': { to: 'bisrul_desert', hours: 8 } },
  encounters: ['cave_spider', 'scorpion', 'poison_viper', 'sand_lizard', 'bigSpider'], encounterRate: 0.75,
  requireLv: 28,
};
LOCATIONS.sky_island = {
  name: '하늘 섬', desc: '구름 위에 떠있는 섬. 비룡이 둥지를 튼다.',
  exits: { '용의 산맥으로': { to: 'dragon_mt', hours: 10 } },
  encounters: ['wyvern', 'griffin', 'stone_drake', 'mountain_orc'], encounterRate: 0.7,
  requireLv: 40,
};

// Lv 50~80
LOCATIONS.deep_city = {
  name: '심해 도시 아틀리아', desc: '물에 잠긴 고대 도시. 해저의 광경이 펼쳐진다.',
  exits: { '강 하류로': { to: 'river_delta', hours: 12 } },
  encounters: ['frost_serpent', 'ice_turtle', 'crystal_golem', 'poison_viper'], encounterRate: 0.75,
  requireLv: 55, boss: 'abyss_kraken',
};
LOCATIONS.star_hill = {
  name: '별의 언덕', desc: '밤하늘이 가장 가까이 느껴지는 곳. 천체의 힘이 내린다.',
  exits: { '달빛 숲으로': { to: 'moonlit_grove', hours: 6 } },
  encounters: ['moon_sprite', 'silver_wolf', 'arcane_sphere', 'book_spirit'], encounterRate: 0.6,
  requireLv: 70,
};
LOCATIONS.spirit_forest = {
  name: '영혼의 숲', desc: '자연령이 맴도는 신비한 숲. 드루이드의 성지.',
  exits: { '엘프 마을로': { to: 'elf_village', hours: 8 } },
  encounters: ['treant', 'moon_sprite', 'silver_wolf', 'forest_sprite'], encounterRate: 0.6,
  requireLv: 65,
};

// Lv 80~120
LOCATIONS.demon_keep = {
  name: '악마군주의 성', desc: '봉인된 악마 영주가 부활하려는 성. 진짜 지옥.',
  exits: { '자이펀 감옥으로': { to: 'zaipun_dungeon', hours: 12 } },
  encounters: ['hell_knight', 'demon', 'succubus', 'hellbat', 'hellhound', 'abyssal_knight'], encounterRate: 0.85,
  requireLv: 85, boss: 'demon_overlord',
};
LOCATIONS.dragon_graveyard = {
  name: '용의 무덤', desc: '고대 용들이 잠든 성지. 유골에서 힘이 새어나온다.',
  exits: { '용의 산맥으로': { to: 'dragon_mt', hours: 14 } },
  encounters: ['wyvern', 'stone_drake', 'elder_drake', 'void_wraith'], encounterRate: 0.75,
  requireLv: 90, boss: 'bone_dragon',
};
LOCATIONS.god_tomb = {
  name: '옛 신의 무덤', desc: '잊혀진 신이 잠든 지하 성역. 신성과 사악함이 공존.',
  exits: { '어둠의 심연으로': { to: 'dark_abyss', hours: 10 } },
  encounters: ['shadow_imp', 'void_wraith', 'abyssal_knight', 'wraith'], encounterRate: 0.8,
  requireLv: 100, boss: 'dead_god',
};

// Lv 120~150
LOCATIONS.time_corridor = {
  name: '시공의 회랑', desc: '시간이 뒤틀린 복도. 과거/미래의 적이 동시에 나타난다.',
  exits: { '차원 균열로': { to: 'rift_world', hours: 10 } },
  encounters: ['rift_spawn', 'chaos_elemental', 'void_stalker', 'voidling', 'ancient_guard'], encounterRate: 0.85,
  requireLv: 120, boss: 'time_warden',
};
LOCATIONS.genesis_land = {
  name: '창조의 대지', desc: '세계가 처음 만들어진 곳. 원초적 힘이 넘친다.',
  exits: { '폴라리스 신전으로': { to: 'polaris_shrine', hours: 15 } },
  encounters: ['ancient_guard', 'voidling', 'chaos_elemental', 'rift_spawn', 'void_stalker'], encounterRate: 0.8,
  requireLv: 140, boss: 'primal_serpent',
};

// Lv 180+ 진최종 (치프라이쏘스 이후, 숨겨진 초절 컨텐츠)
LOCATIONS.cosmos_edge = {
  name: '우주의 끝', desc: '현실이 의미를 잃는 곳. 대통합자만이 도달한다.',
  exits: { '치프라이쏘스 탑으로': { to: 'tsiraithos_tower', hours: 24 } },
  encounters: ['void_stalker', 'chaos_elemental', 'voidling', 'ancient_guard'], encounterRate: 0.9,
  requireLv: 220, requireMastery: 5, boss: 'cosmic_entity',
};
// 추가 출구: dragon_lair → ice_wastes 외 다른 경로 필요
LOCATIONS.ice_wastes.exits['백룡의 봉우리'] = { to: 'pendragon_peak', hours: 16 };
LOCATIONS.bisrul_desert.exits['대지룡의 협곡'] = { to: 'kashirk_canyon', hours: 20 };

// ═══════════ 고립 지역 진입로 연결 (편도 출구만 있던 신규 지역들) ═══════════
// 초반
LOCATIONS.heltant.exits['낡은 시골길']      = { to: 'old_road',      hours: 2 };
LOCATIONS.periwinkle.exits['버려진 농장']   = { to: 'abandoned_farm', hours: 3 };
// 중반
LOCATIONS.road_south.exits['도적의 숲']     = { to: 'thief_woods',   hours: 3 };
LOCATIONS.capital.exits['상인 대상로']      = { to: 'trade_road',    hours: 6 };
LOCATIONS.deep_forest.exits['미지의 유적']  = { to: 'unknown_ruins', hours: 4 };
// 중후반
LOCATIONS.carmilkar.exits['해적 소굴']      = { to: 'pirate_cove',   hours: 5 };
LOCATIONS.ruined_cathedral.exits['고대 전장'] = { to: 'ancient_battlefield', hours: 6 };
LOCATIONS.dragon_mt.exits['하늘 섬']        = { to: 'sky_island',    hours: 10 };
// Lv 50~80
LOCATIONS.elf_village.exits['영혼의 숲']    = { to: 'spirit_forest', hours: 8 };
LOCATIONS.moonlit_grove.exits['별의 언덕']  = { to: 'star_hill',     hours: 6 };
LOCATIONS.river_delta.exits['심해 도시 아틀리아'] = { to: 'deep_city',  hours: 12 };
// Lv 80~120
LOCATIONS.zaipun_dungeon.exits['악마군주의 성'] = { to: 'demon_keep', hours: 12 };
LOCATIONS.dragon_mt.exits['용의 무덤']      = { to: 'dragon_graveyard', hours: 14 };
LOCATIONS.dark_abyss.exits['옛 신의 무덤']  = { to: 'god_tomb',      hours: 10 };
// Lv 120+
LOCATIONS.rift_world.exits['시공의 회랑']   = { to: 'time_corridor', hours: 10 };
LOCATIONS.polaris_shrine.exits['창조의 대지'] = { to: 'genesis_land', hours: 15 };
// 진엔드 체인
LOCATIONS.blyer_sanctum.exits['팔라레온 그림자 궁전'] = { to: 'palaleon_market',   hours: 15 };
LOCATIONS.palaleon_market.exits['치프라이쏘스 허공의 탑'] = { to: 'tsiraithos_tower', hours: 20 };
LOCATIONS.tsiraithos_tower.exits['우주의 끝'] = { to: 'cosmos_edge',   hours: 24 };

// ───── 몬스터 ─────
// drops: [[itemKey, 확률(0~1)]]
const MONSTERS = {
  // ─── Lv 1~10 (헬턴트~숲) ───
  slime:     { name: '슬라임',     hp: 20, atk: 5, def: 1, exp: 8, gold: 5, tags: [], drops: [['potion_s', 0.10]] },
  wolf:      { name: '늑대',       hp: 35, atk: 9, def: 3, exp: 15, gold: 10, tags: ['beast'], drops: [['potion_s', 0.15]] },
  goblin:    { name: '고블린',     hp: 45, atk: 11, def: 4, exp: 22, gold: 18, tags: [], drops: [['dagger', 0.05], ['potion_s', 0.20]] },
  bigSpider: { name: '거대거미',   hp: 55, atk: 13, def: 5, exp: 28, gold: 15, tags: ['beast'], drops: [['ether_s', 0.15]] },
  bandit:    { name: '산적',       hp: 70, atk: 16, def: 7, exp: 40, gold: 50, tags: [], drops: [['shortsword', 0.05], ['potion_m', 0.10]] },
  // ─── 페리윙클 평원 (Lv 4~10) ───
  plain_wolf:{ name: '평원늑대',  hp: 50, atk: 14, def: 5, exp: 30, gold: 20, tags: ['beast'], drops: [['potion_s', 0.20]] },
  wild_orc:  { name: '들오크',     hp: 80, atk: 18, def: 8, exp: 55, gold: 40, tags: [], drops: [['handaxe', 0.10], ['leather', 0.08]] },
  hyena:     { name: '하이에나',  hp: 60, atk: 16, def: 6, exp: 40, gold: 25, tags: ['beast'], drops: [['potion_s', 0.25]] },
  // ─── 황금사슬 도적굴 (Lv 12~18) ───
  thug:      { name: '깡패',       hp: 110, atk: 22, def: 12, exp: 80, gold: 70, tags: [], drops: [['mace', 0.10], ['potion_m', 0.15]] },
  rogue_mage:{ name: '도적 마법사', hp: 95, atk: 14, def: 8, exp: 90, gold: 90, tags: ['mag'], drops: [['ether_m', 0.20], ['wand', 0.08]] },
  gold_chain_boss: { name: '두목 지스카', hp: 600, atk: 45, def: 22, exp: 500, gold: 800, tags: [], boss: true,
    drops: [['cutlass', 0.40], ['gold_chain_amulet', 0.25], ['potion_l', 0.5]] },
  // ─── 폐허된 성당 (Lv 18~25) ───
  zombie:    { name: '좀비',       hp: 150, atk: 25, def: 12, exp: 100, gold: 30, tags: ['undead'], drops: [['potion_m', 0.20]] },
  skeleton:  { name: '스켈레톤',   hp: 130, atk: 28, def: 14, exp: 110, gold: 40, tags: ['undead'], drops: [['rusty_blade', 0.10], ['bonebow', 0.08]] },
  wraith:    { name: '망령',       hp: 180, atk: 35, def: 18, exp: 180, gold: 60, tags: ['undead', 'mag'], drops: [['ether_m', 0.25]] },
  dark_priest_lord: { name: '흑사제장 칼릭스', hp: 1100, atk: 75, def: 35, exp: 1200, gold: 1500, tags: ['undead', 'mag'], boss: true,
    drops: [['cursed_staff', 0.40], ['shadow_robe', 0.30], ['potion_l', 0.5]] },
  // ─── 드워프 광산 (Lv 18~25) ───
  kobold:    { name: '코볼트',     hp: 100, atk: 22, def: 10, exp: 75, gold: 50, tags: [], drops: [['shortsword', 0.10]] },
  cave_spider:{ name: '동굴거미',  hp: 140, atk: 30, def: 14, exp: 120, gold: 60, tags: ['beast'], drops: [['ether_m', 0.20]] },
  rock_golem:{ name: '록 골렘',    hp: 350, atk: 40, def: 35, exp: 350, gold: 150, tags: [], drops: [['warhammer', 0.15], ['plate', 0.10]] },
  mine_golem:{ name: '광산 골렘 군주', hp: 1500, atk: 80, def: 60, exp: 1800, gold: 2000, tags: [], boss: true,
    drops: [['mithril_axe', 0.40], ['mithril', 0.30], ['ring_def', 0.6]] },
  // ─── 핸드레이크의 탑 (Lv 25~30) ───
  arcane_construct: { name: '비전 골렘', hp: 280, atk: 35, def: 25, exp: 320, gold: 200, tags: ['mag'], drops: [['archstaff', 0.05], ['ether_l', 0.15]] },
  mage_apprentice:  { name: '수련생', hp: 200, atk: 30, def: 20, exp: 280, gold: 180, tags: ['mag'], drops: [['ether_m', 0.30], ['robe', 0.10]] },
  mirror_image:     { name: '거울상', hp: 240, atk: 38, def: 22, exp: 300, gold: 100, tags: ['mag'], drops: [['ether_l', 0.20]] },
  tower_guardian:   { name: '탑의 수호자', hp: 2200, atk: 110, def: 60, exp: 4000, gold: 5000, tags: ['mag'], boss: true,
    drops: [['handrake_staff', 0.30], ['dragon_wisdom_1', 1.0], ['ether_l', 0.5]] },
  // ─── 비스럴 사막 (Lv 30~40) ───
  sand_lizard:    { name: '모래 도마뱀', hp: 250, atk: 42, def: 22, exp: 300, gold: 150, tags: ['beast'], drops: [['scimitar', 0.10]] },
  sand_worm:      { name: '사막 벌레',   hp: 400, atk: 55, def: 30, exp: 500, gold: 250, tags: ['beast'], drops: [['potion_l', 0.25]] },
  mummy:          { name: '미라',         hp: 320, atk: 48, def: 28, exp: 420, gold: 400, tags: ['undead'], drops: [['ether_l', 0.20], ['ring_atk', 0.15]] },
  darim_warrior:  { name: '다림 전사',   hp: 380, atk: 60, def: 32, exp: 480, gold: 350, tags: [], drops: [['scimitar', 0.20], ['darim_robe', 0.10]] },
  sand_pharaoh:   { name: '사막의 파라오', hp: 3000, atk: 130, def: 70, exp: 6000, gold: 8000, tags: ['undead', 'mag'], boss: true,
    drops: [['pharaoh_blade', 0.40], ['dragonring', 0.30], ['potion_x', 0.6]] },
  // ─── 자이펀 지하감옥 (Lv 35~45) ───
  imp:        { name: '임프',     hp: 280, atk: 50, def: 25, exp: 350, gold: 200, tags: [], drops: [['ether_l', 0.20]] },
  demon:      { name: '데몬',     hp: 600, atk: 75, def: 40, exp: 850, gold: 600, tags: [], drops: [['demonsword', 0.15], ['potion_l', 0.30]] },
  hellhound:  { name: '지옥견',   hp: 450, atk: 70, def: 35, exp: 700, gold: 400, tags: ['beast'], drops: [['potion_l', 0.30]] },
  demon_lord: { name: '데몬 영주', hp: 4000, atk: 150, def: 80, exp: 8000, gold: 10000, tags: [], boss: true,
    drops: [['demonblade_lord', 0.40], ['demon_armor', 0.30], ['elixir', 0.6]] },
  // ─── 얼음 황무지 (Lv 40~50) ───
  ice_wolf:      { name: '빙폭',         hp: 500, atk: 80, def: 40, exp: 800, gold: 350, tags: ['beast'], drops: [['potion_l', 0.30]] },
  frost_giant:   { name: '서리 거인',   hp: 900, atk: 110, def: 55, exp: 1500, gold: 700, tags: [], drops: [['frost_hammer', 0.20], ['mithril', 0.15]] },
  white_wyrmling:{ name: '백룡 새끼',   hp: 700, atk: 100, def: 50, exp: 1300, gold: 800, tags: ['dragon'], drops: [['ice_lance', 0.25]] },
  frost_dragon:  { name: '프로스트 드래곤', hp: 5500, atk: 170, def: 90, exp: 12000, gold: 15000, tags: ['dragon', 'boss'], boss: true,
    drops: [['ice_lance_legendary', 0.40], ['dragonring', 0.30], ['dragon_wisdom_2', 1.0], ['elixir', 1.0]] },
  // ─── 활화산 칼라일 (Lv 45~55) ───
  lava_slime:     { name: '용암 슬라임', hp: 600, atk: 90, def: 50, exp: 900, gold: 400, tags: [], drops: [['potion_l', 0.30]] },
  fire_elemental: { name: '화염 정령',   hp: 800, atk: 120, def: 55, exp: 1500, gold: 800, tags: ['mag'], drops: [['flameblade', 0.20], ['ether_l', 0.30]] },
  salamander:     { name: '샐러맨더',     hp: 1000, atk: 130, def: 60, exp: 1800, gold: 900, tags: ['beast'], drops: [['flame_robe', 0.15]] },
  volcanic_drake: { name: '화산 드레이크', hp: 6500, atk: 180, def: 95, exp: 15000, gold: 18000, tags: ['dragon', 'boss'], boss: true,
    drops: [['flameblade_legendary', 0.40], ['dragonring', 0.30], ['dragon_wisdom_3', 1.0], ['elixir', 1.0]] },
  // ─── 신규 다수 (레벨별 다양화) ───
  // 초반 (Lv 1~8)
  hare:           { name: '산토끼',    hp: 15, atk: 3, def: 0, exp: 5, gold: 3, tags: ['beast'], drops: [['potion_s', 0.15]] },
  forest_bee:     { name: '숲의 벌',    hp: 18, atk: 6, def: 1, exp: 8, gold: 4, tags: ['beast'] },
  giant_beetle:   { name: '거대 딱정벌레', hp: 40, atk: 8, def: 6, exp: 20, gold: 10, tags: ['beast'] },
  forest_sprite:  { name: '숲의 요정',  hp: 30, atk: 10, def: 3, exp: 18, gold: 20, tags: ['mag'], drops: [['ether_s', 0.20]] },
  poor_thief:     { name: '잔챙이 도적', hp: 50, atk: 12, def: 5, exp: 25, gold: 30, tags: [] },
  deer:           { name: '사슴',       hp: 45, atk: 7, def: 4, exp: 22, gold: 15, tags: ['beast'] },
  // 중반 (Lv 10~25)
  forest_troll:   { name: '숲 트롤',    hp: 160, atk: 26, def: 12, exp: 120, gold: 90, tags: [] },
  bandit_archer:  { name: '산적 궁수',  hp: 85, atk: 22, def: 7, exp: 60, gold: 65, tags: [], drops: [['bow', 0.08]] },
  dark_monk:      { name: '흑의 수도사', hp: 130, atk: 28, def: 14, exp: 140, gold: 100, tags: [], drops: [['robe', 0.05]] },
  cursed_nun:     { name: '저주받은 수녀', hp: 110, atk: 26, def: 10, exp: 130, gold: 80, tags: ['undead','mag'] },
  bone_knight:    { name: '뼈 기사',    hp: 260, atk: 38, def: 22, exp: 280, gold: 180, tags: ['undead'], drops: [['rusty_blade', 0.15]] },
  mine_rat:       { name: '광산 쥐',    hp: 90, atk: 20, def: 6, exp: 70, gold: 35, tags: ['beast'] },
  crystal_golem:  { name: '수정 골렘',  hp: 420, atk: 48, def: 40, exp: 400, gold: 250, tags: [], drops: [['ring_def', 0.08]] },
  // 고원/산악 (Lv 15~30)
  mountain_orc:   { name: '산악 오크',  hp: 200, atk: 34, def: 16, exp: 200, gold: 160, tags: [] },
  griffin:        { name: '그리핀',     hp: 380, atk: 50, def: 24, exp: 480, gold: 350, tags: ['beast'] },
  stone_drake:    { name: '돌 드레이크', hp: 320, atk: 48, def: 34, exp: 420, gold: 300, tags: ['dragon'] },
  // 탑/마법 (Lv 20~35)
  book_spirit:    { name: '책 정령',    hp: 220, atk: 32, def: 18, exp: 260, gold: 180, tags: ['mag'], drops: [['ether_m', 0.30]] },
  orb_guardian:   { name: '수정구 수호자', hp: 340, atk: 42, def: 30, exp: 380, gold: 240, tags: ['mag'], drops: [['staff', 0.10]] },
  // 사막 (Lv 30~45)
  desert_wolf:    { name: '사막 늑대',  hp: 280, atk: 48, def: 24, exp: 360, gold: 160, tags: ['beast'] },
  scorpion:       { name: '거대 전갈',  hp: 340, atk: 52, def: 28, exp: 420, gold: 200, tags: ['beast'] },
  desert_ghost:   { name: '사막 유령',  hp: 300, atk: 55, def: 26, exp: 460, gold: 250, tags: ['undead','mag'] },
  efreet:         { name: '이프리트',   hp: 520, atk: 70, def: 36, exp: 700, gold: 450, tags: ['mag'], drops: [['flameblade', 0.08]] },
  // 감옥/악마 (Lv 35~50)
  hellbat:        { name: '지옥 박쥐',  hp: 260, atk: 50, def: 22, exp: 340, gold: 180, tags: ['beast'] },
  torturer:       { name: '고문술사',   hp: 480, atk: 72, def: 34, exp: 650, gold: 500, tags: [] },
  succubus:       { name: '서큐버스',   hp: 420, atk: 68, def: 28, exp: 620, gold: 450, tags: ['mag'] },
  hell_knight:    { name: '지옥 기사',  hp: 700, atk: 95, def: 55, exp: 1100, gold: 800, tags: [], drops: [['demonsword', 0.12]] },
  // 얼음 (Lv 40~55)
  snow_leopard:   { name: '설표',       hp: 520, atk: 88, def: 42, exp: 900, gold: 400, tags: ['beast'] },
  ice_turtle:     { name: '얼음 거북',  hp: 850, atk: 70, def: 80, exp: 1200, gold: 600, tags: ['beast'], drops: [['ice_lance', 0.10]] },
  frost_serpent:  { name: '서리 뱀',    hp: 600, atk: 100, def: 45, exp: 1100, gold: 500, tags: ['beast','mag'] },
  // 화산 (Lv 45~60)
  magma_giant:    { name: '용암 거인',  hp: 1200, atk: 140, def: 70, exp: 2000, gold: 1000, tags: [], drops: [['warhammer', 0.10]] },
  fire_bat:       { name: '불의 박쥐',  hp: 450, atk: 95, def: 40, exp: 850, gold: 350, tags: ['beast'] },
  magma_elem:     { name: '마그마 정령', hp: 700, atk: 115, def: 55, exp: 1400, gold: 700, tags: ['mag'], drops: [['flameblade', 0.15]] },
  // 고급 (Lv 55~80)
  elder_drake:    { name: '장년 드레이크', hp: 1800, atk: 160, def: 90, exp: 3500, gold: 2000, tags: ['dragon'] },
  ancient_guard:  { name: '고대 수호자', hp: 2200, atk: 180, def: 110, exp: 4500, gold: 2500, tags: [] },
  voidling:       { name: '공허의 자손', hp: 1500, atk: 200, def: 80, exp: 4000, gold: 2200, tags: ['mag'] },

  // ─── 기존 ───
  orc:       { name: '오크 전사', hp: 100, atk: 22, def: 10, exp: 70, gold: 60, tags: [], drops: [['handaxe', 0.10]] },
  troll:     { name: '트롤',       hp: 180, atk: 28, def: 15, exp: 140, gold: 120, tags: [], drops: [['warhammer', 0.10]] },
  wyvern:    { name: '와이번',     hp: 250, atk: 35, def: 18, exp: 220, gold: 180, tags: ['dragon'], drops: [['ice_lance', 0.05]] },
  dark_knight:{ name: '흑기사',    hp: 500, atk: 60, def: 40, exp: 600, gold: 400, tags: [], drops: [['longsword', 0.15], ['plate', 0.10]] },
  chimera:   { name: '키메라',     hp: 700, atk: 75, def: 45, exp: 900, gold: 600, tags: ['beast'], drops: [['las', 0.05]] },
  lich_boss: { name: '고대 리치', hp: 1500, atk: 100, def: 50, exp: 2000, gold: 1200, tags: ['undead', 'mag'], boss: true,
    drops: [['cursed_staff', 0.40], ['amulet', 0.30]] },
  amurtat:   { name: '아무르타트', hp: 8000, atk: 250, def: 120, exp: 30000, gold: 15000, tags: ['dragon', 'boss'], boss: true,
    drops: [['scale_of_amurtat', 1.0], ['dragonring', 1.0], ['excalibur', 0.3]] },

  // ═══ 4대 드래곤 (최종 컨텐츠) ═══
  // 능력치 차이 압도적. Lv 80~150+ 대상.
  pendragon: { name: '백룡 펜드래곤', hp: 25000, atk: 450, def: 200, exp: 100000, gold: 50000,
    tags: ['dragon', 'boss', 'mag'], boss: true,
    drops: [['fang_of_pendragon', 1.0], ['heart_of_polaris', 0.05]] },
  // ═══ Lv 55 망각의 유적 ═══
  ancient_warrior: { name: '고대 전사',    hp: 850,  atk: 130, def: 70,  exp: 1400, gold: 600, tags: [] },
  cursed_wizard:   { name: '저주받은 마법사', hp: 720,  atk: 160, def: 55,  exp: 1500, gold: 700, tags: ['mag'] },
  stone_sentinel:  { name: '돌 보초병',    hp: 1500, atk: 150, def: 130, exp: 2200, gold: 900, tags: [] },
  tomb_king:       { name: '무덤의 왕',    hp: 12000, atk: 280, def: 130, exp: 25000, gold: 12000,
    tags: ['undead','boss'], boss: true, drops: [['longsword', 0.30], ['amulet_void', 0.30], ['elixir', 0.5]] },
  // ═══ Lv 65 진홍 협곡 ═══
  blood_wolf:        { name: '혈랑',        hp: 1100, atk: 210, def: 75,  exp: 2300, gold: 1100, tags: ['beast'] },
  crimson_berserker: { name: '진홍 광전사', hp: 1600, atk: 260, def: 100, exp: 3200, gold: 1600, tags: [], drops: [['mace', 0.10]] },
  lava_elemental_big:{ name: '용암 정령',   hp: 1900, atk: 290, def: 120, exp: 3800, gold: 1800, tags: ['mag'] },
  crimson_lord:      { name: '진홍 군주',   hp: 18000, atk: 360, def: 160, exp: 50000, gold: 25000,
    tags: ['boss'], boss: true, drops: [['flameblade_legendary', 0.30], ['phoenix_feather', 0.40], ['elixir', 0.5]] },
  // ═══ Lv 75 달빛 숲 ═══
  moon_sprite:     { name: '달빛 요정',    hp: 1400, atk: 220, def: 90,  exp: 3200, gold: 1300, tags: ['mag'] },
  silver_wolf:     { name: '은빛 늑대',    hp: 1700, atk: 250, def: 110, exp: 3500, gold: 1500, tags: ['beast'] },
  treant:          { name: '고목 수호자',  hp: 2800, atk: 280, def: 180, exp: 4500, gold: 2000, tags: ['beast'], drops: [['elfbow', 0.12]] },
  moon_priestess:  { name: '달의 여사제',  hp: 24000, atk: 400, def: 180, exp: 80000, gold: 40000,
    tags: ['mag','boss'], boss: true, drops: [['staff_of_moon', 1.0], ['sage_bracelet', 0.5], ['elixir', 0.5]] },

  // ═══ Lv 55 블라이어 성역 ═══
  dark_priest:     { name: '흑사제',       hp: 900,  atk: 140, def: 60,  exp: 1600, gold: 700, tags: ['mag'] },
  fanatic:         { name: '광신도',       hp: 1100, atk: 160, def: 70,  exp: 2000, gold: 800, tags: [] },
  fallen_knight:   { name: '타락한 기사',  hp: 1800, atk: 210, def: 120, exp: 3200, gold: 1500, tags: [], drops: [['longsword', 0.15]] },
  blyer:           { name: '대사제 블라이어', hp: 250000, atk: 1800, def: 900, exp: 2000000, gold: 800000,
    tags: ['mag','boss'], boss: true, drops: [['staff_of_blyer', 1.0], ['dragonring', 1.0], ['elixir', 2.0]] },
  // ═══ Lv 65 팔라레온 암시장 ═══
  shadow_rogue:    { name: '그림자 도적',  hp: 1400, atk: 230, def: 80,  exp: 2800, gold: 1800, tags: [] },
  poison_viper:    { name: '독뱀',         hp: 1200, atk: 250, def: 90,  exp: 3000, gold: 1400, tags: ['beast'] },
  info_sniper:     { name: '정보 저격수',  hp: 2000, atk: 290, def: 100, exp: 4200, gold: 2500, tags: [], drops: [['bow', 0.12]] },
  palaleon:        { name: '정보왕 팔라레온', hp: 500000, atk: 2700, def: 1200, exp: 5000000, gold: 2000000,
    tags: ['boss'], boss: true, drops: [['dagger_of_palaleon', 1.0], ['eye_of_fate', 1.0], ['raja_sigil', 0.5]] },
  // ═══ Lv 75 치프라이쏘스 탑 ═══
  arcane_sphere:   { name: '비전 구체',    hp: 1800, atk: 320, def: 130, exp: 4500, gold: 2200, tags: ['mag'] },
  magi_golem:      { name: '마력 골렘',    hp: 2800, atk: 360, def: 200, exp: 5500, gold: 3000, tags: ['mag'] },
  mage_guardian:   { name: '마법사 수호대', hp: 2200, atk: 380, def: 150, exp: 5000, gold: 2800, tags: ['mag'], drops: [['archstaff', 0.10]] },
  tsiraithos:      { name: '대마법사 치프라이쏘스', hp: 1200000, atk: 4500, def: 1800, exp: 15000000, gold: 5000000,
    tags: ['mag','boss'], boss: true, drops: [['staff_of_tsiraithos', 1.0], ['raja_sigil', 1.0], ['elixir', 3.0]] },

  // 어둠의 심연 (Lv.85~100)
  shadow_imp:     { name: '그림자 임프',   hp: 1500, atk: 180, def: 80,  exp: 2800,  gold: 1200, tags: ['mag'], drops: [['ether_l', 0.30]] },
  void_wraith:    { name: '공허의 망령',   hp: 2200, atk: 230, def: 100, exp: 4200,  gold: 1800, tags: ['undead','mag'] },
  abyssal_knight: { name: '심연의 기사',   hp: 3500, atk: 320, def: 180, exp: 7000,  gold: 3500, tags: [], drops: [['demonsword', 0.10]] },
  shadow_dragon:  { name: '그림자 용',     hp: 45000, atk: 620, def: 280, exp: 250000, gold: 120000, tags: ['dragon','boss'], boss: true,
    drops: [['fang_of_shadow', 1.0], ['dragonring', 1.0], ['elixir', 1.0]] },
  // 기존
  kashirk:   { name: '대지룡 카쉬르크', hp: 50000, atk: 700, def: 350, exp: 300000, gold: 150000,
    tags: ['dragon', 'boss'], boss: true,
    drops: [['claw_of_kashirk', 1.0], ['dragonring', 1.0], ['mithril', 1.0]] },
  // 차원 균열 (Lv.115~140)
  rift_spawn:      { name: '균열의 자손',  hp: 6000, atk: 450, def: 220, exp: 15000, gold: 6000, tags: ['mag'] },
  chaos_elemental: { name: '혼돈 정령',    hp: 8500, atk: 520, def: 280, exp: 22000, gold: 9000, tags: ['mag'], drops: [['god_staff', 0.08]] },
  void_stalker:    { name: '공허 추적자',  hp: 10000, atk: 650, def: 320, exp: 30000, gold: 12000, tags: [], drops: [['oblivion_blade', 0.10]] },
  void_dragon:     { name: '공허의 용',   hp: 95000, atk: 1050, def: 500, exp: 600000, gold: 280000, tags: ['dragon','boss'], boss: true,
    drops: [['claw_of_void', 1.0], ['dragonring', 1.0], ['elixir', 1.0]] },
  // 기존 최종 보스
  polaris:   { name: '신룡 폴라리스', hp: 150000, atk: 1500, def: 700, exp: 1000000, gold: 500000,
    tags: ['dragon', 'boss', 'god'], boss: true,
    drops: [['heart_of_polaris', 1.0], ['dragonring', 1.0]] },
  // ═══ 신규 지역 보스 ═══
  abyss_kraken:    { name: '심해 크라켄',    hp: 14000,   atk: 310,  def: 140, exp: 30000,   gold: 15000, tags: ['beast','boss'], boss: true,
    drops: [['ice_lance', 0.30], ['amulet_void', 0.25], ['elixir', 0.5]] },
  demon_overlord:  { name: '악마 영주',       hp: 38000,   atk: 540,  def: 260, exp: 180000,  gold: 90000, tags: ['boss'], boss: true,
    drops: [['demonblade_lord', 0.40], ['emperor_plate', 0.30]] },
  bone_dragon:     { name: '백골 드래곤',     hp: 42000,   atk: 580,  def: 280, exp: 220000,  gold: 110000, tags: ['dragon','undead','boss'], boss: true,
    drops: [['scale_of_amurtat', 0.25], ['phoenix_feather', 0.30]] },
  dead_god:        { name: '잊혀진 신',       hp: 60000,   atk: 720,  def: 340, exp: 320000,  gold: 150000, tags: ['mag','boss','god'], boss: true,
    drops: [['heart_of_polaris', 0.15], ['royal_scepter', 0.40]] },
  time_warden:     { name: '시공의 감시자',   hp: 110000,  atk: 1100, def: 500, exp: 800000,  gold: 400000, tags: ['mag','boss'], boss: true,
    drops: [['time_greatsword', 0.50], ['hourglass', 0.40]] },
  primal_serpent:  { name: '원초의 뱀',       hp: 180000,  atk: 1400, def: 650, exp: 1500000, gold: 700000, tags: ['beast','boss'], boss: true,
    drops: [['claw_of_kashirk', 0.30], ['raja_sigil', 0.20]] },
  cosmic_entity:   { name: '우주의 존재',     hp: 3000000, atk: 8000, def: 3000,exp: 50000000, gold: 20000000, tags: ['boss','god'], boss: true,
    drops: [['raja_sigil', 1.0], ['oblivion_blade', 1.0], ['elixir', 5.0]] },

  // ─── 야간 전용 몬스터 (C1) ─── band_night: '밤' / '황혼' 풀에 투입
  night_bat:        { name: '박쥐떼',         hp: 25,   atk: 8,    def: 2,   exp: 12,    gold: 6,    tags: ['beast','night'], drops: [['potion_s', 0.15]] },
  moonlight_spider: { name: '달빛거미',       hp: 40,   atk: 11,   def: 4,   exp: 20,    gold: 12,   tags: ['beast','night'], drops: [['ether_s', 0.20]] },
  shadow_wolf:      { name: '그림자 늑대',    hp: 70,   atk: 18,   def: 6,   exp: 45,    gold: 28,   tags: ['beast','night'], drops: [['potion_s', 0.20], ['leather', 0.10]] },
  ghoul:            { name: '구울',           hp: 120,  atk: 24,   def: 10,  exp: 85,    gold: 35,   tags: ['undead','night'], drops: [['potion_m', 0.18]] },
  wisp:             { name: '도깨비불',       hp: 95,   atk: 28,   def: 8,   exp: 95,    gold: 50,   tags: ['undead','mag','night'], drops: [['ether_m', 0.25]] },
  night_wraith:     { name: '밤의 망령',      hp: 220,  atk: 42,   def: 20,  exp: 240,   gold: 90,   tags: ['undead','mag','night'], drops: [['ether_m', 0.25], ['cursed_staff', 0.05]] },
  bone_walker:      { name: '해골병',         hp: 190,  atk: 45,   def: 22,  exp: 220,   gold: 80,   tags: ['undead','night'], drops: [['rusty_blade', 0.15]] },
  shadow_stalker:   { name: '그림자 추적자',  hp: 320,  atk: 60,   def: 28,  exp: 480,   gold: 220,  tags: ['mag','night'], drops: [['ether_l', 0.25]] },
  fell_hound:       { name: '흑염견',         hp: 480,  atk: 80,   def: 38,  exp: 780,   gold: 380,  tags: ['beast','night'], drops: [['potion_l', 0.30]] },
  dullahan:         { name: '듈라한',         hp: 650,  atk: 105,  def: 50,  exp: 1200,  gold: 650,  tags: ['undead','night'], drops: [['cursed_staff', 0.18], ['ring_atk', 0.12]] },
  nightmare_horse:  { name: '악몽의 흑마',    hp: 820,  atk: 130,  def: 60,  exp: 1800,  gold: 900,  tags: ['beast','undead','night'], drops: [['potion_l', 0.35]] },
  revenant:         { name: '복수귀',         hp: 1400, atk: 175,  def: 85,  exp: 3200,  gold: 1800, tags: ['undead','mag','night'], drops: [['ether_l', 0.35], ['shadow_robe', 0.15]] },
};

// ───── 아이템 ─────
const ITEMS = {
  // 소비
  potion_s:  { name: '하급 회복약', type: 'use', effect: 'heal', amount: 50, price: 30, desc: 'HP 50 회복.' },
  potion_m:  { name: '중급 회복약', type: 'use', effect: 'heal', amount: 150, price: 100, desc: 'HP 150 회복.' },
  potion_l:  { name: '상급 회복약', type: 'use', effect: 'heal', amount: 400, price: 300, desc: 'HP 400 회복.' },
  potion_x:  { name: '고급 회복약', type: 'use', effect: 'heal', amount: 1000, price: 900, desc: 'HP 1000 회복.' },
  ether_s:   { name: '하급 마나약', type: 'use', effect: 'mp', amount: 30, price: 40, desc: 'MP 30 회복.' },
  ether_m:   { name: '중급 마나약', type: 'use', effect: 'mp', amount: 100, price: 150, desc: 'MP 100 회복.' },
  ether_l:   { name: '상급 마나약', type: 'use', effect: 'mp', amount: 250, price: 400, desc: 'MP 250 회복.' },
  elixir:    { name: '엘릭서',     type: 'use', effect: 'full', price: 1000, desc: 'HP/MP 전부 회복.' },
  // 무기 (모든 무기에 스탯 보너스)
  dagger:    { name: '단검',         type: 'weapon', atk: 4, dex: 1, price: 50, desc: '가벼운 단검 (DEX+1).' },
  sword:     { name: '강철검',       type: 'weapon', atk: 10, str: 2, price: 300, desc: '표준검 (STR+2).' },
  longsword: { name: '장검',         type: 'weapon', atk: 22, str: 4, vit: 2, price: 1500, desc: '양손 장검 (STR+4 VIT+2).' },
  warhammer: { name: '전쟁망치',     type: 'weapon', atk: 18, str: 5, price: 900, desc: '드워프제 (STR+5).' },
  claymore:  { name: '클레이모어',   type: 'weapon', atk: 35, str: 6, vit: 3, price: 3500, desc: '거대 양손검 (STR+6 VIT+3).' },
  bow:       { name: '장궁',         type: 'weapon', atk: 12, dex: 3, price: 400, desc: '장궁 (DEX+3).' },
  elfbow:    { name: '엘프 장궁',   type: 'weapon', atk: 28, dex: 6, luk: 2, price: 2500, desc: '엘프제 명궁 (DEX+6 LUK+2).' },
  staff:     { name: '마법지팡이',   type: 'weapon', atk: 6, mag: 8, int: 3, price: 500, desc: '마력 (INT+3).' },
  archstaff: { name: '대마법 지팡이', type: 'weapon', atk: 10, mag: 22, int: 6, wis: 3, price: 3000, desc: '비전 (INT+6 WIS+3).' },
  excalibur: { name: '엑스칼리버',   type: 'weapon', atk: 60, str: 12, vit: 8, luk: 5, price: 20000, desc: '전설의 성검 (STR+12 VIT+8 LUK+5).' },
  // 방어구
  cloth:     { name: '천갑옷',   type: 'armor', def: 3, price: 60, desc: '헐렁한 천옷.' },
  leather:   { name: '가죽갑옷', type: 'armor', def: 8, price: 250, desc: '무두질 가죽.' },
  chain:     { name: '쇠사슬갑옷', type: 'armor', def: 14, price: 700, desc: '링메일.' },
  plate:     { name: '판금갑옷', type: 'armor', def: 22, price: 1800, desc: '완전판금.' },
  mithril:   { name: '미스릴 갑옷', type: 'armor', def: 40, price: 6000, desc: '드워프 최고작.' },
  robe:      { name: '마법 로브', type: 'armor', def: 10, mag: 10, price: 1000, desc: '마력의 로브.' },
  // 악세
  ring_atk:  { name: '힘의 반지', type: 'acc', atk: 5, price: 400, desc: '공격 +5.' },
  ring_def:  { name: '수호의 반지', type: 'acc', def: 5, price: 400, desc: '방어 +5.' },
  amulet:    { name: '현자의 목걸이', type: 'acc', mag: 8, mp: 30, price: 800, desc: '마력 +8, MP+30.' },
  dragonring:{ name: '용린의 반지', type: 'acc', atk: 15, def: 15, mag: 15, price: 10000, desc: '용의 비늘 반지.' },

  // ═══ 신규 무기 (스탯 보너스 포함) ═══
  shortsword:    { name: '단단검',         type: 'weapon', atk: 8, dex: 2, price: 180, desc: '튼튼한 단검 (DEX+2).' },
  handaxe:       { name: '손도끼',         type: 'weapon', atk: 12, str: 3, price: 350, desc: '한손 도끼 (STR+3).' },
  mace:          { name: '메이스',         type: 'weapon', atk: 14, str: 3, vit: 1, price: 500, desc: '둔기 (STR+3 VIT+1).' },
  wand:          { name: '나무 지팡이',     type: 'weapon', atk: 3, mag: 5, int: 2, price: 200, desc: '입문 (INT+2).' },
  rusty_blade:   { name: '녹슨 검',         type: 'weapon', atk: 7, price: 80, desc: '오래된 검.' },
  bonebow:       { name: '뼈 활',           type: 'weapon', atk: 14, dex: 4, price: 600, desc: '죽은 자의 활 (DEX+4).' },
  cutlass:       { name: '컷틀러스',         type: 'weapon', atk: 20, dex: 5, luk: 3, price: 1200, desc: '도적의 검 (DEX+5 LUK+3).' },
  scimitar:      { name: '시미터',          type: 'weapon', atk: 26, dex: 6, str: 3, price: 2200, desc: '사막 검 (DEX+6 STR+3).' },
  flameblade:    { name: '화염검',          type: 'weapon', atk: 32, mag: 12, str: 5, int: 4, price: 5000, desc: '화염 (STR+5 INT+4).' },
  ice_lance:     { name: '얼음창',          type: 'weapon', atk: 30, mag: 10, dex: 6, int: 4, price: 4500, desc: '빙창 (DEX+6 INT+4).' },
  cursed_staff:  { name: '저주받은 지팡이', type: 'weapon', atk: 12, mag: 30, int: 8, wis: -3, price: 5500, desc: '암흑 (INT+8 WIS-3).' },
  mithril_axe:   { name: '미스릴 도끼',     type: 'weapon', atk: 38, str: 8, vit: 4, price: 6000, desc: '드워프 명품 (STR+8 VIT+4).' },
  demonsword:    { name: '데몬 소드',       type: 'weapon', atk: 42, str: 10, vit: -3, price: 7000, desc: '악마의 검 (STR+10 VIT-3).' },
  frost_hammer:  { name: '서리 망치',       type: 'weapon', atk: 45, mag: 10, str: 9, vit: 4, price: 8000, desc: '얼음 (STR+9 VIT+4).' },
  pharaoh_blade: { name: '파라오의 검',     type: 'weapon', atk: 50, mag: 15, str: 8, int: 8, cha: 5, price: 12000, desc: '고대 (STR+8 INT+8 CHA+5).' },
  // ═══ 전설 무기 (보스 드랍) ═══
  las:                   { name: '라스(Las)',           type: 'weapon', atk: 55, str: 15, vit: 10, price: 0, restricted: ['warrior'], desc: '광전사의 명검 (STR+15 VIT+10).' },
  handrake_staff:        { name: '핸드레이크의 지팡이', type: 'weapon', atk: 25, mag: 60, int: 20, wis: 15, price: 0, restricted: ['mage'], desc: '대마법사 유산 (INT+20 WIS+15).' },
  flameblade_legendary:  { name: '진(眞) 화염검',       type: 'weapon', atk: 70, mag: 20, str: 12, int: 10, price: 0, desc: '드레이크의 정수 (STR+12 INT+10).' },
  ice_lance_legendary:   { name: '진(眞) 얼음창',       type: 'weapon', atk: 65, mag: 25, dex: 14, int: 10, price: 0, desc: '백룡의 송곳니 (DEX+14 INT+10).' },
  demonblade_lord:       { name: '데몬 군주의 검',     type: 'weapon', atk: 80, str: 18, vit: -5, price: 0, desc: '악마 군주 (STR+18 VIT-5).' },

  // ═══ Lv 55~75 보스 드랍 무기 ═══
  staff_of_moon:       { name: '달빛 지팡이', type: 'weapon', atk: 50, mag: 150, int: 20, wis: 20, cha: 10, price: 0,
    proc: { hp_regen: 0.05, mp_regen: 10 }, desc: '은은한 달빛. 매턴 HP 5%, MP 10 회복.' },

  // ═══ 드래곤 라자 최강자 무기 (중간 보스) ═══
  staff_of_blyer:       { name: '블라이어의 흑마법 지팡이', type: 'weapon', atk: 40, mag: 140, int: 25, wis: 15, price: 0,
    proc: { mp_cost_down: 0.30, burn_on_hit: 0.15 }, desc: '어둠의 사제 지팡이. MP -30%, 15% 화상.' },
  dagger_of_palaleon:   { name: '팔라레온의 독단검', type: 'weapon', atk: 120, dex: 40, luk: 25, price: 0,
    proc: { poison_on_hit: 0.30, crit_bonus: 0.20 }, desc: '정보왕의 단검. 30% 중독 + 치명 +20%.' },
  staff_of_tsiraithos:  { name: '치프라이쏘스의 지팡이', type: 'weapon', atk: 60, mag: 180, int: 35, wis: 25, price: 0,
    proc: { mp_cost_down: 0.35, extra_turn_chance: 0.10 }, desc: '비전의 지팡이. MP -35%, 10% 추가턴.' },

  // ═══ 중간 드래곤 무기 (신규 보스 드랍) ═══
  fang_of_shadow:  { name: '그림자 용의 송곳니', type: 'weapon', atk: 165, mag: 60, dex: 22, int: 15, price: 0,
    proc: { double_dmg: 0.12, dodge_chance: 0.08 }, desc: '그림자 용의 송곳니. 12% 2배 + 8% 회피.' },
  claw_of_void:    { name: '공허의 용 발톱',    type: 'weapon', atk: 210, mag: 90, str: 30, int: 20, price: 0,
    proc: { double_dmg: 0.18, extra_turn_chance: 0.08 }, desc: '공허의 용 발톱. 18% 2배 + 8% 추가턴.' },

  // ═══ 4대 드래곤 무기 (최종 컨텐츠 — 드래곤 드랍) ═══
  // proc 효과 포함 — 전투 시 확률 발동
  scale_of_amurtat:    { name: '아무르타트의 검',  type: 'weapon', atk: 150, str: 30, vit: 20, mag: 30, price: 0,
    proc: { burn_on_hit: 0.20 }, desc: '북부 용왕의 비늘. 20% 확률로 화상 부여.' },
  fang_of_pendragon:   { name: '펜드래곤의 송곳니', type: 'weapon', atk: 140, mag: 80, int: 35, dex: 20, price: 0,
    proc: { freeze_on_hit: 0.15 }, desc: '백룡의 송곳니. 15% 확률로 빙결.' },
  claw_of_kashirk:     { name: '카쉬르크의 발톱',   type: 'weapon', atk: 180, str: 35, dex: 25, price: 0,
    proc: { double_dmg: 0.15 }, desc: '대지룡의 발톱. 15% 확률로 피해 2배.' },
  heart_of_polaris:    { name: '폴라리스의 심장',   type: 'weapon', atk: 100, mag: 120, int: 50, wis: 40, cha: 20, price: 0,
    proc: { mp_cost_down: 0.30, extra_turn_chance: 0.10 }, desc: '신룡 폴라리스의 심장. MP -30%, 10% 추가 턴.' },

  // ═══ 신규 방어구 ═══
  shadow_robe:   { name: '그림자 로브', type: 'armor', def: 18, mag: 18, price: 3500, desc: '암흑 사제의 로브.' },
  darim_robe:    { name: '다림 부족 옷', type: 'armor', def: 25, price: 3000, desc: '사막 전사 의복.' },
  demon_armor:   { name: '데몬 갑옷',  type: 'armor', def: 50, price: 12000, desc: '악마의 비늘.' },
  flame_robe:    { name: '화염 로브',  type: 'armor', def: 28, mag: 25, price: 6500, desc: '화염 저항.' },

  // ═══ 신규 악세 ═══
  gold_chain_amulet: { name: '황금사슬 목걸이', type: 'acc', atk: 8, luk: 5, price: 2000, desc: '도적단 두목의 보물.' },

  // ═══ 전설 악세 (proc 효과 포함) ═══
  // proc 효과 키:
  //   dodge_chance: 확률로 피해 완전 무시
  //   reflect_chance: 받은 피해 반사
  //   dmg_reduce: 받는 피해 고정 감소%
  //   mag_resist: 마법 피해 감소%
  //   crit_bonus: 치명타 확률 +
  //   double_dmg: 가한 피해 확률 2배
  //   extra_turn_chance: 턴 종료 후 추가 턴 확률
  //   auto_revive: 치명상 시 1회 부활 (세트)
  //   hp_regen: 매턴 HP %
  //   mp_regen: 매턴 MP 고정
  //   mp_cost_down: 스킬 MP 소모%
  //   gold_mul: 골드 획득 배율
  //   drop_mul: 드랍률 배율
  //   burn_on_hit / freeze_on_hit / poison_on_hit: 공격 적중 시 부여 확률

  amulet_void:      { name: '무효의 부적',    type: 'acc', def: 15, price: 25000, requireLv: 30,
    proc: { dodge_chance: 0.12 }, desc: '12% 확률로 적 공격을 완전히 무시.' },
  ring_reflect:     { name: '반사의 반지',    type: 'acc', def: 20, mag: 15, price: 30000, requireLv: 35,
    proc: { reflect_chance: 0.15 }, desc: '15% 확률로 받은 피해의 80% 반사.' },
  phoenix_feather:  { name: '불사조의 깃털',  type: 'acc', hp: 200, vit: 10, price: 80000, requireLv: 50,
    proc: { auto_revive: true, hp_regen: 0.05 }, desc: '전투 중 1회 부활 + 매턴 HP 5% 회복.' },
  dragon_earring:   { name: '용신의 귀걸이',  type: 'acc', atk: 25, def: 20, mag: 20, price: 60000, requireLv: 50,
    proc: { double_dmg: 0.12 }, desc: '12% 확률로 내 공격 피해 2배.' },
  sage_bracelet:    { name: '현자의 팔찌',    type: 'acc', mag: 40, int: 15, wis: 15, price: 70000, requireLv: 50,
    proc: { mp_regen: 15, mp_cost_down: 0.20 }, desc: '매턴 MP+15, 스킬 MP 소모 -20%.' },
  holy_pendant:     { name: '신성한 펜던트',  type: 'acc', def: 25, vit: 15, wis: 15, price: 50000, requireLv: 40,
    proc: { hp_regen: 0.08, mag_resist: 0.25 }, desc: '매턴 HP 8%, 마법 저항 +25%.' },
  assassin_mark:    { name: '암살자의 징표',  type: 'acc', atk: 30, dex: 20, luk: 15, price: 75000, requireLv: 55,
    proc: { crit_bonus: 0.25 }, desc: '치명타 확률 +25%.' },
  eye_of_fate:      { name: '운명의 눈',      type: 'acc', luk: 30, cha: 15, price: 90000, requireLv: 60,
    proc: { drop_mul: 1.5, gold_mul: 1.5, crit_bonus: 0.10 }, desc: '골드·드랍 +50%, 치명 +10%.' },
  hourglass:        { name: '시간의 모래시계', type: 'acc', int: 20, wis: 20, cha: 10, price: 120000, requireLv: 70,
    proc: { extra_turn_chance: 0.15 }, desc: '매턴 15% 확률로 추가 턴.' },
  royal_scepter:    { name: '왕의 홀',        type: 'acc', str: 20, dex: 20, int: 20, vit: 20, wis: 20, luk: 20, cha: 20, price: 300000, requireLv: 80,
    proc: { dmg_reduce: 0.15, gold_mul: 2.0 }, desc: '전 스탯 +20, 피해 -15%, 골드 2배.' },
  raja_sigil:       { name: '라자의 징표',    type: 'acc', str: 40, dex: 40, int: 40, vit: 40, wis: 40, luk: 40, cha: 40, price: 1000000, requireLv: 120,
    proc: { dodge_chance: 0.10, double_dmg: 0.20, extra_turn_chance: 0.10, auto_revive: true, hp_regen: 0.05, mp_regen: 20 }, desc: '드래곤 라자의 징표. 모든 proc.' },

  // ═══ 전설 방어구 ═══
  dragon_scale_armor: { name: '용비늘 갑옷',  type: 'armor', def: 80, hp: 500, vit: 20, price: 100000, requireLv: 60,
    proc: { dmg_reduce: 0.10, mag_resist: 0.15 }, desc: '피해 -10%, 마법저항 +15%.' },
  archmage_robe:      { name: '대현자의 대로브', type: 'armor', def: 40, mag: 60, int: 20, wis: 20, mp: 200, price: 80000, requireLv: 55,
    proc: { mp_cost_down: 0.25, mag_resist: 0.30 }, desc: 'MP 소모 -25%, 마법저항 +30%.' },
  emperor_plate:      { name: '제왕의 갑주',   type: 'armor', def: 120, hp: 800, str: 15, vit: 15, price: 200000, requireLv: 75,
    proc: { dmg_reduce: 0.20, reflect_chance: 0.10 }, desc: '피해 -20%, 반사 10%.' },
  invincible_armor:   { name: '불멸 성갑',     type: 'armor', def: 200, hp: 1500, str: 25, vit: 25, wis: 25, price: 500000, requireLv: 100,
    proc: { dmg_reduce: 0.30, auto_revive: true, hp_regen: 0.05 }, desc: '피해 -30%, 부활, HP회복.' },

  // ═══ 전설 무기 추가 ═══
  time_greatsword:   { name: '시간의 대검',    type: 'weapon', atk: 200, str: 25, dex: 20, price: 180000, requireLv: 80,
    proc: { extra_turn_chance: 0.12, double_dmg: 0.10 }, desc: '12% 추가턴, 10% 2배 피해.' },
  eternal_bow:       { name: '영원의 활',      type: 'weapon', atk: 220, dex: 35, int: 15, price: 200000, requireLv: 85,
    proc: { crit_bonus: 0.30 }, desc: '치명 +30%.' },
  god_staff:         { name: '만신의 지팡이',  type: 'weapon', atk: 80, mag: 250, int: 40, wis: 40, price: 250000, requireLv: 90,
    proc: { mp_cost_down: 0.40 }, desc: 'MP 소모 -40%.' },
  oblivion_blade:    { name: '망각의 검',      type: 'weapon', atk: 280, str: 40, vit: -10, price: 300000, requireLv: 95,
    proc: { double_dmg: 0.25, burn_on_hit: 0.20 }, desc: '25% 2배, 20% 화상.' },

  // ═══ 퀘스트 아이템 ═══
  dragon_wisdom_1: { name: '용의 지혜 (火)', type: 'quest', price: 0, desc: '현자 전직 재료. 핸드레이크의 탑.' },
  dragon_wisdom_2: { name: '용의 지혜 (氷)', type: 'quest', price: 0, desc: '현자 전직 재료. 얼음 황무지.' },
  dragon_wisdom_3: { name: '용의 지혜 (雷)', type: 'quest', price: 0, desc: '현자 전직 재료. 활화산.' },
};

// 상점 구성
const SHOP_ITEMS = {
  heltant:     ['potion_s', 'ether_s', 'dagger', 'shortsword', 'wand', 'cloth', 'leather'],
  elf_village: ['potion_m', 'ether_m', 'bow', 'elfbow', 'leather', 'staff', 'ring_atk', 'ring_def'],
  capital:     ['potion_m', 'potion_l', 'potion_x', 'ether_m', 'ether_l', 'sword', 'longsword', 'warhammer', 'claymore', 'mace', 'handaxe', 'archstaff', 'robe', 'chain', 'plate', 'mithril', 'amulet', 'elixir', 'dragonring'],
  carmilkar:   ['potion_l', 'potion_x', 'ether_l', 'scimitar', 'flameblade', 'darim_robe', 'mithril', 'elixir', 'amulet', 'dragonring'],
};

// ═══════════ 무역 시스템 (도시간 시세차익) ═══════════
// 각 도시의 상품은 단일 시세. 싸게 살 수 있는 도시에서 사서
// 비싼 도시로 이동해 팔아 차익을 낸다.
// 실제 거래: 매입 시 price 지불, 매도 시 price × 0.92 수령 (8% 거래세)
const TRADE_GOODS = {
  salt:        { name: '소금',         desc: '북해의 결정.' },
  wine:        { name: '와인',         desc: '바이서스 명품.' },
  spice:       { name: '향신료',       desc: '카밀카르 향료.' },
  silk:        { name: '비단',         desc: '동방의 비단.' },
  herb:        { name: '약초',         desc: '평원의 약초.' },
  elf_string:  { name: '엘프 활시위',  desc: '신비한 섬유.' },
  mithril_ore: { name: '미스릴 광석',  desc: '드워프 광산.' },
  dragon_scale:{ name: '용 비늘',      desc: '드래곤 비늘 조각.' },
};

// 도시별 단일 시세. 판매 시 이 가격의 92% 수령.
// 거의 모든 도시가 대부분 상품을 거래하도록 확장 (취급 안 함 최소화)
const TRADE_PRICES = {
  heltant: {           // 내륙 농촌 — 수입품(비단/향신료/엘프제) 매우 비쌈
    salt:        60,
    wine:        140,
    spice:       200,
    silk:        420,  // 내륙 사치품 — 최고가
    herb:        35,
    elf_string:  280,
    mithril_ore: 340,
  },
  elf_village: {       // 엘프 마을 — 엘프제 저렴, 수입품 비쌈
    salt:        50,
    wine:        110,
    spice:       180,
    silk:        380,
    herb:        18,   // 엘프 숲 흔함
    elf_string:  70,   // 산지 — 가장 쌈
    mithril_ore: 300,
  },
  capital: {           // 수도 바이서스 — 유통 중심
    salt:        45,
    wine:        55,   // 명품 생산지
    spice:       110,
    silk:        240,
    herb:        40,
    elf_string:  180,
    mithril_ore: 260,
    dragon_scale:1500,
  },
  carmilkar: {         // 남부 해안 — 수입품 저렴
    salt:        25,   // 해안 — 가장 쌈
    wine:        95,
    spice:       55,   // 남부 특산 — 가장 쌈
    silk:        150,  // 실크로드 종점 — 가장 쌈
    herb:        55,
    elf_string:  220,
    mithril_ore: 340,
  },
  dwarf_mine: {        // 드워프 광산 — 미스릴 저렴, 술 비쌈
    salt:        52,
    wine:        130,  // 드워프는 술을 좋아한다
    herb:        28,
    elf_string:  260,
    mithril_ore: 85,   // 산지 — 가장 쌈
    silk:        200,
  },
  dragon_lair: {       // 드래곤 영역 — 특수
    dragon_scale: 550, // 채집지 — 가장 쌈
    mithril_ore: 400,  // 광물 수요
  },
};

// 매입/매도 수수료 비율
const TRADE_BUY_MARKUP = 1.00;   // 매입은 시세 100%
const TRADE_SELL_TAX   = 0.92;   // 매도는 시세 92% (8% 세금/수수료)

// ═══════════ 상인 스킬 (누적 거래 이익으로 해금) ═══════════
// 모든 직업이 거래 가능하지만, 상인계(line='merchant')는 이익 XP 3배
// 누적 이익(state.totalTradeProfit) 도달 시 해금
const TRADE_SKILLS = [
  { id: 'ts_appraise',   name: '대금 감정',     reqProfit: 3000,   type: 'passive',
    desc: '이익 +5%, 상점 -3%', effect: { tradeMul: 1.05, shopDisc: 0.03 } },
  { id: 'ts_caravan',    name: '캐러밴',        reqProfit: 10000,  type: 'passive',
    desc: '이동 중 도적 조우 -50%', effect: { safeTravel: 0.5 } },
  { id: 'ts_market_sense', name: '시장 감각',    reqProfit: 30000,  type: 'passive',
    desc: '이익 +15%', effect: { tradeMul: 1.15 } },
  { id: 'ts_logistics',  name: '대륙 물류왕',    reqProfit: 80000,  type: 'passive',
    desc: '골드 획득 +20%', effect: { goldMul: 1.20 } },
  { id: 'ts_wealth_eye', name: '부의 눈',       reqProfit: 200000, type: 'passive',
    desc: '이익 +30%, 드랍 +20%', effect: { tradeMul: 1.30, dropMul: 1.20 } },
  { id: 'ts_gold_standard', name: '금본위',      reqProfit: 500000, type: 'passive',
    desc: '이익 +50%, 상점 -15%', effect: { tradeMul: 1.50, shopDisc: 0.15 } },
  { id: 'ts_midas_heir', name: '미다스의 후예',  reqProfit: 1500000, type: 'passive',
    desc: '이익·골드 2배', effect: { tradeMul: 2.00, goldMul: 2.00 } },
];

// 퀘스트
// 퀘스트 스키마:
//   type: 'main' | 'chain_step' | 'sub' | 'repeat' (기본 'sub')
//   next: 완료 시 자동 이어지는 다음 퀘스트 id (체인)
//   timeBand: ['낮','밤',...] — 해당 시간대만 수주/완료 가능
//   expiresAt: 수락 후 N일 이내 완료 실패 시 자동 실패
//   cooldown: { days: N } — repeat 퀘스트 재수주 대기
const QUESTS = {
  q1: { id: 'q1', name: '늑대 퇴치', giver: '촌장', location: 'heltant', type: 'sub',
    desc: '마을 위협 늑대 3마리 처치.', target: { monster: 'wolf', count: 3 },
    reward: { exp: 50, gold: 100, item: 'potion_s' }, requireLv: 1 },
  q2: { id: 'q2', name: '고블린 소굴', giver: '촌장', location: 'heltant', type: 'sub',
    desc: '북쪽 숲 고블린 5마리.', target: { monster: 'goblin', count: 5 },
    reward: { exp: 200, gold: 300, item: 'leather' }, requireLv: 3 },
  q3: { id: 'q3', name: '수도의 부름', giver: '기사단장 리프크네', location: 'capital', type: 'sub',
    desc: '산적 3명 박멸.', target: { monster: 'bandit', count: 3 },
    reward: { exp: 500, gold: 800, item: 'sword' }, requireLv: 4 },
  q4: { id: 'q4', name: '엘프의 전언', giver: '장로 엘리안', location: 'elf_village', type: 'sub',
    desc: '와이번 2마리 처치.', target: { monster: 'wyvern', count: 2 },
    reward: { exp: 2000, gold: 1500, item: 'amulet' }, requireLv: 10 },
  q5: { id: 'q5', name: '드래곤 라자의 운명', giver: '국왕 다케온', location: 'palace', type: 'main',
    desc: '아무르타트를 쓰러뜨려라.', target: { monster: 'amurtat', count: 1 },
    reward: { exp: 20000, gold: 10000, item: 'excalibur' }, requireLv: 40 },
};

// ───── 전직 시스템 ─────
// 각 2차/3차 직업은 JOBS에 from/reqLv/cost가 있다.
// 여기선 누가(NPC) 어디서 전직시켜주는지 매핑.
const ADVANCE_NPC = {
  // 2차
  knight:       { loc: 'capital',     npc: '기사단장 리프크네' },
  gladiator:    { loc: 'capital',     npc: '기사단장 리프크네' },
  elementalist: { loc: 'capital',     npc: '왕궁 마법사 핸드레이크' },
  necromancer:  { loc: 'deep_forest', npc: '암흑 사제 모르간' },
  paladin:      { loc: 'capital',     npc: '대주교 유스티스' },
  bishop:       { loc: 'capital',     npc: '대주교 유스티스' },
  assassin:     { loc: 'capital',     npc: '암살자 길드장' },
  outlaw:       { loc: 'heltant',     npc: '술집주인 메이린' },
  sniper:       { loc: 'capital',     npc: '궁사 길드장 이무스' },
  tracker:      { loc: 'elf_village', npc: '수색자 카일란' },
  // 종족 전용 2차
  hero_lord:    { loc: 'palace',      npc: '국왕 다케온' },
  archspirit:   { loc: 'elf_village', npc: '장로 엘리안' },
  runeblade:    { loc: 'capital',     npc: '대장장이 마스터 흐랄' },
  titan_king:   { loc: 'heltant',     npc: '촌장' },
  grand_bard:   { loc: 'elf_village', npc: '장로 엘리안' },
  // 3차
  crusader:    { loc: 'capital',     npc: '기사단장 리프크네' },
  dragoon:     { loc: 'capital',     npc: '기사단장 리프크네' },
  berserker:   { loc: 'dragon_mt',   npc: '(야생 광전사)' },
  monk:        { loc: 'elf_village', npc: '(방랑 무투가)' },
  archmage:    { loc: 'capital',     npc: '왕궁 마법사 핸드레이크' },
  sage:        { loc: 'capital',     npc: '왕궁 마법사 핸드레이크' },
  lich:        { loc: 'deep_forest', npc: '암흑 사제 모르간' },
  soulbinder:  { loc: 'deep_forest', npc: '암흑 사제 모르간' },
  avatar:      { loc: 'capital',     npc: '대주교 유스티스' },
  inquisitor:  { loc: 'capital',     npc: '대주교 유스티스' },
  archbishop:  { loc: 'capital',     npc: '대주교 유스티스' },
  warpriest:   { loc: 'capital',     npc: '대주교 유스티스' },
  shadow:      { loc: 'capital',     npc: '암살자 길드장' },
  nightblade:  { loc: 'capital',     npc: '암살자 길드장' },
  swashbuckler:{ loc: 'capital',     npc: '암살자 길드장' },
  adventurer:  { loc: 'heltant',     npc: '술집주인 메이린' },
  dragonslayer:{ loc: 'capital',     npc: '궁사 길드장 이무스' },
  magicshot:   { loc: 'capital',     npc: '궁사 길드장 이무스' },
  druid:       { loc: 'elf_village', npc: '장로 엘리안' },
  rangerking:  { loc: 'elf_village', npc: '장로 엘리안' },
  // 상인 계열
  trader:        { loc: 'capital',   npc: '상인 길드장 자히드' },
  informer:      { loc: 'capital',   npc: '상인 길드장 자히드' },
  guildmaster:   { loc: 'carmilkar', npc: '상인 길드장 자히드' },
  goldking:      { loc: 'carmilkar', npc: '상인 길드장 자히드' },
  shadowmerchant:{ loc: 'capital',   npc: '암살자 길드장' },
  informerking:  { loc: 'capital',   npc: '왕궁 마법사 핸드레이크' },
  // 종족 전용 3차
  hero_god:        { loc: 'palace',      npc: '국왕 다케온' },
  elemental_sage:  { loc: 'elf_village', npc: '장로 엘리안' },
  rune_dragon:     { loc: 'capital',     npc: '대장장이 마스터 흐랄' },
  titan_god:       { loc: 'heltant',     npc: '촌장' },
  fate_bard:       { loc: 'elf_village', npc: '장로 엘리안' },
  // 4차
  dragon_emperor:    { loc: 'capital',     npc: '기사단장 리프크네' },
  sword_god:         { loc: 'carmilkar',   npc: '검투사 챔피언 라크살' },
  great_sage:        { loc: 'capital',     npc: '왕궁 마법사 핸드레이크' },
  death_god:         { loc: 'deep_forest', npc: '암흑 사제 모르간' },
  holy_king:         { loc: 'capital',     npc: '대주교 유스티스' },
  saint:             { loc: 'capital',     npc: '대주교 유스티스' },
  shadow_emperor:    { loc: 'capital',     npc: '암살자 길드장' },
  freeman_king:      { loc: 'capital',     npc: '암살자 길드장' },
  dragon_slayer_god: { loc: 'capital',     npc: '궁사 길드장 이무스' },
  nature_king:       { loc: 'elf_village', npc: '장로 엘리안' },
  gold_god:          { loc: 'carmilkar',   npc: '상인 길드장 자히드' },
  info_god:          { loc: 'capital',     npc: '암살자 길드장' },
  // 종족 전용 4차
  human_god:         { loc: 'palace',      npc: '국왕 다케온' },
  primordial_spirit: { loc: 'elf_village', npc: '장로 엘리안' },
  rune_emperor:      { loc: 'capital',     npc: '대장장이 마스터 흐랄' },
  primeval_titan:    { loc: 'heltant',     npc: '촌장' },
  fate_king:         { loc: 'elf_village', npc: '장로 엘리안' },
  // 5차 신화
  dragon_raja:       { loc: 'capital',     npc: '왕궁 마법사 핸드레이크' },
};

// 기본 스탯 (레벨 1)
const BASE_STATS = { str: 10, dex: 10, int: 10, vit: 10, wis: 10, luk: 10, cha: 10 };

// ═══════════ 돈 쓰는 컨텐츠 ═══════════

// 저택 (도시별, 매일 임대료 수익 + 무료 휴식)
const PROPERTIES = {
  heltant_house:    { name: '헬턴트 오두막',     loc: 'heltant',   price: 5000,   income: 10,  desc: '아담한 오두막.' },
  capital_mansion:  { name: '바이서스 저택',     loc: 'capital',   price: 50000,  income: 200, desc: '귀족가의 저택.' },
  carmilkar_villa:  { name: '카밀카르 빌라',     loc: 'carmilkar', price: 80000,  income: 350, desc: '사막의 휴양지.' },
  elf_treehouse:    { name: '엘프 나무집',       loc: 'elf_village', price: 30000, income: 100, desc: '높이 솟은 거목의 집.' },
};

// 용병 (영구 동료 — 매 전투에 추가 행동)
// 고급 용병은 특수 지역에서만 고용 가능 + 레벨 제한
const MERCENARIES = {
  knight_merc:   { name: '용병 기사 발렌',   hire: 'capital',        price: 15000,  requireLv: 15, atk: 80,   desc: '왕립 용병단의 검사. 매턴 적 1명 공격.' },
  mage_merc:     { name: '용병 마법사 셀라', hire: 'capital',        price: 20000,  requireLv: 20, mag: 100,  desc: '왕궁 마법사 길드 출신. 매턴 전체 공격.' },
  priest_merc:   { name: '용병 사제 일라이', hire: 'capital',        price: 25000,  requireLv: 25, heal: 150, desc: '교회 파견 사제. 매턴 HP 회복.' },
  elite_warrior: { name: '엘리트 검사 카로스', hire: 'carmilkar',    price: 80000,  requireLv: 50, atk: 250,  desc: '투기장 챔피언. 카밀카르 투기장에서만.' },
  archmage_merc: { name: '대마법사 비라크', hire: 'handrake_tower', price: 150000, requireLv: 70, mag: 500,  desc: '핸드레이크의 제자. 탑에서만 만날 수 있다.' },
};

// 무기/방어구 강화 (대장장이 흐랄 — 수도)
// +1 ~ +10 단계, 단계별 ATK/DEF 증가, 비용 증가, 실패율 증가 (실패 시 -1)
const ENHANCEMENT = {
  costs:    [500, 1500, 3000, 6000, 12000, 25000, 50000, 100000, 250000, 500000],
  bonuses:  [0.20, 0.45, 0.75, 1.10, 1.50, 2.00, 2.60, 3.30, 4.10, 5.00], // 누적 배수
  failRate: [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.75, 0.80, 0.85],
};

// 도박장 (수도)
const CASINO = {
  loc: 'capital',
  games: {
    coin:    { name: '동전 던지기', odds: 0.50, payout: 2,   desc: '50% 확률 ×2.' },
    dice:    { name: '주사위',      odds: 0.30, payout: 3,   desc: '30% ×3.' },
    slot:    { name: '슬롯',        odds: 0.10, payout: 10,  desc: '10% ×10.' },
    jackpot: { name: '잭팟',        odds: 0.01, payout: 100, desc: '1% ×100.' },
  },
};

// 고급 요리 (각 1회만 먹을 수 있음 — 영구 +스탯)
const GOURMET = {
  loc: 'carmilkar',  // 카밀카르 미식 거리
  dishes: {
    spice_curry:   { name: '향신료 카레',       price: 3000,   bonus: { vit: 3 }, desc: 'VIT +3 영구.' },
    dragon_steak:  { name: '드래곤 스테이크',   price: 15000,  bonus: { str: 5, vit: 3 }, desc: 'STR+5 VIT+3.' },
    elf_wine:      { name: '엘프 와인 숙성주',  price: 8000,   bonus: { int: 4, wis: 2 }, desc: 'INT+4 WIS+2.' },
    pixie_cake:    { name: '요정 케이크',       price: 12000,  bonus: { dex: 4, luk: 3 }, desc: 'DEX+4 LUK+3.' },
    sage_tea:      { name: '현자의 차',         price: 25000,  bonus: { wis: 8 }, desc: 'WIS+8.' },
    royal_feast:   { name: '왕실 만찬',         price: 50000,  bonus: { cha: 10, luk: 5 }, desc: 'CHA+10 LUK+5.' },
    god_ambrosia:  { name: '신들의 음식',       price: 200000, bonus: { str:5, dex:5, int:5, vit:5, wis:5, luk:5, cha:5 }, desc: '전 스탯 +5 (1회 한정).' },
  },
};

// 작위 구매 (왕궁)
const TITLES = {
  loc: 'palace',
  ranks: {
    knight:  { name: '기사작',  price: 50000,    bonus: { str: 5, vit: 5 } },
    baron:   { name: '남작',    price: 200000,   bonus: { cha: 10, str: 5, vit: 5 } },
    viscount:{ name: '자작',    price: 500000,   bonus: { cha: 15, all: 5 } },
    earl:    { name: '백작',    price: 1500000,  bonus: { cha: 25, all: 10 } },
    duke:    { name: '공작',    price: 5000000,  bonus: { cha: 40, all: 20 } },
  },
};

// 드래곤 펫 — 전설 생물이므로 각자 어울리는 특별 지역에서만 입수
const PETS = {
  baby_dragon: { name: '새끼 드래곤', loc: 'dragon_lair', price: 200000, requireLv: 50,
    requireBoss: 'amurtat',
    skill: { name: '용의 숨결', atk: 200, desc: '매턴 적에게 화염 200 데미지.' },
    desc: '아무르타트가 남긴 알에서 부화. 용의 둥지에서만.' },
  phoenix:     { name: '불사조',     loc: 'volcano_kaleil', price: 500000, requireLv: 70,
    requireBoss: 'volcanic_drake',
    skill: { name: '재생의 깃털', heal: 100, desc: '매턴 HP 100 회복 + 죽으면 1회 부활.' },
    desc: '활화산 깊은 곳에 산다. 용암 속에서 거듭 태어나는 불멸의 새.' },
  shadow_wolf: { name: '그림자 늑대', loc: 'zaipun_dungeon', price: 350000, requireLv: 60,
    requireBoss: 'demon_lord',
    skill: { name: '그림자 추격', atk: 350, desc: '매턴 단일 적 강타.' },
    desc: '자이펀 지하감옥의 어둠에서 솟아난 짐승.' },
};

// 마차 (1회용 - 다음 이동 시간 50%)
const CARRIAGE_PRICE = 1500;

// ═══════════ 수련장 (집중수련 전용) ═══════════
// 실제 시간(분) 단위로 진행. 진행 중엔 다른 행동 불가, 중단 가능.
// 완료 시: XP = 레벨 × 분 × 수련장배율
// 10% 확률로 "깨달음 이벤트" → XP 2배 + 플레이버 텍스트
// 각 수련장마다 고유 특성
// effects:
//   eventMul: 깨달음 이벤트 확률 배율
//   lineBonus: 특정 직업 계열 XP 배율 (종족 전용 직업도 포함)
//   raceBonus: 특정 종족 XP 배율
//   trainTimeMul: 누적 수련시간 카운팅 배율 (스킬 해금 가속)
//   restoreMp: 수련 후 MP 완전 회복
//   restoreAll: HP/MP 완전 회복
//   titleMul: 작위 보유 시 추가 XP 배율
//   statBoost: 주스탯에 XP 비례 영구 훈련점 (매우 소량)
//   skillChance: 끝날 때 수련 스킬 즉시 해금 (확률)
const TRAINING_HALLS = {
  heltant: {
    name: '마을 수련장', mul: 1.0,
    desc: '마을 사람들이 체력 단련하는 곳. 초심자 친화적.',
    trait: '깨달음 이벤트 확률 2배',
    effects: { eventMul: 2.0 },
  },
  elf_village: {
    name: '엘프의 수련소', mul: 1.3,
    desc: '정령이 흐른다. 엘프·마법 계열의 성지.',
    trait: '엘프/마법 계열 +40%, 수련 후 MP 완전 회복',
    effects: {
      raceBonus: { elf: 1.4 },
      lineBonus: { mage: 1.4, spiritcaller: 1.6, priest: 1.2 },
      restoreMp: true,
    },
  },
  capital: {
    name: '바이서스 수련장', mul: 1.5,
    desc: '왕립 수련장. 체계적 커리큘럼.',
    trait: '누적 수련시간 +50% (스킬 해금 가속)',
    effects: { trainTimeMul: 1.5 },
  },
  carmilkar: {
    name: '투기장', mul: 1.6,
    desc: '실전의 땅. 검투사의 성지.',
    trait: '전사·도적·궁사 계열 +40%, 엘리트급 실전 XP',
    effects: {
      lineBonus: { warrior: 1.4, thief: 1.4, ranger: 1.4, hero: 1.3, titan: 1.3 },
    },
  },
  palace: {
    name: '왕궁 비밀 수련실', mul: 2.0,
    desc: '왕실 전용. 최고위 수련.',
    trait: '작위 보유 시 +70%, 모든 계열 소폭 보너스',
    effects: { titleMul: 1.7 },
  },
  polaris_shrine: {
    name: '신의 수련장', mul: 3.0,
    desc: '폴라리스의 공간. 신화급.',
    trait: '이벤트 3배 + 10% 확률로 수련 스킬 즉시 해금',
    effects: { eventMul: 3.0, skillChance: 0.10, restoreAll: true },
  },
  dragon_lair: {
    name: '용의 둥지', mul: 2.5,
    desc: '아무르타트의 영역. 용의 기운.',
    trait: '드래곤라자 계열 +100%, 전 능력 소량 훈련',
    effects: {
      lineBonus: { raja: 2.0, mage: 1.3, warrior: 1.3 },
      statBoost: 0.005, // 수련 완료 시 주스탯에 매우 소량 영구 +
    },
  },
};

// 수련 옵션 — 실제 시간 + 게임 내 경과 일수
// name = 수련 이름, min = 실제 분, days = 게임 내 경과 일수
const TRAIN_DURATIONS = [
  { min: 5,   name: '가벼운 명상',   days: 2   },
  { min: 15,  name: '기초 수련',     days: 5   },
  { min: 30,  name: '심화 수련',     days: 10  },
  { min: 60,  name: '집중 수련',     days: 20  },
  { min: 120, name: '극한 수련',     days: 40  },
];

// ═══════════ 탐험 랜덤 이벤트 ═══════════
// explore 시 전투 대신 간혹 이벤트 발생. 선택에 따라 다른 결과.
// { id, name, desc, options: [{ label, effect, result }] }
// effect 종류:
//   gold(+/-), xp(+), hp(+/-), mp(+/-), item(key), heal, mp_full, mp_zero,
//   random_item, stat_up(key), random_event(다시 주사위)
const RANDOM_EVENTS = [
  {
    id: 'chest', name: '보물 상자',
    desc: '길가에 낡은 상자가 놓여있다. 함정일지도 모른다.',
    options: [
      { label: '조심스럽게 연다 (DEX 판정)', check: 'dex', dc: 12, success: { gold: 300, xp: 100, msg: '상자를 열자 금화가 쏟아진다.' }, fail: { hp: -30, msg: '독침! HP -30' } },
      { label: '망치로 부순다', result: { gold: 150, msg: '대충 부숴서 반 정도 챙겼다.' } },
      { label: '그냥 간다', result: { msg: '의심은 오래 사는 비결이다.' } },
    ],
  },
  {
    id: 'merchant_rare', name: '수상한 상인',
    desc: '복면을 쓴 상인이 희귀품을 팔고 있다.',
    options: [
      { label: '상급 회복약 사기 (300G)', result: { gold: -300, item: 'potion_l', msg: '상자를 받았다.' }, requireGold: 300 },
      { label: '중급 마나약 사기 (150G)', result: { gold: -150, item: 'ether_m', msg: '물병을 받았다.' }, requireGold: 150 },
      { label: '그냥 간다', result: {} },
    ],
  },
  {
    id: 'spring', name: '신비한 샘',
    desc: '맑은 샘이 있다. 물에서 은은한 빛이 난다.',
    options: [
      { label: '물을 마신다', result: { heal: true, mp_full: true, msg: 'HP/MP가 완전 회복되었다!' } },
      { label: '얼굴을 씻는다', result: { random_stat: 1, msg: '어쩐지 정신이 맑아진다.' } },
      { label: '그냥 간다', result: {} },
    ],
  },
  {
    id: 'beggar', name: '거지',
    desc: '낡은 옷차림의 노인이 동전을 구걸한다.',
    options: [
      { label: '100G를 준다', result: { gold: -100, karma: 1, msg: '노인이 축복을 빈다. 언젠가 보답이 있을지도.' }, requireGold: 100 },
      { label: '10G를 준다', result: { gold: -10, msg: '노인이 고마워한다.' }, requireGold: 10 },
      { label: '무시한다', result: { msg: '갈 길을 간다.' } },
    ],
  },
  {
    id: 'riddle', name: '수수께끼',
    desc: '어느 스핑크스가 나타나 수수께끼를 낸다.\n"아침엔 네 발, 낮엔 두 발, 밤엔 세 발인 것은?"',
    options: [
      { label: '용', result: { hp: -50, msg: '"틀렸다." 숨결이 그대를 휩쓴다.' } },
      { label: '사람', result: { xp: 500, gold: 200, msg: '"지혜롭다." 스핑크스가 보상을 남기고 사라진다.' } },
      { label: '드래곤', result: { hp: -50, msg: '"틀렸다." 발톱이 스친다.' } },
    ],
  },
  {
    id: 'traveler', name: '길 잃은 여행자',
    desc: '수레가 망가져 곤란해하는 여행자가 있다.',
    options: [
      { label: '돕는다 (시간 -1h)', result: { xp: 150, item: 'potion_m', msg: '감사의 인사와 함께 회복약을 받았다.', time: 1 } },
      { label: '지나친다', result: {} },
    ],
  },
  {
    id: 'ambush', name: '매복!',
    desc: '갑자기 산적들이 나타났다!',
    options: [
      { label: '싸운다', result: { fight: ['bandit', 'bandit'] } },
      { label: '도망친다 (DEX)', check: 'dex', dc: 14, success: { msg: '간신히 도망쳤다.' }, fail: { hp: -40, gold: -50, msg: '당했다! HP -40, 골드 -50' } },
      { label: '돈을 준다', result: { gold: -200, msg: '돈을 주고 빠져나왔다.' }, requireGold: 200 },
    ],
  },
  {
    id: 'altar', name: '고대 제단',
    desc: '잊혀진 신을 모신 제단이다. 향을 피우면 축복을 받을 수 있다.',
    options: [
      { label: '기도한다 (500G 기부)', result: { gold: -500, stat_up_rand: 2, msg: '신의 축복을 받았다!' }, requireGold: 500 },
      { label: '관찰만 한다', result: { xp: 50, msg: '흥미로운 조각을 발견했다.' } },
    ],
  },
  {
    id: 'hunter', name: '사냥꾼',
    desc: '늙은 사냥꾼이 이야기를 건다. "요즘 젊은이들은..."',
    options: [
      { label: '이야기를 듣는다 (시간 -1h)', result: { xp: 300, msg: '옛이야기에서 지혜를 얻었다.', time: 1 } },
      { label: '술 한 잔 산다 (50G)', result: { gold: -50, xp: 500, item: 'potion_s', msg: '사냥꾼이 오랜 포션을 나눠주었다.', time: 1 }, requireGold: 50 },
      { label: '인사만 하고 간다', result: {} },
    ],
  },
  {
    id: 'cursed_statue', name: '저주받은 석상',
    desc: '이상한 기운이 감도는 석상이다.',
    options: [
      { label: '만진다', result: { random_curse: true, msg: '손이 얼어붙는 느낌. 운 시험.' } },
      { label: '기도한다', result: { hp: -20, xp: 200, msg: '석상이 그대의 피를 원한다.' } },
      { label: '파괴한다 (STR)', check: 'str', dc: 15, success: { gold: 300, xp: 300, msg: '석상이 부서지며 보석이 떨어진다!' }, fail: { hp: -50, msg: '반동에 다쳤다.' } },
    ],
  },
];

// ═══════════ 던전 ═══════════
// 다층 구조. 층마다 몬스터 조우, 3·6층에 중간보스, 마지막 층에 최종보스.
// 깊이 들어갈수록 보상 증가. 언제든 탈출 가능.
const DUNGEONS = {
  abandoned_mine: {
    name: '버려진 광산', loc: 'dwarf_mine', minLv: 18, floors: 10,
    monsters: ['kobold', 'cave_spider', 'rock_golem'],
    miniBossFloors: { 3: 'rock_golem', 6: 'chimera' },
    finalBoss: 'mine_golem',
    clearReward: { gold: 5000, item: 'mithril_axe', xp: 3000 },
    desc: '고대 드워프가 만든 미로. 깊은 곳엔 대장군 골렘이 있다.',
  },
  cursed_tower: {
    name: '저주받은 탑', loc: 'ruined_cathedral', minLv: 25, floors: 12,
    monsters: ['zombie', 'skeleton', 'wraith'],
    miniBossFloors: { 3: 'wraith', 6: 'dark_knight', 9: 'lich_boss' },
    finalBoss: 'dark_priest_lord',
    clearReward: { gold: 12000, item: 'cursed_staff', xp: 8000 },
    desc: '망령들이 울부짖는 무너진 성당의 지하.',
  },
  demon_prison: {
    name: '자이펀 악마 감옥', loc: 'zaipun_dungeon', minLv: 35, floors: 15,
    monsters: ['imp', 'hellhound', 'demon'],
    miniBossFloors: { 5: 'demon', 10: 'chimera' },
    finalBoss: 'demon_lord',
    clearReward: { gold: 30000, item: 'demonblade_lord', xp: 25000 },
    desc: '왕국이 봉인한 악마들의 탑. 내려갈수록 어둠이 짙어진다.',
  },
  frost_spire: {
    name: '빙마의 첨탑', loc: 'ice_wastes', minLv: 50, floors: 20,
    monsters: ['ice_wolf', 'frost_giant', 'white_wyrmling'],
    miniBossFloors: { 5: 'frost_giant', 10: 'white_wyrmling', 15: 'wyvern' },
    finalBoss: 'frost_dragon',
    clearReward: { gold: 80000, item: 'ice_lance_legendary', xp: 80000 },
    desc: '얼음으로 이뤄진 탑. 정상엔 프로스트 드래곤이 잠든다.',
  },
  god_trial: {
    name: '신의 시련', loc: 'polaris_shrine', minLv: 120, floors: 50,
    monsters: ['wyvern', 'demon', 'frost_giant', 'hellhound'],
    miniBossFloors: { 10: 'dark_knight', 20: 'demon_lord', 30: 'frost_dragon', 40: 'pendragon' },
    finalBoss: 'polaris',
    clearReward: { gold: 500000, item: 'heart_of_polaris', xp: 1000000 },
    desc: '신룡이 시험하는 50층 미궁. 끝엔 폴라리스.',
  },
};

// ═══════════ 일일 도전 ═══════════
// 매일(게임 내 Day 기준) 리셋. 3개 중 원하는 거 도전.
// 완료 시 보상 수령. 7일 연속 완료 시 큰 보너스.
const DAILY_TEMPLATES = [
  { id: 'kill', name: '사냥꾼', descF: n => `몬스터 ${n}마리 처치`, target: { kill: 15 }, reward: { gold: 800, xp: 1500 } },
  { id: 'kill_much', name: '학살자', descF: n => `몬스터 ${n}마리 처치`, target: { kill: 40 }, reward: { gold: 2000, xp: 5000 } },
  { id: 'explore', name: '탐험가', descF: n => `${n}번 탐험`, target: { explore: 20 }, reward: { gold: 600, xp: 1000 } },
  { id: 'spend', name: '소비왕', descF: n => `${n}G 소비`, target: { spend: 3000 }, reward: { gold: 500, xp: 2000 } },
  { id: 'train', name: '수련생', descF: n => `수련장에서 ${n}분 수련`, target: { train_min: 30 }, reward: { gold: 1000, xp: 3000 } },
  { id: 'trade_profit', name: '무역상', descF: n => `무역으로 ${n}G 이익`, target: { trade_profit: 500 }, reward: { gold: 1500, xp: 2000 } },
  { id: 'travel', name: '여행자', descF: n => `${n}번 이동`, target: { travel: 5 }, reward: { gold: 400, xp: 800 } },
  { id: 'boss', name: '보스헌터', descF: n => `보스 ${n}마리 처치`, target: { boss: 1 }, reward: { gold: 5000, xp: 10000, item: 'elixir' } },
];

// ═══════════ 수련 스킬 (누적 수련 시간으로 해금) ═══════════
// type: 'passive' = 영구 효과 / 'active' = 전투 스킬
// reqMin: 누적 수련 시간(분) 충족 시 습득
const TRAIN_SKILLS = [
  // ─ 초반 passive ─
  { id: 'tr_iron_body',    name: '강철의 몸',   reqMin: 30,   type: 'passive', effect: { hpBonus: 0.10 },    desc: 'HP 최대치 +10%.' },
  { id: 'tr_focused_mind', name: '집중된 정신', reqMin: 60,   type: 'passive', effect: { mpBonus: 0.15 },    desc: 'MP 최대치 +15%.' },
  { id: 'tr_swift',        name: '민첩 수련',   reqMin: 120,  type: 'passive', effect: { evaBonus: 0.05 },   desc: '회피 +5%.' },

  // ─ 중반 active & passive ─
  { id: 'tr_chi_burst',    name: '기공 폭발',   reqMin: 180,  type: 'active',
    skill: { id: 'tr_chi_burst', name: '기공 폭발', lv: 1, mp: 30, power: 2.8, type: 'mag_aoe', desc: '수련의 기를 폭발시킨다.' },
    desc: '전투 스킬: 광역 마법 공격 (MP 30).' },
  { id: 'tr_inner_peace',  name: '내면의 평화', reqMin: 300,  type: 'passive', effect: { hpRegenT: 0.03, mpRegenT: 3 }, desc: '매턴 HP 3%, MP 3 회복.' },
  { id: 'tr_fury_punch',   name: '분노의 주먹', reqMin: 480,  type: 'active',
    skill: { id: 'tr_fury_punch', name: '분노의 주먹', lv: 1, mp: 40, power: 3.5, type: 'phys', effect: 'crit_plus', desc: '수련의 분노를 담은 일격.' },
    desc: '전투 스킬: 치명 확률 증가 강타 (MP 40).' },
  { id: 'tr_battle_sense', name: '전투 직감',   reqMin: 600,  type: 'passive', effect: { critBonus: 0.08 }, desc: '치명타 확률 +8%.' },

  // ─ 후반 ─
  { id: 'tr_mindseye',     name: '심안',       reqMin: 900,  type: 'active',
    skill: { id: 'tr_mindseye', name: '심안', lv: 1, mp: 50, type: 'buff', effect: 'lock_on', turns: 3, desc: '3턴간 확정 치명타.' },
    desc: '전투 스킬: 3턴 확정 치명 (MP 50).' },
  { id: 'tr_awakening',    name: '깨달음',     reqMin: 1200, type: 'passive', effect: { expMul: 1.15, goldMul: 1.15 }, desc: 'EXP·골드 +15%.' },
  { id: 'tr_unity',        name: '초식 일체',   reqMin: 2400, type: 'active',
    skill: { id: 'tr_unity', name: '초식 일체', lv: 1, mp: 80, type: 'utility', effect: 'extra_turn', desc: '추가 턴 획득.' },
    desc: '전투 스킬: 추가 턴 (MP 80).' },
  { id: 'tr_transcend',    name: '초월',       reqMin: 4800, type: 'passive', effect: { dmgReduce: 0.10, critBonus: 0.05 }, desc: '피해 -10%, 치명 +5%.' },
  { id: 'tr_ascension',    name: '승화',       reqMin: 9999, type: 'passive', effect: { allStat: 10 }, desc: '누적 수련 약 166시간. 전 스탯 +10.' },
];

// 수련 중 랜덤 이벤트
// 확률은 낮지만 뜨면 크게 — 희소 × 고보상 원칙.
// 실제 보너스 = baseXp × 0.05 × bonus (기본 공식 유지, bonus 값만 상향)
const TRAIN_EVENTS = [
  { chance: 0.035, text: '✦ 깨달음의 순간! 무언가 툭 하고 맞아떨어진다...', bonus: 3.0 },
  { chance: 0.022, text: '💡 섬광처럼 스치는 통찰.',                            bonus: 2.5 },
  { chance: 0.015, text: '❄ 호흡이 고요해진다. 내면이 맑아진다.',               bonus: 2.0 },
  { chance: 0.013, text: '🔥 몸이 가벼워진다. 한계를 넘어서는 기분.',             bonus: 4.0 },
  { chance: 0.008, text: '⚡ 검기가 일어난다. 이 순간만큼은 최고의 자신이 된다.',   bonus: 6.0 },
  { chance: 0.003, text: '🌟 대각성! 우주의 진리를 엿본다...',                   bonus: 15.0 },
  { chance: 0.001, text: '🌌 초월! 일순간 신이 된 감각. 세계가 멈춘다.',          bonus: 30.0 },
];

// ═══════════ 깨달음 시련 (Awakening Trial) ═══════════
// 전직 시 단순 골드 지불이 아닌, 깨달음 시련을 통과해야 한다.
// 각 시련은 [명상→시련의 전투→깨달음 확인]의 3단계.
// trial 명령으로 시작. 도중 사망/실패 시 다시 도전 가능.
//
// 구조:
//   meditation: 3개 선택지 - 직업 정신과 맞는 것을 골라야 통과
//                옳은 선택은 'correct' 인덱스
//   battle: 시련의 적 (강화된 몬스터)
//   awakening: 통과 시 보여줄 깨달음 메시지
const AWAKENINGS = {
  // ═════ 2차 전직 시련 ═════
  knight: {
    name: '명예의 시련',
    intro: '기사단장 리프크네가 그대를 시험한다.\n"기사란 검을 휘두르는 자가 아니라, 무엇을 지키는지 아는 자다."',
    meditation: {
      q: '"네 검은 누구를 위한 것인가?"',
      options: [
        '강한 자가 약한 자를 짓밟지 못하게 하기 위해',
        '내 명예와 영광을 드높이기 위해',
        '왕국에 봉사하기 위해',
      ],
      correct: 0,
      hints: ['약자를 보호하는 것이 기사도의 첫번째 덕목이다.', '명예는 따라오는 것일 뿐.', '왕국도 결국 백성을 위해 존재한다.'],
    },
    battle: { foes: ['dark_knight'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '검에서 빛이 흘러나온다. "그래... 이 검은 약자를 위해 휘두르는 것이다."\n그대는 진정한 기사가 되었다.',
  },
  gladiator: {
    name: '투기장의 시련',
    intro: '투기장의 모래 위. 군중의 함성이 그대를 둘러싼다.\n"무기를 들고 죽이거나, 죽거나."',
    meditation: {
      q: '"왜 싸우는가?"',
      options: [
        '내가 살아있음을 증명하기 위해',
        '돈과 명예를 위해',
        '죽이지 않으면 죽으니까',
      ],
      correct: 0,
      hints: ['검투사는 매 순간 죽음 옆에 선다 — 그래서 살아있음을 안다.', '얕다.', '아직 깨닫지 못했다.'],
    },
    battle: { foes: ['orc', 'orc', 'troll'], buff: { hp: 1.2, atk: 1.0 } },
    awakening: '심장이 뛴다. 모래에 흩날리는 핏자국 위에서, 그대는 진정 살아있다.\n검투사의 길을 걷게 되었다.',
  },
  elementalist: {
    name: '4원소의 시련',
    intro: '핸드레이크가 4개의 정수를 그대 앞에 놓는다.\n"불, 물, 바람, 흙. 어느 것이 가장 강한가?"',
    meditation: {
      q: '"어느 원소를 택하겠는가?"',
      options: [
        '불 — 가장 파괴적이다',
        '어느 하나만 선택할 수 없다. 4원소는 균형이다',
        '물 — 모든 것을 흐르게 한다',
      ],
      correct: 1,
      hints: ['파괴는 일면일 뿐.', '균형이야말로 원소술의 본질이다.', '한 면만 본다.'],
    },
    battle: { foes: ['fire_elemental'], buff: { hp: 0.7, atk: 1.0 } },
    awakening: '4가지 원소가 그대 손에 모인다. 균형 속에서 진정한 힘이 깨어난다.',
  },
  necromancer: {
    name: '죽음과의 대화',
    intro: '모르간이 그대를 폐허로 데려간다.\n"죽음을 두려워하는 자는 강령술을 다룰 수 없다."',
    meditation: {
      q: '"죽음이란 무엇인가?"',
      options: [
        '두려운 종말',
        '또다른 형태의 존재',
        '잊혀짐',
      ],
      correct: 1,
      hints: ['두려움은 통제하지 못한다.', '죽음은 끝이 아니라 변형이다.', '존재는 사라지지 않는다.'],
    },
    battle: { foes: ['skeleton', 'skeleton', 'wraith'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '망령들이 그대 앞에 무릎 꿇는다. 죽음이 그대를 받아들였다.',
  },
  paladin: {
    name: '빛의 맹세',
    intro: '대주교 유스티스가 그대 앞에 성수를 내려놓는다.\n"빛은 검과 함께 들어야 가치가 있다."',
    meditation: {
      q: '"악과 마주쳤을 때, 그대는?"',
      options: [
        '검을 들고 베어낸다',
        '먼저 정화의 기도를 올린다',
        '검을 들되, 마음에 자비를 둔다',
      ],
      correct: 2,
      hints: ['폭력만이 답은 아니다.', '기도만으로 충분치 않다.', '강함과 자비의 균형. 그것이 성기사다.'],
    },
    battle: { foes: ['demon'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '검에 신성한 빛이 깃든다. 그대는 빛의 검사가 되었다.',
  },
  bishop: {
    name: '봉사의 시련',
    intro: '"100명의 영혼을 어루만져야 하나의 기적을 부를 수 있다."',
    meditation: {
      q: '"가장 큰 치유란?"',
      options: [
        '상처의 치료',
        '죽은 자의 부활',
        '마음의 회복',
      ],
      correct: 2,
      hints: ['몸은 다시 다친다.', '죽음을 거스를 수 없다.', '마음의 상처가 가장 깊다.'],
    },
    battle: { foes: ['wraith', 'wraith'], buff: { hp: 0.6, atk: 1.0 } },
    awakening: '치유의 빛이 그대 손에서 흘러넘친다. 모든 상처를 어루만질 수 있게 되었다.',
  },
  assassin: {
    name: '그림자의 계약',
    intro: '암살자 길드장이 단검을 그대 손에 쥐여준다.\n"그림자는 망설이지 않는다."',
    meditation: {
      q: '"표적과 마주쳤다. 그대는?"',
      options: [
        '발각되기 전에 일격에 끝낸다',
        '결투를 신청한다',
        '도망친다',
      ],
      correct: 0,
      hints: ['망설임은 죽음이다.', '결투는 암살이 아니다.', '암살자는 도망치지 않는다 — 사라질 뿐.'],
    },
    battle: { foes: ['rogue_mage', 'thug'], buff: { hp: 0.7, atk: 1.0 } },
    awakening: '그림자가 그대를 받아들였다. 발소리도 없이 죽음을 가져오는 자가 되었다.',
  },
  outlaw: {
    name: '자유의 길',
    intro: '메이린이 술잔을 건넨다.\n"법도 권력도, 너를 묶을 수 있을까?"',
    meditation: {
      q: '"무엇이 너를 자유롭게 하는가?"',
      options: [
        '돈',
        '아무것도 두려워하지 않는 마음',
        '강한 무력',
      ],
      correct: 1,
      hints: ['돈은 또다른 사슬.', '두려움이 없을 때 진정 자유롭다.', '힘은 자유의 도구일 뿐 자유 자체가 아니다.'],
    },
    battle: { foes: ['bandit', 'bandit', 'thug'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '바람처럼 자유로워졌다. 가도의 협객이 그대를 받아들인다.',
  },
  sniper: {
    name: '천 걸음의 시련',
    intro: '이무스가 활을 건넨다.\n"천 걸음 너머의 사과를 맞추어라. 화살은 단 하나."',
    meditation: {
      q: '"활을 쏠 때 가장 중요한 것은?"',
      options: [
        '강한 팔',
        '바람을 읽는 눈',
        '쏘는 순간의 침묵 — 호흡과 심장박동까지',
      ],
      correct: 2,
      hints: ['팔은 도구일 뿐.', '눈은 필요하나 충분치 않다.', '저격은 곧 명상이다. 자아조차 잊을 때 화살이 표적을 찾는다.'],
    },
    battle: { foes: ['arcane_construct'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '화살이 정확히 사과를 가른다. 천 걸음 밖이라도 그대의 화살은 빗나가지 않는다.',
  },
  tracker: {
    name: '자연의 부름',
    intro: '카일란이 숲으로 그대를 인도한다.\n"숲의 소리를 들어라. 그것이 너에게 길을 알려줄 것이다."',
    meditation: {
      q: '"사냥의 본질은?"',
      options: [
        '죽임',
        '추적과 이해',
        '생존',
      ],
      correct: 1,
      hints: ['사냥은 살육이 아니다.', '진정한 사냥꾼은 표적이 되기 전에 표적을 안다.', '생존만이 목적이라면 그저 짐승.'],
    },
    battle: { foes: ['plain_wolf', 'wild_orc'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '숲의 소리가 들린다. 모든 짐승의 발자국이 그대 앞에 펼쳐진다.',
  },

  // ═════ 종족 전용 2차 전직 시련 ═════
  hero_lord: {
    name: '영웅왕의 시련',
    intro: '국왕 다케온이 그대를 왕좌 앞에 부른다.\n"인간이 전설이 되는 것은 힘이 아니라 책임으로다."',
    meditation: {
      q: '"영웅이란 무엇인가?"',
      options: [
        '가장 강한 자',
        '남을 위해 자신을 바치는 자',
        '누구도 이기지 못하는 자',
      ],
      correct: 1,
      hints: ['힘만으로 전설이 되지 않는다.', '희생이 영웅을 만든다.', '불패는 영웅의 징표가 아니다.'],
    },
    battle: { foes: ['bone_knight', 'bone_knight'], buff: { hp: 1.1, atk: 1.1 } },
    awakening: '왕관의 빛이 그대 머리 위에 떠오른다. 그대는 인간의 영웅왕이 되었다.',
  },
  archspirit: {
    name: '정령의 왕관',
    intro: '장로 엘리안이 4대 정령을 불러낸다.\n"정령과 하나가 되어라. 그러나 스스로를 잃지 말아라."',
    meditation: {
      q: '"정령과의 교감이란?"',
      options: [
        '정령에게 명령한다',
        '정령의 뜻을 따른다',
        '서로의 존재를 나눈다',
      ],
      correct: 2,
      hints: ['지배는 교감이 아니다.', '복종도 아니다.', '정령과 대정령술사는 동료다.'],
    },
    battle: { foes: ['fire_elemental', 'forest_sprite'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '4대 정령이 그대 앞에 무릎 꿇는다. 그대는 대정령술사가 되었다.',
  },
  runeblade: {
    name: '룬과 검의 결합',
    intro: '대장장이 마스터 흐랄이 오래된 룬 검을 건넨다.\n"룬은 지식이요, 검은 의지다. 둘은 하나여야 한다."',
    meditation: {
      q: '"룬과 검, 무엇이 먼저인가?"',
      options: [
        '룬 — 지식 없이 검은 도구일 뿐',
        '검 — 행함 없이 지식은 무의미',
        '어느 것도 아니다. 둘이 한 호흡에 울려야 한다',
      ],
      correct: 2,
      hints: ['지식만으론 부족하다.', '행함만으로도 부족하다.', '룬과 검이 동시에 울릴 때 룬블레이드가 된다.'],
    },
    battle: { foes: ['rock_golem', 'crystal_golem'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '검에 새긴 룬이 빛난다. 그대는 드워프의 룬블레이드가 되었다.',
  },
  titan_king: {
    name: '거신의 왕좌',
    intro: '헬턴트 촌장이 그대의 등을 두드린다.\n"거신은 산처럼 서야 한다. 바람에 흔들리지 않는 자만이 왕이 된다."',
    meditation: {
      q: '"거신의 힘은 어디서 오는가?"',
      options: [
        '거대한 육체',
        '원시의 분노',
        '대지에 뿌리내린 중심',
      ],
      correct: 2,
      hints: ['몸은 그릇일 뿐.', '분노는 도구일 뿐.', '흔들리지 않는 중심이 진정한 힘이다.'],
    },
    battle: { foes: ['troll', 'mountain_orc'], buff: { hp: 1.2, atk: 1.1 } },
    awakening: '발 밑 대지가 그대를 인정한다. 그대는 오거의 거신왕이 되었다.',
  },
  grand_bard: {
    name: '전설의 선율',
    intro: '장로 엘리안이 하프엘프 이루릴의 낡은 류트를 건넨다.\n"노래는 칼보다 깊은 상처를, 약보다 넓은 치유를 만든다."',
    meditation: {
      q: '"시인의 가장 큰 무기는?"',
      options: [
        '아름다운 선율',
        '날카로운 풍자',
        '사람의 마음을 움직이는 이야기',
      ],
      correct: 2,
      hints: ['선율은 겉일 뿐.', '풍자는 한 색깔일 뿐.', '이야기는 영혼을 바꾼다.'],
    },
    battle: { foes: ['dark_monk', 'cursed_nun'], buff: { hp: 0.9, atk: 1.0 } },
    awakening: '이루릴의 선율이 그대 손에서 흘러나온다. 그대는 대음유시인이 되었다.',
  },

  // ═════ 3차 전직 시련 (간단 버전) ═════
  crusader:    { name: '성전의 맹세', intro: '"성전이란 신을 위한 것인가, 백성을 위한 것인가?"',
    meditation: { q: '"성전의 의미?"', options: ['신의 영광', '약자의 보호', '죄의 정화'], correct: 1, hints: ['', '', ''] },
    battle: { foes: ['demon', 'demon'], buff: { hp: 1.0, atk: 1.2 } },
    awakening: '성전의 횃불이 그대 손에 들린다.' },
  dragoon: { name: '용기병의 약속', intro: '와이번 한 마리가 그대 앞에 내려앉는다.',
    meditation: { q: '"용을 어떻게 다루는가?"', options: ['힘으로 굴복시킨다', '마음을 나눈다', '두려움으로'], correct: 1, hints: [] },
    battle: { foes: ['white_wyrmling'], buff: { hp: 1.0, atk: 1.2 } },
    awakening: '와이번이 그대를 인정한다. 함께 하늘을 날 동반자가 되었다.' },
  berserker: { name: '광기의 시련', intro: '광전사의 광기를 넘어선다.',
    meditation: { q: '"광기란?"', options: ['통제 상실', '내면 깊은 불꽃을 풀어놓는 것', '폭력'], correct: 1, hints: [] },
    battle: { foes: ['troll', 'troll'], buff: { hp: 1.5, atk: 1.5 } },
    awakening: '내면의 불꽃이 폭발한다. 두려움을 모르는 자가 되었다.' },
  monk: { name: '심연의 명상', intro: '7일간의 단식. 마음을 비워라.',
    meditation: { q: '"무도의 정점?"', options: ['천 번의 주먹', '단 한 번의 주먹', '주먹이 필요 없는 경지'], correct: 2, hints: [] },
    battle: { foes: ['salamander'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '주먹과 마음이 하나가 된다.' },
  archmage: { name: '비전의 봉인 해제', intro: '핸드레이크가 비전서 한 권을 건넨다.',
    meditation: { q: '"마법의 원천?"', options: ['지식', '의지', '균형'], correct: 1, hints: [] },
    battle: { foes: ['lich_boss'], buff: { hp: 0.7, atk: 1.0 } },
    awakening: '비전이 그대 안에서 깨어난다.' },
  sage: {
    name: '용의 지혜 시련',
    intro: '핸드레이크가 진중히 그대를 응시한다.\n"현자란 단순히 지혜로운 자가 아니다.\n드래곤과 대화할 수 있는 자만이 현자라 불린다."',
    requireItems: ['dragon_wisdom_1', 'dragon_wisdom_2', 'dragon_wisdom_3'],
    meditation: {
      q: '"드래곤의 본질이란 무엇인가?"',
      options: [
        '강함의 구현',
        '시간을 초월한 지혜',
        '오만한 파괴자',
      ],
      correct: 1,
      hints: ['강함은 결과일 뿐.', '드래곤은 천년을 살며 모든 것을 본다.', '편견이다.'],
    },
    battle: { foes: ['white_wyrmling', 'white_wyrmling'], buff: { hp: 1.0, atk: 1.2 } },
    awakening: '핸드레이크가 미소짓는다.\n"이제 자네는 용과 대화할 수 있다."\n그대는 현자가 되었다. 드래곤 라자의 길이 열린다.',
  },
  lich: { name: '불멸의 의식', intro: '영혼을 성물에 봉인하라.',
    meditation: { q: '"불멸이란?"', options: ['축복', '저주', '책임'], correct: 2, hints: [] },
    battle: { foes: ['lich_boss'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '그대의 심장이 멈춘다. 그러나 의지는 영원하다.' },
  soulbinder: { name: '영혼의 결속', intro: '망자의 영혼을 받아들여라.',
    meditation: { q: '"영혼이란?"', options: ['지속되는 의식', '전기신호', '환상'], correct: 0, hints: [] },
    battle: { foes: ['wraith', 'wraith', 'wraith'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '죽은 자들의 목소리가 들린다.' },
  avatar: { name: '신의 그릇', intro: '신성을 그대 안에 받아들여라.',
    meditation: { q: '"신의 화신이 된다는 것은?"', options: ['신이 됨', '신의 도구가 됨', '신의 손길'], correct: 2, hints: [] },
    battle: { foes: ['demon_lord'], buff: { hp: 0.5, atk: 0.8 } },
    awakening: '신성한 빛이 그대를 감싼다.' },
  inquisitor: { name: '심판자의 시련', intro: '이단을 분별하라.',
    meditation: { q: '"심판의 기준?"', options: ['교리', '양심', '결과'], correct: 1, hints: [] },
    battle: { foes: ['rogue_mage', 'rogue_mage', 'rogue_mage'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '심판의 횃불이 들린다.' },
  archbishop: { name: '기적의 시련', intro: '한 영혼을 죽음에서 되돌려라.',
    meditation: { q: '"기적이란?"', options: ['신의 직접 개입', '믿음의 결과', '확률'], correct: 1, hints: [] },
    battle: { foes: ['wraith', 'wraith'], buff: { hp: 0.5, atk: 0.7 } },
    awakening: '진정한 기적은 그대 안에서 솟아난다.' },
  warpriest: { name: '검과 기도', intro: '검과 기도가 하나가 되라.',
    meditation: { q: '"무엇이 더 강한가?"', options: ['검', '기도', '둘이 하나가 될 때'], correct: 2, hints: [] },
    battle: { foes: ['demon'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '검 끝에 신성이 깃든다.' },
  shadow: { name: '어둠의 결혼', intro: '그림자와 하나가 되라.',
    meditation: { q: '"그림자에 사는 자의 이름은?"', options: ['암살자', '없음', '죽은 자'], correct: 1, hints: [] },
    battle: { foes: ['demon'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '그대의 이름이 사라진다. 그대는 그림자 그 자체가 되었다.' },
  nightblade: { name: '달빛의 검무', intro: '달빛 아래 100번 검을 휘둘러라.',
    meditation: { q: '"검무의 끝?"', options: ['적의 죽음', '검과의 일체', '아름다움'], correct: 1, hints: [] },
    battle: { foes: ['demon', 'imp'], buff: { hp: 0.9, atk: 1.0 } },
    awakening: '검이 달빛처럼 흐른다.' },
  swashbuckler: { name: '결투자의 길', intro: '결투에서 패배한 적이 없는 자만 풍운아가 된다.',
    meditation: { q: '"결투의 본질?"', options: ['이김', '예의', '존엄을 건 대화'], correct: 2, hints: [] },
    battle: { foes: ['darim_warrior'], buff: { hp: 1.0, atk: 1.2 } },
    awakening: '결투의 신이 그대를 인정한다.' },
  adventurer: { name: '방랑의 시작', intro: '한 곳에 머무르지 않는 자가 되어라.',
    meditation: { q: '"왜 떠도는가?"', options: ['보물', '명성', '세상 그 자체'], correct: 2, hints: [] },
    battle: { foes: ['darim_warrior', 'sand_lizard'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '바람이 그대 친구가 된다.' },
  dragonslayer: { name: '용살자의 맹세', intro: '용을 사냥하기 위해 태어난 자.',
    meditation: { q: '"용을 사냥하는 이유?"', options: ['전리품', '명예', '균형의 회복'], correct: 2, hints: [] },
    battle: { foes: ['white_wyrmling'], buff: { hp: 1.0, atk: 1.2 } },
    awakening: '활시위에 용을 죽일 의지가 깃든다.' },
  magicshot: { name: '마탄의 의식', intro: '활과 마법이 하나가 되라.',
    meditation: { q: '"마탄의 사수란?"', options: ['이중 클래스', '활에 마법을 담는 자', '마법사 궁수'], correct: 1, hints: [] },
    battle: { foes: ['arcane_construct', 'arcane_construct'], buff: { hp: 0.9, atk: 1.0 } },
    awakening: '화살이 마법으로 빛난다.' },
  druid: { name: '자연의 일원', intro: '동물과 식물의 언어를 배워라.',
    meditation: { q: '"드루이드란?"', options: ['자연 마법사', '자연의 일부가 된 자', '숲의 주인'], correct: 1, hints: [] },
    battle: { foes: ['cave_spider', 'cave_spider'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '나무가 그대에게 인사한다.' },
  rangerking: { name: '숲의 왕관', intro: '숲의 모든 짐승이 그대를 따라야 한다.',
    meditation: { q: '"왕이란?"', options: ['지배', '책임', '봉사'], correct: 2, hints: [] },
    battle: { foes: ['wild_orc', 'plain_wolf', 'plain_wolf'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '짐승들이 그대 앞에 무릎 꿇는다.' },

  // ─── 상인 계열 시련 ───
  trader: {
    name: '대륙 횡단의 시련',
    intro: '자히드: "거상이란 단순히 비싸게 파는 자가 아니다.\n흐름을 읽는 자다."',
    meditation: {
      q: '"무역의 본질은?"',
      options: [
        '싸게 사고 비싸게 판다',
        '정보의 비대칭을 이용한다',
        '필요한 자에게 필요한 것을 가져다 준다',
      ],
      correct: 2,
      hints: ['1차원적인 답.', '한 면.', '진정한 무역상은 세상을 잇는 자다.'],
    },
    battle: { foes: ['bandit', 'bandit', 'thug'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '대륙의 길이 그대 머릿속에 펼쳐진다. 거상의 길이 열렸다.',
  },
  informer: {
    name: '비밀의 거래',
    intro: '자히드: "정보상은 칼보다 위험하다.\n사람의 약점을 사고파는 자다."',
    meditation: {
      q: '"가장 비싼 정보는?"',
      options: [
        '왕의 비밀',
        '미래에 대한 예측',
        '사람들이 진정 두려워하는 것',
      ],
      correct: 2,
      hints: ['이미 흘렀다.', '확실하지 않다.', '두려움은 영원하다 — 그것을 알면 그를 지배한다.'],
    },
    battle: { foes: ['rogue_mage', 'wraith'], buff: { hp: 0.9, atk: 1.0 } },
    awakening: '사람들의 비밀이 그대에게 들린다. 정보상의 길.',
  },
  guildmaster: {
    name: '길드의 왕좌',
    intro: '"천 명의 상인이 그대를 따른다. 그들의 무게를 견딜 수 있는가?"',
    meditation: {
      q: '"길드마스터의 책임은?"',
      options: ['이윤 극대화', '구성원의 안위', '대륙 경제의 균형'],
      correct: 1,
      hints: ['일면.', '리더의 본분.', '너무 거시적이다.'],
    },
    battle: { foes: ['demon', 'demon'], buff: { hp: 1.0, atk: 1.2 } },
    awakening: '천 명의 상인이 그대 깃발 아래 모인다.',
  },
  goldking: {
    name: '미다스의 시련',
    intro: '"황금에 손대는 모든 것이 변한다 — 무엇을 변하게 할 것인가?"',
    meditation: {
      q: '"무한한 부를 얻으면?"',
      options: ['세계를 산다', '모두에게 나눈다', '의미를 잃는다'],
      correct: 0,
      hints: ['황금왕은 지배자다.', '나누면 황금왕이 아니다.', '실패자의 답.'],
    },
    battle: { foes: ['demon_lord'], buff: { hp: 0.6, atk: 0.8 } },
    awakening: '그대의 손길에 황금이 흐른다. 황금왕이 되었다.',
  },
  shadowmerchant: {
    name: '암시장의 계약',
    intro: '"그림자에서만 거래되는 것이 있다. 영혼, 비밀, 그리고 죽음."',
    meditation: {
      q: '"가장 비싼 거래 품목?"',
      options: ['황금', '권력', '비밀'],
      correct: 2,
      hints: ['일반 시장에 있다.', '비밀에 비하면 가볍다.', '비밀을 가진 자가 모든 것을 가진다.'],
    },
    battle: { foes: ['demon', 'wraith'], buff: { hp: 0.9, atk: 1.0 } },
    awakening: '암시장의 군주가 되었다. 어디서든 거래를 열 수 있다.',
  },
  informerking: {
    name: '진실의 왕좌',
    intro: '핸드레이크: "그대는 왕도 두려워하는 자가 될 것이다.\n진실은 무서운 것이니까."',
    meditation: {
      q: '"진실이란?"',
      options: ['사실', '권력의 도구', '본질에 대한 통찰'],
      correct: 2,
      hints: ['표면.', '용도.', '정보왕은 본질을 본다.'],
    },
    battle: { foes: ['lich_boss'], buff: { hp: 0.7, atk: 1.0 } },
    awakening: '대륙의 모든 비밀이 그대에게 흘러든다. 정보왕이 되었다.',
  },

  // ═════ 종족 전용 3차 전직 시련 ═════
  hero_god: { name: '영웅신의 길', intro: '국왕 다케온: "영웅에서 신이 되는 길. 그것은 자신조차 초월하는 것이다."',
    meditation: { q: '"신이 된다는 것?"', options: ['초월한 존재', '섬김의 끝', '불멸의 존재'], correct: 1, hints: ['초월은 이름일 뿐.', '섬기는 자만이 신에 닿는다.', '불멸은 결과일 뿐.'] },
    battle: { foes: ['demon_lord'], buff: { hp: 1.0, atk: 1.2 } },
    awakening: '그대의 이름이 전설이 되어 빛난다.' },
  elemental_sage: { name: '정령의 현자', intro: '장로 엘리안이 태고의 정령석을 건넨다.',
    meditation: { q: '"정령이란 결국?"', options: ['자연의 의식', '세계의 조각', '시간의 흐름'], correct: 1, hints: [] },
    battle: { foes: ['magi_golem'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '4원소가 그대 몸에서 춤춘다. 정령의 현자가 되었다.' },
  rune_dragon: { name: '룬드래곤의 각인', intro: '대장장이 마스터 흐랄이 드래곤 비늘의 룬을 꺼낸다.',
    meditation: { q: '"룬의 궁극?"', options: ['세계의 이름', '자신의 이름', '하나로 된 언어'], correct: 2, hints: [] },
    battle: { foes: ['elder_drake'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '그대의 룬이 드래곤의 심장과 공명한다.' },
  titan_god: { name: '거신의 화신', intro: '촌장: "거신왕을 넘어 거신 그 자체가 되어라."',
    meditation: { q: '"거신의 끝?"', options: ['거대함', '대지 그 자체가 됨', '불멸'], correct: 1, hints: [] },
    battle: { foes: ['magma_giant', 'frost_giant'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '대지가 그대를 끌어안는다.' },
  fate_bard: { name: '운명의 노래', intro: '장로 엘리안: "운명을 노래하라. 그러면 운명이 바뀐다."',
    meditation: { q: '"운명이란?"', options: ['정해진 것', '선택의 연쇄', '노래로 뒤바뀌는 것'], correct: 2, hints: [] },
    battle: { foes: ['fanatic', 'cursed_wizard'], buff: { hp: 0.9, atk: 1.0 } },
    awakening: '그대의 선율이 운명의 실을 바꾼다.' },

  // ═════════ 4차 전직 시련 ═════════
  dragon_emperor: { name: '용제의 시련', intro: '용의 기를 받아들여라.',
    meditation: { q: '"용제란?"', options: ['용을 부리는 자', '용과 형제된 자', '용이 된 자'], correct: 1, hints: [] },
    battle: { foes: ['white_wyrmling', 'white_wyrmling'], buff: { hp: 1.5, atk: 1.3 } },
    awakening: '용의 피가 그대에게 흐른다. 용제가 되었다.' },
  sword_god: { name: '검신의 길', intro: '천 번의 결투 끝. 검과 혼이 하나가 되라.',
    meditation: { q: '"검이란?"', options: ['의지의 형상', '죽음의 도구', '예술'], correct: 0, hints: [] },
    battle: { foes: ['abyssal_knight'], buff: { hp: 1.0, atk: 1.2 } },
    awakening: '모든 검이 그대를 따른다. 검신이 되었다.' },
  great_sage: { name: '대현자의 깨달음', intro: '세계의 모든 지식을 탐했다.',
    meditation: { q: '"지식의 끝?"', options: ['모든 답', '새로운 질문', '침묵'], correct: 1, hints: [] },
    battle: { foes: ['lich_boss', 'mage_guardian'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '세계가 그대의 책이 된다. 대현자가 되었다.' },
  death_god: { name: '죽음의 신', intro: '모든 영혼의 지배자가 되라.',
    meditation: { q: '"죽음을 다스린다는 것?"', options: ['죽음을 거스름', '죽음과 동행', '죽음을 이해'], correct: 1, hints: [] },
    battle: { foes: ['tomb_king'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '망자들이 그대를 왕으로 섬긴다.' },
  holy_king: { name: '성왕의 맹세', intro: '신성을 왕관에 새긴다.',
    meditation: { q: '"성왕이란?"', options: ['신의 대리인', '신과 하나된 자', '신 자체'], correct: 1, hints: [] },
    battle: { foes: ['demon_overlord'], buff: { hp: 0.6, atk: 0.8 } },
    awakening: '신성한 왕관이 그대 머리 위에 떠오른다.' },
  saint: { name: '성인의 기적', intro: '만인을 구원하라.',
    meditation: { q: '"성인이란?"', options: ['완벽한 자', '사랑한 자', '용서받은 자'], correct: 1, hints: [] },
    battle: { foes: ['crimson_lord'], buff: { hp: 0.6, atk: 0.7 } },
    awakening: '빛이 그대에게서 끝없이 샘솟는다.' },
  shadow_emperor: { name: '어둠의 황제', intro: '모든 그림자를 다스린다.',
    meditation: { q: '"그림자란?"', options: ['빛의 반대', '빛이 있어 존재', '존재의 숨결'], correct: 1, hints: [] },
    battle: { foes: ['shadow_dragon'], buff: { hp: 0.6, atk: 0.8 } },
    awakening: '그림자가 그대의 왕국이 된다.' },
  freeman_king: { name: '자유의 왕', intro: '어떤 법도 어떤 권력도 너를 묶지 못한다.',
    meditation: { q: '"진정한 자유?"', options: ['구속 없음', '스스로를 선택', '누구도 아님'], correct: 1, hints: [] },
    battle: { foes: ['shadow_rogue', 'shadow_rogue'], buff: { hp: 0.9, atk: 1.0 } },
    awakening: '바람이 그대의 왕관이 된다.' },
  dragon_slayer_god: { name: '용살신의 길', intro: '용을 죽인 자들의 이름을 이어라.',
    meditation: { q: '"왜 용을 죽이는가?"', options: ['명성', '균형', '복수'], correct: 1, hints: [] },
    battle: { foes: ['void_dragon'], buff: { hp: 0.3, atk: 0.5 } },
    awakening: '용의 심장을 꿰뚫는 화살이 그대의 것.' },
  nature_king: { name: '자연의 왕', intro: '숲이 너를 왕으로 추대한다.',
    meditation: { q: '"자연을 다스린다는 것?"', options: ['지배', '수호', '일부가 됨'], correct: 2, hints: [] },
    battle: { foes: ['treant'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '나무와 짐승이 그대 앞에 길을 낸다.' },
  gold_god: { name: '금신의 계약', intro: '모든 금이 그대의 것이 될 것이다.',
    meditation: { q: '"진정한 부?"', options: ['금의 양', '흐름을 만드는 힘', '베푸는 여유'], correct: 1, hints: [] },
    battle: { foes: ['darim_warrior', 'darim_warrior', 'darim_warrior'], buff: { hp: 1.2, atk: 1.0 } },
    awakening: '금이 그대 주위를 돈다.' },
  info_god: { name: '정보의 신', intro: '모든 비밀이 너에게 흐른다.',
    meditation: { q: '"비밀의 가치?"', options: ['은폐', '타이밍', '연결'], correct: 2, hints: [] },
    battle: { foes: ['rogue_mage', 'rogue_mage', 'rogue_mage'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '세상의 모든 속삭임이 그대 귀에 닿는다.' },
  human_god: { name: '인간신의 등극', intro: '인간의 가능성 그 자체가 되어라.',
    meditation: { q: '"인간이 신이 되는 길?"', options: ['초월', '책임', '공감'], correct: 2, hints: [] },
    battle: { foes: ['pendragon'], buff: { hp: 0.5, atk: 0.7 } },
    awakening: '인간의 이름이 전설에 영원히 새겨진다.' },
  primordial_spirit: { name: '원초 정령의 강림', intro: '태초의 정령이 그대에게 깃든다.',
    meditation: { q: '"원초란?"', options: ['처음', '순수', '모든 것의 근원'], correct: 2, hints: [] },
    battle: { foes: ['magi_golem', 'magi_golem'], buff: { hp: 0.8, atk: 1.0 } },
    awakening: '네 원소 이전의 무엇이 그대 안에서 깨어난다.' },
  rune_emperor: { name: '룬황제의 각인', intro: '세계 자체에 룬을 새긴다.',
    meditation: { q: '"룬의 정점?"', options: ['기록', '창조', '지배'], correct: 1, hints: [] },
    battle: { foes: ['stone_sentinel', 'ancient_guard'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '그대의 룬이 세계를 다시 쓴다.' },
  primeval_titan: { name: '태고 거신의 부활', intro: '대지의 태초가 되어라.',
    meditation: { q: '"태고의 거신?"', options: ['가장 강한 거신', '대지 그 자체', '최초의 존재'], correct: 1, hints: [] },
    battle: { foes: ['magma_giant', 'magma_giant'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '산맥이 그대를 아버지라 부른다.' },
  fate_king: { name: '운명의 왕', intro: '운명의 실을 직접 짠다.',
    meditation: { q: '"운명이란?"', options: ['정해진 길', '선택의 총합', '노래하는 자의 이야기'], correct: 2, hints: [] },
    battle: { foes: ['moon_priestess'], buff: { hp: 0.6, atk: 0.8 } },
    awakening: '운명의 베틀이 그대 손에 들린다.' },

  // ═════════ 5차 신화 전직 시련 ═════════
  dragon_raja: {
    name: '드래곤 라자의 시련',
    intro: '핸드레이크가 오랜 세월을 담은 눈빛으로 그대를 바라본다.\n"드래곤 라자는 드래곤과 동등한 자.\n모든 길을 걸은 자만이 이 이름을 받는다."',
    meditation: {
      q: '"드래곤 라자란 누구인가?"',
      options: [
        '드래곤을 굴복시킨 자',
        '드래곤과 대등한 자',
        '드래곤의 수호자',
      ],
      correct: 1,
      hints: ['굴복은 교류가 아니다.', '드래곤 라자는 드래곤의 친구이자 평등한 자.', '수호는 한쪽에 서는 것일 뿐.'],
    },
    battle: { foes: ['bone_dragon'], buff: { hp: 1.0, atk: 1.0 } },
    awakening: '드래곤들이 그대에게 고개를 숙인다.\n그대는 드래곤 라자 — 용의 길의 끝에 닿았다.',
  },
};

// ═══════════ 조합 스킬 (직업 계열 시너지) ═══════════
// 두 계열을 모두 거친 적 있으면(state.jobs에 1차라도 포함) 사용 가능
const COMBO_SKILLS = [
  // 상인 × 음유시인 — 사용자 요청
  { lines: ['bard', 'merchant'],
    skill: { id: 'cb_merchant_song', name: '상인의 노래', lv: 1, mp: 35,
      type: 'buff', effect: 'gold_up', turns: 99,
      desc: '음유시인 + 상인: 거래·골드 +100% (영구).' } },
  // 전사 × 마법사 — 마검사
  { lines: ['warrior', 'mage'],
    skill: { id: 'cb_magic_blade', name: '마검격', lv: 1, mp: 30,
      type: 'phys', power: 2.5, effect: 'crit_plus',
      desc: '전사 + 마법사: 물리+마법 혼합 대검 강타.' } },
  // 사제 × 도적 — 심판자
  { lines: ['priest', 'thief'],
    skill: { id: 'cb_judgment', name: '그림자 심판', lv: 1, mp: 28,
      type: 'phys', power: 2.2, effect: 'holy',
      desc: '사제 + 도적: 신성 + 치명 일격.' } },
  // 궁사 × 마법사 — 마탄
  { lines: ['ranger', 'mage'],
    skill: { id: 'cb_magic_arrow', name: '마탄', lv: 1, mp: 32,
      type: 'mag', power: 2.8, effect: 'pierce_def',
      desc: '궁사 + 마법사: 마력 화살로 방어 관통.' } },
  // 전사 × 사제 — 성전사
  { lines: ['warrior', 'priest'],
    skill: { id: 'cb_holy_knight', name: '성전 돌격', lv: 1, mp: 35,
      type: 'phys', power: 2.6, effect: 'holy',
      desc: '전사 + 사제: 성스러운 돌격. 언데드 2배.' } },
  // 도적 × 음유시인 — 환상 공격
  { lines: ['thief', 'bard'],
    skill: { id: 'cb_illusion', name: '환상곡', lv: 1, mp: 38,
      type: 'mag_aoe', power: 1.8, effect: 'fear',
      desc: '도적 + 음유시인: 광역 공포.' } },
  // 상인 × 도적 — 밀수꾼
  { lines: ['merchant', 'thief'],
    skill: { id: 'cb_smuggler', name: '밀수꾼의 수작', lv: 1, mp: 25,
      type: 'phys', power: 2.0, effect: 'gold_drain',
      desc: '상인 + 도적: 적에게 골드를 빼앗는 일격.' } },
  // 마법사 × 음유시인 — 주문의 시
  { lines: ['mage', 'bard'],
    skill: { id: 'cb_spellsong', name: '주문의 시', lv: 1, mp: 40,
      type: 'mag_aoe', power: 2.4, effect: 'burn', turns: 3,
      desc: '마법사 + 음유시인: 증폭된 원소 송가.' } },
  // 사제 × 음유시인 — 축복의 찬가
  { lines: ['priest', 'bard'],
    skill: { id: 'cb_blessed_hymn', name: '축복의 찬가', lv: 1, mp: 30,
      type: 'heal', power: 3.2,
      desc: '사제 + 음유시인: 대량 치유 + 전투 내내 회복 +50%.' } },
  // 궁사 × 도적 — 암살자의 화살
  { lines: ['ranger', 'thief'],
    skill: { id: 'cb_assassin_shot', name: '암살 사격', lv: 1, mp: 35,
      type: 'phys', power: 3.0, effect: 'crit_100',
      desc: '궁사 + 도적: 확정 치명 저격.' } },
  // 전사 × 도적 — 광풍
  { lines: ['warrior', 'thief'],
    skill: { id: 'cb_blade_storm', name: '검풍', lv: 1, mp: 32,
      type: 'phys_aoe', power: 1.8, hits: 2,
      desc: '전사 + 도적: 2회 광역 베기.' } },
  // 마법사 × 사제 — 연금술사
  { lines: ['mage', 'priest'],
    skill: { id: 'cb_alchemy', name: '치유의 연금', lv: 1, mp: 28,
      type: 'heal', power: 2.5, effect: 'dispel',
      desc: '마법사 + 사제: 대량 치유 + 모든 디버프 제거.' } },
  // 종족 전용 조합 (종족 직업이 있을 때)
  { lines: ['spiritcaller', 'bard'],
    skill: { id: 'cb_spirit_song', name: '정령의 노래', lv: 1, mp: 45,
      type: 'mag_aoe', power: 3.2, effect: 'all_up', turns: 3,
      desc: '엘프 전용: 정령과 하모니.' } },
  { lines: ['runemaster', 'warrior'],
    skill: { id: 'cb_rune_slash', name: '룬 베기', lv: 1, mp: 30,
      type: 'phys', power: 2.8, effect: 'pierce_def',
      desc: '드워프 룬마스터 + 전사: 관통 룬 일격.' } },
  { lines: ['titan', 'warrior'],
    skill: { id: 'cb_titan_strike', name: '거신의 주먹', lv: 1, mp: 35,
      type: 'phys_aoe', power: 2.5, effect: 'stun', turns: 1,
      desc: '오우거 거신투사 + 전사: 광역 기절.' } },
  { lines: ['hero', 'priest'],
    skill: { id: 'cb_hero_aura', name: '영웅의 가호', lv: 1, mp: 40,
      type: 'buff', effect: 'all_up_big', turns: 4,
      desc: '인간 영웅 + 사제: 전 능력 +50%.' } },
];

// ═══════════ 지역 테마 (UI 포인트 컬러) ═══════════
// 은은하게 — 위장 목적 유지 위해 채도 낮춤
// accent: 라벨/테두리 포인트 컬러
// tint: 출력 배경 상단에 살짝 오버레이
// mood: 사이드바에 짧은 한줄 (선택)
const THEMES = {
  // ── 시골/초반 ──
  heltant:            { accent: '#7a9d4a', tint: 'rgba(90,110,60,0.05)',   mood: '풍차가 돈다' },
  old_road:           { accent: '#8a9d5a', tint: 'rgba(100,110,70,0.04)',  mood: '한적한 오솔길' },
  abandoned_farm:     { accent: '#7a7a4a', tint: 'rgba(100,90,60,0.05)',   mood: '버려진 들판' },
  periwinkle:         { accent: '#a89d5a', tint: 'rgba(150,140,80,0.04)',  mood: '끝없는 평원' },

  // ── 숲/자연 ──
  forest:             { accent: '#5a9a5a', tint: 'rgba(60,120,70,0.05)',   mood: '전나무 향' },
  deep_forest:        { accent: '#3a7a3a', tint: 'rgba(40,90,50,0.07)',    mood: '빛이 희미하다' },
  elf_village:        { accent: '#6abfaf', tint: 'rgba(80,150,140,0.06)',  mood: '나무가 노래한다' },
  spirit_forest:      { accent: '#7ab89a', tint: 'rgba(90,150,130,0.06)',  mood: '정령의 흔적' },
  moonlit_grove:      { accent: '#9aaacc', tint: 'rgba(120,140,180,0.06)', mood: '달빛이 스며든다' },
  river_delta:        { accent: '#6a9ab4', tint: 'rgba(90,140,170,0.05)',  mood: '맑은 물소리' },

  // ── 도시 ──
  capital:            { accent: '#7a8abc', tint: 'rgba(100,120,170,0.05)', mood: '왕성의 그림자' },
  palace:             { accent: '#c8a85a', tint: 'rgba(180,150,70,0.06)',  mood: '황금빛 기둥' },
  carmilkar:          { accent: '#d8a858', tint: 'rgba(200,150,80,0.06)',  mood: '향신료 냄새' },

  // ── 가도/도적 ──
  road_south:         { accent: '#8a7a5a', tint: 'rgba(110,90,70,0.04)',   mood: '흙먼지 날린다' },
  trade_road:         { accent: '#bfa876', tint: 'rgba(160,140,100,0.05)', mood: '상인들의 수레' },
  thief_woods:        { accent: '#6a5a3a', tint: 'rgba(80,70,50,0.07)',    mood: '수상한 발자국' },
  golden_chain:       { accent: '#c8a030', tint: 'rgba(170,130,50,0.07)',  mood: '금사슬 소리' },
  pirate_cove:        { accent: '#5a8a9a', tint: 'rgba(80,130,150,0.06)',  mood: '파도와 럼주' },

  // ── 던전/어두운 ──
  ruined_cathedral:   { accent: '#8a6a8a', tint: 'rgba(110,80,110,0.06)',  mood: '성가가 들린다' },
  ancient_battlefield:{ accent: '#6a5a5a', tint: 'rgba(90,70,70,0.06)',    mood: '혼백이 맴돈다' },
  dwarf_mine:         { accent: '#a07a5a', tint: 'rgba(140,100,70,0.06)',  mood: '광맥의 반짝임' },
  unknown_ruins:      { accent: '#7a7a6a', tint: 'rgba(100,100,90,0.05)',  mood: '알 수 없는 문자' },
  forgotten_ruins:    { accent: '#8a7a5a', tint: 'rgba(110,90,70,0.06)',   mood: '옛 왕국의 숨결' },
  handrake_tower:     { accent: '#8a8acc', tint: 'rgba(120,130,190,0.06)', mood: '비전의 광채' },
  zaipun_dungeon:     { accent: '#a04040', tint: 'rgba(150,70,70,0.07)',   mood: '악마의 울부짖음' },
  demon_keep:         { accent: '#c04040', tint: 'rgba(180,70,70,0.08)',   mood: '지옥의 숨결' },
  god_tomb:           { accent: '#8a8acc', tint: 'rgba(120,130,190,0.07)', mood: '신의 잔해' },
  naga_swamp:         { accent: '#6aa050', tint: 'rgba(90,150,80,0.07)',   mood: '독기가 서린다' },

  // ── 사막/화산 ──
  bisrul_desert:      { accent: '#d8a868', tint: 'rgba(200,160,100,0.06)', mood: '모래바람' },
  crimson_canyon:     { accent: '#c83c3c', tint: 'rgba(180,60,60,0.07)',   mood: '피로 물든 암벽' },
  volcano_kaleil:     { accent: '#d8501c', tint: 'rgba(210,80,30,0.07)',   mood: '용암이 끓는다' },
  blyer_sanctum:      { accent: '#a84a8a', tint: 'rgba(160,80,140,0.08)',  mood: '어둠의 찬가' },

  // ── 북부/얼음 ──
  ice_wastes:         { accent: '#9accd8', tint: 'rgba(150,200,220,0.06)', mood: '얼음결정' },
  dragon_mt:          { accent: '#8a8a9a', tint: 'rgba(130,130,150,0.05)', mood: '바위산의 바람' },
  dragon_lair:        { accent: '#b84a30', tint: 'rgba(180,80,60,0.08)',   mood: '용의 숨결' },
  pendragon_peak:     { accent: '#c8dcec', tint: 'rgba(190,215,235,0.06)', mood: '얼어붙은 정상' },
  sky_island:         { accent: '#9ac8e8', tint: 'rgba(150,190,230,0.06)', mood: '구름 위 섬' },
  star_hill:          { accent: '#a0a0d8', tint: 'rgba(150,150,200,0.06)', mood: '별이 가깝다' },
  deep_city:          { accent: '#4a8aaa', tint: 'rgba(70,130,170,0.07)',  mood: '바다 깊은 곳' },

  // ── 용/엔드게임 ──
  kashirk_canyon:     { accent: '#a87850', tint: 'rgba(160,110,80,0.07)',  mood: '대지의 포효' },
  dragon_graveyard:   { accent: '#6a7a9a', tint: 'rgba(100,120,150,0.06)', mood: '죽은 용의 뼈' },
  polaris_shrine:     { accent: '#d8c868', tint: 'rgba(210,190,110,0.08)', mood: '신룡의 시선' },
  dark_abyss:         { accent: '#6a3a7a', tint: 'rgba(100,60,120,0.08)',  mood: '어둠이 움직인다' },
  rift_world:         { accent: '#8a3ab8', tint: 'rgba(130,60,180,0.08)',  mood: '시공이 뒤틀린다' },
  time_corridor:      { accent: '#bc7adc', tint: 'rgba(180,120,220,0.08)', mood: '시간이 흐른다' },
  genesis_land:       { accent: '#e8d890', tint: 'rgba(230,210,150,0.07)', mood: '원초의 빛' },

  // ── 초엔드 ──
  palaleon_market:    { accent: '#4a4a5a', tint: 'rgba(50,50,70,0.09)',    mood: '그림자 거래' },
  tsiraithos_tower:   { accent: '#b8a8d8', tint: 'rgba(170,150,210,0.08)', mood: '허공의 숨결' },
  cosmos_edge:        { accent: '#2a2a4a', tint: 'rgba(30,30,60,0.12)',    mood: '현실의 끝' },
};

const __DATA_EXPORTS__ = { WORLD, RACES, JOBS, LOCATIONS, MONSTERS, ITEMS, SHOP_ITEMS, QUESTS, ADVANCE_NPC, BASE_STATS, TRADE_GOODS, TRADE_PRICES, TRADE_BUY_MARKUP, TRADE_SELL_TAX, TRADE_SKILLS, AWAKENINGS, PROPERTIES, MERCENARIES, ENHANCEMENT, CASINO, GOURMET, TITLES, PETS, CARRIAGE_PRICE, TRAINING_HALLS, TRAIN_DURATIONS, TRAIN_EVENTS, TRAIN_SKILLS, COMBO_SKILLS, THEMES };
if (typeof module !== 'undefined' && module.exports) module.exports = __DATA_EXPORTS__;
if (typeof window !== 'undefined') window.__GAME_DATA__ = __DATA_EXPORTS__;
