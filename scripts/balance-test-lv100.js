#!/usr/bin/env node
// 레벨 100까지 밸런스 테스트
const fs = require('fs');
const { execSync } = require('child_process');

const TEST_JOBS = [
  { race: 'human', job: 'warrior', name: 'Agent_Warrior' },
  { race: 'elf', job: 'mage', name: 'Agent_Mage' },
  { race: 'halfelf', job: 'thief', name: 'Agent_Rogue' },
  { race: 'dwarf', job: 'priest', name: 'Agent_Priest' },
  { race: 'halfling', job: 'merchant', name: 'Agent_Merchant' }
];

console.log('🤖 레벨 100 도달 테스트 시작...\n');
console.log('⏳ 시간이 오래 걸릴 수 있습니다. 커피 한 잔 하세요 ☕\n');

const testScript = `
const path = require('path');
const projectRoot = process.argv[3];
const D = require(path.join(projectRoot, 'game/data.js'));
const { Game } = require(path.join(projectRoot, 'game/engine.js'));

function testToLevel100(config) {
  const lines = [];
  const g = new Game((t) => lines.push(t));
  g.state = null;
  g.awaiting = null;
  g.combat = null;
  g.trial = null;
  g.createChar(config.name, config.race, config.job);

  const stats = {
    combats: 0, wins: 0, deaths: 0, turns: 0,
    goldEarned: 0, expGained: 0, healsUsed: 0,
    jobChanges: 0, skillsLearned: 0
  };

  const maxTurns = 50000; // 안전 장치

  while (g.state.lv < 100 && g.state.hp > 0 && stats.turns < maxTurns) {
    try {
      const beforeGold = g.state.gold;
      const beforeExp = g.state.exp;
      const beforeLv = g.state.lv;
      const beforeJob = g.state.job;

      // 전직 체크 (레벨 20, 40, 60, 80)
      if ([20, 40, 60, 80].includes(g.state.lv)) {
        try {
          const availJobs = D.getAvailableJobs(g.state);
          if (availJobs.length > 0) {
            const nextJob = availJobs[0];
            if (g.state.gold >= nextJob.cost) {
              g.runCommand('job ' + nextJob.id);
              stats.jobChanges++;
            }
          }
        } catch (e) {}
      }

      // 탐험
      g.runCommand('explore');
      stats.turns++;

      // 전투 처리
      if (g.combat) {
        stats.combats++;
        let combatTurns = 0;

        while (g.combat && combatTurns < 100) {
          try {
            const hpPercent = g.state.hp / g.getHpMax();
            const mpPercent = g.state.mp / g.getMpMax();

            // HP 30% 이하면 회복
            if (hpPercent < 0.3 && mpPercent > 0.1) {
              const healSkill = g.state.skills.find(sid => {
                const sk = D.findSkillById(sid);
                return sk && sk.type === 'heal' && (!sk.mp || g.state.mp >= sk.mp);
              });
              if (healSkill) {
                g.runCommand('skill ' + healSkill);
                stats.healsUsed++;
              } else {
                g.runCommand('attack');
              }
            }
            // MP 충분하면 스킬 사용 (50% 확률)
            else if (mpPercent > 0.3 && Math.random() < 0.5) {
              const attackSkills = g.state.skills.filter(sid => {
                const sk = D.findSkillById(sid);
                return sk && (sk.type === 'phys' || sk.type === 'mag' ||
                             sk.type === 'phys_aoe' || sk.type === 'mag_aoe') &&
                       (!sk.mp || g.state.mp >= sk.mp);
              });
              if (attackSkills.length > 0) {
                const skill = attackSkills[Math.floor(Math.random() * attackSkills.length)];
                g.runCommand('skill ' + skill);
              } else {
                g.runCommand('attack');
              }
            } else {
              g.runCommand('attack');
            }

            combatTurns++;
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

      if (g.state.job !== beforeJob) {
        stats.jobChanges++;
      }

      // HP/MP 회복 (여관)
      if (g.state.hp < g.getHpMax() * 0.4 && g.state.gold >= 100) {
        try {
          const oldLoc = g.state.location;
          g.state.location = 'heltant';
          if (D.LOCATIONS[g.state.location] && D.LOCATIONS[g.state.location].inn) {
            g.runCommand('inn');
          }
          g.state.location = oldLoc;
        } catch (e) {}
      }

      // 진행상황 출력 (10레벨마다)
      if (g.state.lv !== beforeLv && g.state.lv % 10 === 0) {
        console.error(\`  → Lv.\${g.state.lv} 도달 (턴: \${stats.turns}, 전투: \${stats.combats}, 승률: \${(stats.wins/stats.combats*100).toFixed(1)}%)\`);
      }

    } catch (e) {
      // 오류 무시
    }
  }

  return {
    job: config.job,
    race: config.race,
    name: config.name,
    finalLevel: g.state.lv,
    finalJob: g.state.job,
    gold: g.state.gold,
    hp: g.state.hp,
    stats: stats,
    atk: g.getAtk(),
    def: g.getDef(),
    mag: g.getMag(),
    hpMax: g.getHpMax(),
    mpMax: g.getMpMax(),
    reached100: g.state.lv >= 100,
    died: g.state.hp <= 0
  };
}

const config = JSON.parse(process.argv[2]);
console.error(\`\n🎮 \${config.name} 시작...\`);
const result = testToLevel100(config);
console.log(JSON.stringify(result));
`;

