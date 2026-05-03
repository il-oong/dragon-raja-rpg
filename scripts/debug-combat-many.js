#!/usr/bin/env node
// 전투 여러번 시도
const path = require('path');
const D = require(path.join(__dirname, '../game/data.js'));
const { Game } = require(path.join(__dirname, '../game/engine.js'));

const lines = [];
const g = new Game((t) => lines.push(t));
g.state = null;
g.awaiting = null;
g.combat = null;
g.trial = null;

g.createChar('TestWarrior', 'human', 'warrior');

console.log(`초기: Lv.${g.state.lv}, HP ${g.state.hp}/${g.getHpMax()}, 공격력 ${g.getAtk()}\n`);

let combats = 0;
let wins = 0;

for (let i = 0; i < 100; i++) {
  const beforeExp = g.state.exp;

  g.runCommand('explore');

  if (g.combat) {
    combats++;
    console.log(`\n[전투 ${combats}] 적: ${g.combat.foes.map(f => `${f.name}(HP${f.hp})`).join(', ')}`);

    let turns = 0;
    while (g.combat && turns < 50) {
      g.runCommand('attack');
      turns++;
    }

    if (!g.combat && g.state.hp > 0) {
      wins++;
      console.log(`  ✅ 승리! (${turns}턴) EXP +${g.state.exp - beforeExp}`);
    } else if (!g.combat) {
      console.log(`  ❓ 전투 종료 (HP ${g.state.hp})`);
    } else {
      console.log(`  ⚠️  50턴 후에도 전투 중 (적 HP: ${g.combat.foes.filter(f => f.hp > 0).map(f => f.hp).join(', ')})`);
    }
  }

  if (g.state.hp <= 0) {
    console.log('\n💀 사망!');
    break;
  }
}

console.log(`\n결과: ${combats}전투, ${wins}승, Lv.${g.state.lv}, EXP ${g.state.exp}, Gold ${g.state.gold}`);
