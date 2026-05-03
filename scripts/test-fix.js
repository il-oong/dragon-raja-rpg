#!/usr/bin/env node
// 수정 테스트
const path = require('path');
const D = require(path.join(__dirname, '../game/data.js'));
const { Game } = require(path.join(__dirname, '../game/engine.js'));

const lines = [];
const g = new Game((t) => lines.push(t));
g.state = null;
g.awaiting = null;
g.combat = null;
g.trial = null;

g.createChar('Test', 'human', 'warrior');

console.log(`ATK: ${g.getAtk()}\n`);

// 전투 찾기
for (let i = 0; i < 50; i++) {
  g.runCommand('explore');
  if (g.combat) break;
}

if (!g.combat) {
  console.log('전투 없음');
  process.exit(0);
}

console.log(`전투 시작: ${g.combat.foes.map(f => `${f.name}(${f.hp}HP)`).join(', ')}\n`);

let turns = 0;
while (g.combat && turns < 10) {
  console.log(`턴 ${turns + 1}: 적 HP ${g.combat.foes.map(f => f.hp).join(', ')}`);
  g.handleInput('attack');  // runCommand 대신 handleInput 사용!
  turns++;
}

if (!g.combat) {
  console.log(`\n✅ 승리! (${turns}턴)`);
  console.log(`EXP: ${g.state.exp}, Gold: ${g.state.gold}`);
} else {
  console.log(`\n❌ 10턴 후에도 전투 중`);
  console.log(`적 HP: ${g.combat.foes.map(f => f.hp).join(', ')}`);
}
