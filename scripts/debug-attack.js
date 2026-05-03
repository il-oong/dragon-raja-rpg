#!/usr/bin/env node
// 공격 상세 디버그
const path = require('path');
const D = require(path.join(__dirname, '../game/data.js'));
const { Game } = require(path.join(__dirname, '../game/engine.js'));

const lines = [];
const g = new Game((t, kind) => {
  lines.push({t, kind});
  console.log(`[${kind || 'info'}] ${t}`);
});

g.state = null;
g.awaiting = null;
g.combat = null;
g.trial = null;

g.createChar('TestWarrior', 'human', 'warrior');

console.log(`\n캐릭터: Lv.${g.state.lv}, ATK ${g.getAtk()}, DEF ${g.getDef()}\n`);

// 전투가 나올 때까지 탐험
for (let i = 0; i < 50; i++) {
  g.runCommand('explore');
  if (g.combat) break;
}

if (!g.combat) {
  console.log('전투를 찾을 수 없습니다');
  process.exit(1);
}

console.log(`\n전투 시작!`);
console.log(`적: ${g.combat.foes.map(f => `${f.name} (HP ${f.hp}/${f.hpMax}, ATK ${f.atk})`).join(', ')}\n`);

// 5턴만 공격
for (let turn = 1; turn <= 5; turn++) {
  console.log(`\n=== 턴 ${turn} ===`);
  console.log(`내 HP: ${g.state.hp}/${g.getHpMax()}, MP: ${g.state.mp}/${g.getMpMax()}`);
  console.log(`적 HP: ${g.combat.foes.map(f => `${f.name} ${f.hp}/${f.hpMax}`).join(', ')}`);

  console.log(`\n>> attack 명령 실행`);

  try {
    g.runCommand('attack');
  } catch (e) {
    console.log(`오류: ${e.message}`);
    console.log(e.stack);
  }

  if (!g.combat) {
    console.log(`\n전투 종료!`);
    break;
  }
}

console.log(`\n\n=== 최종 상태 ===`);
if (g.combat) {
  console.log(`전투 여전히 진행 중`);
  console.log(`적: ${g.combat.foes.map(f => `${f.name} HP ${f.hp}/${f.hpMax}`).join(', ')}`);
} else {
  console.log(`전투 종료`);
}
console.log(`내 HP: ${g.state.hp}/${g.getHpMax()}`);
console.log(`\n최근 메시지:`);
lines.slice(-15).forEach(l => console.log(`  ${l.t}`));
