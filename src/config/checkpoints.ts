/**
 * Definição do Sistema de Metas por Nível (Level Checkpoints)
 * Estilo Hill Climb Racing: metas progressivas de distância com premiação imediata em moedas.
 */

export interface LevelCheckpoint {
  level: number;
  targetMeters: number;
  prevTargetMeters: number;
  rewardCoins: number;
  progressPct: number;
}

export const LEVEL_CHECKPOINTS: { level: number; targetMeters: number; rewardCoins: number }[] = [
  { level: 1, targetMeters: 200, rewardCoins: 50 },
  { level: 2, targetMeters: 400, rewardCoins: 75 },
  { level: 3, targetMeters: 700, rewardCoins: 100 },
  { level: 4, targetMeters: 1100, rewardCoins: 150 },
  { level: 5, targetMeters: 1600, rewardCoins: 200 },
  { level: 6, targetMeters: 2200, rewardCoins: 250 },
  { level: 7, targetMeters: 3000, rewardCoins: 300 },
  { level: 8, targetMeters: 4000, rewardCoins: 400 },
  { level: 9, targetMeters: 5200, rewardCoins: 500 },
  { level: 10, targetMeters: 6500, rewardCoins: 600 }
];

export function getCheckpointForDistance(meters: number): LevelCheckpoint {
  const safeMeters = Math.max(0, Math.floor(meters));
  let prevTarget = 0;

  for (let i = 0; i < LEVEL_CHECKPOINTS.length; i++) {
    const cp = LEVEL_CHECKPOINTS[i];
    if (safeMeters < cp.targetMeters) {
      const range = cp.targetMeters - prevTarget;
      const progress = Math.min(100, Math.max(0, ((safeMeters - prevTarget) / range) * 100));
      return {
        level: cp.level,
        targetMeters: cp.targetMeters,
        prevTargetMeters: prevTarget,
        rewardCoins: cp.rewardCoins,
        progressPct: progress
      };
    }
    prevTarget = cp.targetMeters;
  }

  // Progressão infinita após o Nível 10 (a cada 1500m)
  const extraLevels = Math.floor((safeMeters - 6500) / 1500);
  const currentLvl = 11 + extraLevels;
  const currentPrev = 6500 + extraLevels * 1500;
  const currentTarget = currentPrev + 1500;
  const range = currentTarget - currentPrev;
  const progress = Math.min(100, Math.max(0, ((safeMeters - currentPrev) / range) * 100));

  return {
    level: currentLvl,
    targetMeters: currentTarget,
    prevTargetMeters: currentPrev,
    rewardCoins: 600 + extraLevels * 100,
    progressPct: progress
  };
}
