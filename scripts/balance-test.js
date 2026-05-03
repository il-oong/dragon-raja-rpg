#!/usr/bin/env node
// 밸런스 테스트 — 5명의 QA 에이전트가 자동으로 게임 플레이
// 사용법: node scripts/balance-test.js

const path = require('path');
const D = require(path.join(__dirname, '../game/data.js'));

// Game 클래스를 직접 로드하지 말고 엔진을 require 해서 사용
const enginePath = path.join(__dirname, '../game/engine.js');
delete require.cache[require.resolve(enginePath)];
const engineModule = require(enginePath);
const Game = engineModule.Game || engineModule;

// 5명의 테스트 에이전트 설정
const AGENTS = [
  { name: 'Agent_Warrior', race: 'human', job: 'warrior' },
  { name: 'Agent_Mage', race: 'elf', job: 'mage' },
  { name: 'Agent_Rogue', race: 'halfelf', job: 'rogue' },
  { name: 'Agent_Priest', race: 'dwarf', job: 'priest' },
  { name: 'Agent_Merchant', race: 'halfling', job: 'merchant' }
];

function createAgent(config) {
  const lines = [];
  const g = new Game((t, kind) => lines.push({ t, kind }));
  // qa-harness 방식으로 초기화
  g.state = null;
  g.awaiting = null;
  g.combat = null;
  g.trial = null;
  g.createChar(config.name, config.race, config.job);

  return {
    name: config.name,
    race: config.race,
    job: config.job,
    game: g,
    lines,
    stats: {
      combats: 0,
      wins: 0,
      losses: 0,
      deaths: 0,
      goldEarned: 0,
      expGained: 0,
      levelsGained: 0,
      damageDealt: 0,
      damageTaken: 0,
      healsUsed: 0,
      explorations: 0
    }
  };
}

function autoPlay(agent, turns = 100) {
  const g = agent.game;
  const stats = agent.stats;

  for (let i = 0; i < turns && g.state.hp > 0; i++) {
    try {
      // 탐험
      const beforeGold = g.state.gold;
      const beforeExp = g.state.exp;
      const beforeLv = g.state.lv;

      g.runCommand('explore');
      stats.explorations++;

      // 전투 발생 시
      if (g.combat) {
        stats.combats++;
        const initialEnemyCount = g.combat.foes.length;
        let combatTurns = 0;

        while (g.combat && combatTurns < 50) {
          try {
            const beforeHp = g.state.hp;

            // HP 낮으면 회복
            if (g.state.hp < g.getHpMax() * 0.3 && g.state.mp >= 10) {
              const healSkill = g.state.skills.find(sid => {
                const sk = D.findSkillById(sid);
                return sk && sk.type === 'heal';
              });
              if (healSkill) {
                g.runCommand(`skill ${healSkill}`);
                stats.healsUsed++;
              } else {
                g.runCommand('attack');
              }
            } else {
              // 스킬 사용 (MP 충분하면)
              const attackSkill = g.state.skills.find(sid => {
                const sk = D.findSkillById(sid);
                return sk && (sk.type === 'attack' || sk.type === 'magic') &&
                       (!sk.mp || g.state.mp >= sk.mp);
              });
              if (attackSkill && Math.random() < 0.3) {
                g.runCommand(`skill ${attackSkill}`);
              } else {
                g.runCommand('attack');
              }
            }

            const afterHp = g.state.hp;
            if (afterHp < beforeHp) {
              stats.damageTaken += (beforeHp - afterHp);
            }

            combatTurns++;
          } catch (e) {
            console.error(`${agent.name} combat error:`, e.message);
            break;
          }
        }

        // 전투 결과
        if (!g.combat) {
          if (g.state.hp > 0) {
            stats.wins++;
          } else {
            stats.losses++;
            stats.deaths++;
          }
        }
      }

      // 골드/경험치 획득 기록
      const goldGained = g.state.gold - beforeGold;
      const expGained = g.state.exp - beforeExp;

      if (goldGained > 0) stats.goldEarned += goldGained;
      if (expGained > 0) stats.expGained += expGained;
      if (g.state.lv > beforeLv) stats.levelsGained += (g.state.lv - beforeLv);

      // HP 회복 (여관)
      if (g.state.hp < g.getHpMax() * 0.5 && g.state.gold >= 50) {
        try {
          g.state.location = 'heltant'; // 헬탄트로 이동
          if (D.LOCATIONS[g.state.location].inn) {
            g.runCommand('inn');
          }
        } catch (e) {
          // 여관 이용 실패 시 무시
        }
      }

    } catch (e) {
      console.error(`${agent.name} error on turn ${i}:`, e.message);
    }
  }

  return {
    finalLevel: g.state.lv,
    finalGold: g.state.gold,
    finalHp: g.state.hp,
    finalStats: {
      atk: g.getAtk(),
      def: g.getDef(),
      mag: g.getMag(),
      hpMax: g.getHpMax(),
      mpMax: g.getMpMax()
    },
    efficiency: {
      goldPerCombat: stats.combats > 0 ? stats.goldEarned / stats.combats : 0,
      expPerCombat: stats.combats > 0 ? stats.expGained / stats.combats : 0,
      winRate: stats.combats > 0 ? (stats.wins / stats.combats * 100) : 0,
      survivalRate: stats.combats > 0 ? ((stats.combats - stats.deaths) / stats.combats * 100) : 0
    }
  };
}

