#!/usr/bin/env node
// 간단한 밸런스 테스트 — qa-harness 기반

const fs = require('fs');
const { execSync } = require('child_process');

// 5가지 직업 조합 테스트
const TEST_JOBS = [
  { race: 'human', job: 'warrior', name: 'Agent_Warrior' },
  { race: 'elf', job: 'mage', name: 'Agent_Mage' },
  { race: 'halfelf', job: 'thief', name: 'Agent_Rogue' },
  { race: 'dwarf', job: 'priest', name: 'Agent_Priest' },
  { race: 'halfling', job: 'merchant', name: 'Agent_Merchant' }
];

console.log('🤖 QA 밸런스 테스트 시작...\n');
console.log('5명의 에이전트가 각각 100턴 플레이합니다.\n');

// 테스트 스크립트 생성
const testScript = `
const D = require('../game/data.js');
const { Game } = require('../game/engine.js');

function testAgent(config) {
  const lines = [];
  const g = new Game((t) => lines.push(t));
  g.state = null;
  g.awaiting = null;
  g.combat = null;
  g.trial = null;
  g.createChar(config.name, config.race, config.job);

  const stats = {
    combats: 0, wins: 0, deaths: 0,
    goldEarned: 0, expGained: 0, explorations: 0
  };

  for (let i = 0; i < 100 && g.state.hp > 0; i++) {
    try {
      const beforeGold = g.state.gold;
      const beforeExp = g.state.exp;

      g.runCommand('explore');
      stats.explorations++;

      if (g.combat) {
        stats.combats++;
        let turns = 0;
        while (g.combat && turns < 50) {
          try {
            if (g.state.hp < g.getHpMax() * 0.3 && g.state.mp >= 10) {
              const healSkill = g.state.skills.find(sid => {
                const sk = D.findSkillById(sid);
                return sk && sk.type === 'heal';
              });
              if (healSkill) {
                g.runCommand('skill ' + healSkill);
              } else {
                g.runCommand('attack');
              }
            } else {
              g.runCommand('attack');
            }
            turns++;
          } catch (e) { break; }
        }

        if (!g.combat && g.state.hp > 0) {
          stats.wins++;
        } else if (g.state.hp <= 0) {
          stats.deaths++;
        }
      }

      stats.goldEarned += (g.state.gold - beforeGold);
      stats.expGained += (g.state.exp - beforeExp);

    } catch (e) {
      // 오류 무시하고 계속
    }
  }

  return {
    job: config.job,
    race: config.race,
    name: config.name,
    level: g.state.lv,
    gold: g.state.gold,
    hp: g.state.hp,
    stats: stats,
    atk: g.getAtk(),
    def: g.getDef(),
    mag: g.getMag()
  };
}

const config = JSON.parse(process.argv[2]);
const result = testAgent(config);
console.log(JSON.stringify(result));
`;

fs.writeFileSync('/tmp/balance-test-worker.js', testScript);

const results = [];

for (const config of TEST_JOBS) {
  process.stdout.write(`⏳ ${config.name} (${config.race} ${config.job}) 플레이 중... `);

  try {
    const output = execSync(
      `node /tmp/balance-test-worker.js '${JSON.stringify(config)}'`,
      { cwd: __dirname + '/..', encoding: 'utf-8', timeout: 30000 }
    );

    const lines = output.trim().split('\n');
    const jsonLine = lines.find(l => l.startsWith('{'));
    if (jsonLine) {
      const result = JSON.parse(jsonLine);
      results.push(result);
      console.log(`✓ Lv.${result.level}, ${result.stats.combats}전, ${result.stats.wins}승`);
    } else {
      console.log('❌ 실패 (결과 없음)');
    }
  } catch (e) {
    console.log(`❌ 오류: ${e.message}`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 밸런스 분석 리포트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (results.length === 0) {
  console.log('❌ 테스트 결과가 없습니다.');
  process.exit(1);
}

// 성능 테이블
const performance = results.map(r => ({
  직업: r.job.padEnd(10),
  레벨: r.level,
  골드: r.gold,
  전투: r.stats.combats,
  승리: r.stats.wins,
  사망: r.stats.deaths,
  승률: r.stats.combats > 0 ? ((r.stats.wins / r.stats.combats) * 100).toFixed(1) + '%' : '0%',
  'G/전투': r.stats.combats > 0 ? (r.stats.goldEarned / r.stats.combats).toFixed(0) : '0',
  공격력: r.atk,
  방어력: r.def
}));

console.table(performance);

// 순위
const sortedByLevel = [...results].sort((a, b) => b.level - a.level);
const sortedByWinRate = [...results].sort((a, b) => {
  const rateA = a.stats.combats > 0 ? a.stats.wins / a.stats.combats : 0;
  const rateB = b.stats.combats > 0 ? b.stats.wins / b.stats.combats : 0;
  return rateB - rateA;
});

console.log('\n🏆 성능 순위:\n');

console.log('레벨업 속도:');
sortedByLevel.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.job.padEnd(10)} - Lv.${r.level} (${r.stats.expGained} exp)`);
});

console.log('\n승률:');
sortedByWinRate.forEach((r, i) => {
  const winRate = r.stats.combats > 0 ? (r.stats.wins / r.stats.combats * 100).toFixed(1) : '0';
  console.log(`  ${i + 1}. ${r.job.padEnd(10)} - ${winRate}% (${r.stats.wins}/${r.stats.combats})`);
});

// 밸런스 이슈
console.log('\n⚠️  밸런스 이슈:\n');

const levelGap = sortedByLevel[0].level - sortedByLevel[sortedByLevel.length - 1].level;
if (levelGap > 3) {
  console.log(`  • 레벨 격차: ${sortedByLevel[0].job} Lv.${sortedByLevel[0].level} vs ${sortedByLevel[sortedByLevel.length - 1].job} Lv.${sortedByLevel[sortedByLevel.length - 1].level} (${levelGap}레벨 차이)`);
}

const bestWinRate = sortedByWinRate[0].stats.combats > 0 ? sortedByWinRate[0].stats.wins / sortedByWinRate[0].stats.combats : 0;
const worstWinRate = sortedByWinRate[sortedByWinRate.length - 1].stats.combats > 0 ?
  sortedByWinRate[sortedByWinRate.length - 1].stats.wins / sortedByWinRate[sortedByWinRate.length - 1].stats.combats : 0;
const winRateGap = (bestWinRate - worstWinRate) * 100;

if (winRateGap > 15) {
  console.log(`  • 승률 격차: ${sortedByWinRate[0].job} ${(bestWinRate * 100).toFixed(1)}% vs ${sortedByWinRate[sortedByWinRate.length - 1].job} ${(worstWinRate * 100).toFixed(1)}% (${winRateGap.toFixed(1)}% 차이)`);
}

const highDeath = results.filter(r => r.stats.deaths > 3);
if (highDeath.length > 0) {
  console.log(`  • 높은 사망률: ${highDeath.map(r => `${r.job}(${r.stats.deaths}회)`).join(', ')}`);
}

console.log('\n💡 권장 사항:\n');
if (levelGap > 3) {
  console.log(`  1. ${sortedByLevel[sortedByLevel.length - 1].job}의 경험치 획득량 증가 필요`);
}
if (winRateGap > 15) {
  console.log(`  2. ${sortedByWinRate[sortedByWinRate.length - 1].job}의 전투력 강화 필요`);
}
if (highDeath.length > 0) {
  console.log(`  3. 사망률 높은 직업의 생존력 향상 필요`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 정리
fs.unlinkSync('/tmp/balance-test-worker.js');