fs.writeFileSync('/tmp/balance-lv100-worker.js', testScript);

const results = [];
const startTime = Date.now();

for (const config of TEST_JOBS) {
  process.stdout.write(`\n⏳ ${config.name} (${config.race} ${config.job}) 레벨링 중...\n`);

  try {
    const projectRoot = __dirname + '/..';
    const output = execSync(
      `node /tmp/balance-lv100-worker.js '${JSON.stringify(config)}' '${projectRoot}'`,
      { cwd: projectRoot, encoding: 'utf-8', timeout: 600000, maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = output.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    if (jsonLine && jsonLine.startsWith('{')) {
      const result = JSON.parse(jsonLine);
      results.push(result);
      console.log(`✅ 완료: Lv.${result.finalLevel} (${result.finalJob}), ${result.stats.combats}전 ${result.stats.wins}승, ${result.stats.turns}턴`);
    } else {
      console.log('❌ 실패 (결과 없음)');
    }
  } catch (e) {
    console.log(`❌ 오류: ${e.message}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 레벨 100 도달 테스트 결과');
console.log(`⏱️  총 소요시간: ${elapsed}분`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (results.length === 0) {
  console.log('❌ 테스트 결과가 없습니다.');
  process.exit(1);
}

// 성능 테이블
const performance = results.map(r => ({
  직업: r.job.padEnd(10),
  레벨: r.reached100 ? '100 ✅' : `${r.finalLevel} ${r.died ? '💀' : '❌'}`,
  최종직업: r.finalJob,
  전투수: r.stats.combats,
  승률: ((r.stats.wins / r.stats.combats) * 100).toFixed(1) + '%',
  턴수: r.stats.turns,
  전직: r.stats.jobChanges,
  사망: r.stats.deaths,
  골드: r.gold,
  공격: r.atk,
  방어: r.def,
  마법: r.mag
}));

console.table(performance);

// 레벨 100 도달 분석
const reached100 = results.filter(r => r.reached100);
const failed = results.filter(r => !r.reached100);

console.log('\n🏆 레벨 100 도달 현황:\n');
if (reached100.length > 0) {
  console.log('✅ 성공:');
  reached100.forEach(r => {
    const efficiency = (r.stats.turns / 100).toFixed(0);
    console.log(`  • ${r.job.padEnd(10)} - ${r.stats.turns}턴, ${r.stats.combats}전투 (평균 ${efficiency}턴/레벨)`);
  });
}

if (failed.length > 0) {
  console.log('\n❌ 실패:');
  failed.forEach(r => {
    const reason = r.died ? '사망' : '턴 초과';
    console.log(`  • ${r.job.padEnd(10)} - Lv.${r.finalLevel}에서 ${reason}`);
  });
}

// 효율성 순위
if (reached100.length > 0) {
  const sortedByTurns = [...reached100].sort((a, b) => a.stats.turns - b.stats.turns);
  const sortedByGold = [...reached100].sort((a, b) => b.gold - a.gold);

  console.log('\n⚡ 레벨링 속도 순위:');
  sortedByTurns.forEach((r, i) => {
    const turnsPerLevel = (r.stats.turns / 100).toFixed(0);
    console.log(`  ${i + 1}. ${r.job.padEnd(10)} - ${r.stats.turns}턴 (${turnsPerLevel}턴/레벨)`);
  });

  console.log('\n💰 골드 효율 순위:');
  sortedByGold.forEach((r, i) => {
    const goldPerCombat = (r.gold / r.stats.combats).toFixed(0);
    console.log(`  ${i + 1}. ${r.job.padEnd(10)} - ${r.gold}G (${goldPerCombat}G/전투)`);
  });
}

// 밸런스 평가
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 밸런스 평가:\n');

if (reached100.length === TEST_JOBS.length) {
  console.log('✅ 모든 직업이 레벨 100 도달 가능');

  const turnsArray = reached100.map(r => r.stats.turns);
  const maxTurns = Math.max(...turnsArray);
  const minTurns = Math.min(...turnsArray);
  const gap = ((maxTurns - minTurns) / minTurns * 100).toFixed(1);

  if (gap < 20) {
    console.log(`✅ 레벨링 속도 격차 양호 (${gap}%)`);
  } else if (gap < 40) {
    console.log(`⚠️  레벨링 속도 격차 보통 (${gap}%)`);
  } else {
    console.log(`❌ 레벨링 속도 격차 심각 (${gap}%)`);
  }
} else {
  console.log(`❌ ${failed.length}개 직업이 레벨 100 도달 실패`);
  console.log('   → 밸런스 조정 필요');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

fs.unlinkSync('/tmp/balance-lv100-worker.js');