function analyzeBalance(results) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 밸런스 분석 리포트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 직업별 성능 비교
  const jobPerformance = results.map(r => ({
    job: r.agent.job,
    name: r.agent.name,
    level: r.result.finalLevel,
    gold: r.result.finalGold,
    winRate: r.result.efficiency.winRate.toFixed(1),
    survivalRate: r.result.efficiency.survivalRate.toFixed(1),
    goldPerCombat: r.result.efficiency.goldPerCombat.toFixed(1),
    expPerCombat: r.result.efficiency.expPerCombat.toFixed(1),
    combats: r.agent.stats.combats,
    deaths: r.agent.stats.deaths
  }));

  console.log('🎮 직업별 성능:\n');
  console.table(jobPerformance);

  // 최고/최저 성능 직업
  const sortedByLevel = [...jobPerformance].sort((a, b) => b.level - a.level);
  const sortedByWinRate = [...jobPerformance].sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  const sortedByGold = [...jobPerformance].sort((a, b) => b.goldPerCombat - a.goldPerCombat);

  console.log('\n🏆 성능 순위:\n');
  console.log('레벨업 속도:');
  sortedByLevel.forEach((j, i) => {
    console.log(`  ${i + 1}. ${j.job.padEnd(10)} - Lv.${j.level} (${j.expPerCombat} exp/전투)`);
  });

  console.log('\n승률:');
  sortedByWinRate.forEach((j, i) => {
    console.log(`  ${i + 1}. ${j.job.padEnd(10)} - ${j.winRate}% (${j.combats}전 ${j.deaths}사망)`);
  });

  console.log('\n골드 획득:');
  sortedByGold.forEach((j, i) => {
    console.log(`  ${i + 1}. ${j.job.padEnd(10)} - ${j.goldPerCombat}G/전투`);
  });

  // 밸런스 이슈 감지
  console.log('\n⚠️  밸런스 이슈:\n');

  const levelGap = sortedByLevel[0].level - sortedByLevel[sortedByLevel.length - 1].level;
  if (levelGap > 5) {
    console.log(`  • 레벨 격차 심각: ${sortedByLevel[0].job}(Lv.${sortedByLevel[0].level}) vs ${sortedByLevel[sortedByLevel.length - 1].job}(Lv.${sortedByLevel[sortedByLevel.length - 1].level}) = ${levelGap} 레벨 차이`);
  }

  const winRateGap = parseFloat(sortedByWinRate[0].winRate) - parseFloat(sortedByWinRate[sortedByWinRate.length - 1].winRate);
  if (winRateGap > 20) {
    console.log(`  • 승률 격차 심각: ${sortedByWinRate[0].job}(${sortedByWinRate[0].winRate}%) vs ${sortedByWinRate[sortedByWinRate.length - 1].job}(${sortedByWinRate[sortedByWinRate.length - 1].winRate}%) = ${winRateGap.toFixed(1)}% 차이`);
  }

  const goldGap = sortedByGold[0].goldPerCombat / (sortedByGold[sortedByGold.length - 1].goldPerCombat || 1);
  if (goldGap > 2) {
    console.log(`  • 골드 획득 격차: ${sortedByGold[0].job}가 ${sortedByGold[sortedByGold.length - 1].job}보다 ${goldGap.toFixed(1)}배 많이 획득`);
  }

  // 사망률 높은 직업
  const highDeathRate = jobPerformance.filter(j => j.deaths > 5);
  if (highDeathRate.length > 0) {
    console.log(`  • 사망률 높은 직업: ${highDeathRate.map(j => `${j.job}(${j.deaths}회)`).join(', ')}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 권장사항
  console.log('💡 밸런스 조정 권장사항:\n');

  if (levelGap > 5) {
    console.log(`  1. ${sortedByLevel[sortedByLevel.length - 1].job}의 경험치 획득량 증가 필요`);
  }
  if (winRateGap > 20) {
    console.log(`  2. ${sortedByWinRate[sortedByWinRate.length - 1].job}의 전투력 강화 필요`);
  }
  if (highDeathRate.length > 0) {
    console.log(`  3. ${highDeathRate.map(j => j.job).join(', ')}의 생존력 향상 필요`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 메인 실행
async function main() {
  console.log('🤖 QA 에이전트 5명 생성 중...\n');

  const agents = AGENTS.map(createAgent);

  console.log('✅ 에이전트 생성 완료:');
  agents.forEach(a => console.log(`  • ${a.name} (${a.race} ${a.job})`));

  console.log('\n🎮 자동 플레이 시작 (각 100턴)...\n');

  const results = [];

  for (const agent of agents) {
    console.log(`⏳ ${agent.name} 플레이 중...`);
    const result = autoPlay(agent, 100);
    results.push({ agent, result });
    console.log(`  ✓ 완료 - Lv.${result.finalLevel}, ${result.efficiency.winRate.toFixed(1)}% 승률, ${agent.stats.combats}회 전투`);
  }

  console.log('\n✅ 모든 에이전트 플레이 완료!\n');

  // 밸런스 분석
  analyzeBalance(results);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
