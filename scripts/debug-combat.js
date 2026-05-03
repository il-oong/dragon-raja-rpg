#!/usr/bin/env node
// 전투 디버그 테스트
const path = require('path');
const D = require(path.join(__dirname, '../game/data.js'));
const { Game } = require(path.join(__dirname, '../game/engine.js'));

const lines = [];
const g = new Game((t) => lines.push(t));
g.state = null;
g.awaiting = null;
g.combat = null;
g.trial = null;

console.log('캐릭터 생성...');
g.createChar('TestWarrior', 'human', 'warrior');

console.log(`초기 상태: Lv.${g.state.lv}, HP ${g.state.hp}/${g.getHpMax()}, 공격력 ${g.getAtk()}`);
console.log('');

// 5번 탐험 시도
for (let i = 0; i < 5; i++) {
  console.log(`\n=== 탐험 ${i + 1} ===`);

  const beforeExp = g.state.exp;
  const beforeGold = g.state.gold;

  g.runCommand('explore');

  if (g.combat) {
    console.log(`전투 발생! 적: ${g.combat.foes.map(f => f.name).join(', ')}`);
    console.log(`적 HP: ${g.combat.foes.map(f => `${f.hp}/${f.hpMax}`).join(', ')}`);

    let turns = 0;
    while (g.combat && turns < 20) {
      console.log(`\n턴 ${turns + 1}:`);
      console.log(`  플레이어 HP: ${g.state.hp}/${g.getHpMax()}, MP: ${g.state.mp}/${g.getMpMax()}`);

      g.runCommand('attack');

      if (g.combat) {
        console.log(`  적 HP: ${g.combat.foes.filter(f => f.hp > 0).map(f => `${f.name} ${f.hp}/${f.hpMax}`).join(', ')}`);
      } else {
        console.log(`  전투 종료!`);
      }

      turns++;
    }

    if (g.combat) {
      console.log(`⚠️  20턴 후에도 전투 계속 중`);
    }
  } else {
    console.log('전투 없음');
  }

  const expGained = g.state.exp - beforeExp;
  const goldGained = g.state.gold - beforeGold;

  console.log(`결과: EXP +${expGained}, Gold +${goldGained}`);
  console.log(`현재 상태: Lv.${g.state.lv}, HP ${g.state.hp}/${g.getHpMax()}, EXP ${g.state.exp}`);

  if (g.state.hp <= 0) {
    console.log('💀 사망!');
    break;
  }
}

console.log('\n\n=== 최종 상태 ===');
console.log(`레벨: ${g.state.lv}`);
console.log(`HP: ${g.state.hp}/${g.getHpMax()}`);
console.log(`골드: ${g.state.gold}`);
console.log(`경험치: ${g.state.exp}`);
console.log(`\n최근 10개 메시지:`);
lines.slice(-10).forEach(msg => console.log(`  ${msg}`));
