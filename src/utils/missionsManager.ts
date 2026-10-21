import { DailyMission, DailyMissionsState, MissionType } from '../types/missions';

const STORAGE_KEY = 'hillclimb_daily_missions_v2';

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ALL_DAILY_MISSIONS_POOL: Omit<DailyMission, 'current' | 'completed' | 'claimed'>[] = [
  {
    id: 'mission_dist_5000',
    type: 'DRIVE_DISTANCE_SINGLE_RUN',
    title: 'Piloto de Longa Distância',
    description: 'Percorra 5.000m em uma única corrida sem capotar.',
    target: 5000,
    unit: 'm',
    rewardCoins: 350,
    iconName: 'flag'
  },
  {
    id: 'mission_coins_600',
    type: 'COLLECT_COINS_CUMULATIVE_DAY',
    title: '💰 Caixa Forte',
    description: 'Colete um total de 600 moedas juntando todas as suas corridas do dia.',
    target: 600,
    unit: '🪙',
    rewardCoins: 200,
    iconName: 'coins'
  },
  {
    id: 'mission_stage2_2000',
    type: 'STAGE2_DISTANCE_CUMULATIVE_DAY',
    title: '🏜️ Especialista de Terreno',
    description: 'Percorra 2.000 metros totais jogando especificamente no cenário 2.',
    target: 2000,
    unit: 'm',
    rewardCoins: 300,
    iconName: 'terrain'
  },
  {
    id: 'mission_airtime_20',
    type: 'AIR_TIME_CUMULATIVE_DAY',
    title: '🦅 Tempo de Voo',
    description: 'Acumule 20 segundos de tempo total com o carro no ar durante os saltos.',
    target: 20,
    unit: 's',
    rewardCoins: 150,
    iconName: 'wing'
  },
  {
    id: 'mission_fuel_5',
    type: 'COLLECT_FUEL_SINGLE_RUN',
    title: '⛽ Sobrevivente',
    description: 'Passe por 5 galões de combustível em uma única corrida sem deixar o tanque secar.',
    target: 5,
    unit: 'galões',
    rewardCoins: 350,
    iconName: 'fuel'
  }
];

function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Sorteia exatamente três desafios diferentes por dia com base na data.
 * Permite que o dia inteiro tenha o mesmo trio de missões para todos ou em diferentes sessões.
 */
export function generateDailyMissions(dateStr: string): DailyMission[] {
  const seed = hashDate(dateStr);
  const pool = ALL_DAILY_MISSIONS_POOL.map((m) => ({
    ...m,
    current: 0,
    completed: false,
    claimed: false
  }));

  // Fisher-Yates determinístico baseado no hash do dia
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.abs((seed * 31 + i * 17)) % (i + 1);
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }

  return pool.slice(0, 3);
}

export function loadDailyMissions(): DailyMissionsState {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: DailyMissionsState = JSON.parse(raw);
      if (parsed && parsed.date === today && Array.isArray(parsed.missions) && parsed.missions.length === 3) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar missões diárias:', err);
  }

  const newState: DailyMissionsState = {
    date: today,
    missions: generateDailyMissions(today)
  };
  saveDailyMissions(newState);
  return newState;
}

export function saveDailyMissions(state: DailyMissionsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Erro ao salvar missões diárias:', err);
  }
}

/**
 * Atualiza o progresso das missões correspondentes ao evento disparado.
 * Se isCumulative for true, soma o valor ao progresso já conquistado no dia (ex: 300 + 300 moedas).
 * Se isCumulative for false, salva o maior valor alcançado na corrida.
 * Salva no armazenamento local do navegador para nunca perder o progresso parcial.
 */
export function recordMissionProgress(
  type: MissionType,
  value: number,
  isCumulative: boolean = false
): DailyMission[] {
  const state = loadDailyMissions();
  const newlyCompleted: DailyMission[] = [];
  let changed = false;

  state.missions = state.missions.map((mission) => {
    if (mission.type !== type || mission.completed) {
      return mission;
    }

    const nextVal = isCumulative
      ? Number((mission.current + value).toFixed(2))
      : Math.max(mission.current, value);

    if (nextVal !== mission.current) {
      changed = true;
      const isNowCompleted = nextVal >= mission.target;
      if (isNowCompleted && !mission.completed) {
        newlyCompleted.push({ ...mission, current: nextVal, completed: true });
      }
      return {
        ...mission,
        current: Math.min(mission.target, nextVal),
        completed: isNowCompleted
      };
    }
    return mission;
  });

  if (changed) {
    saveDailyMissions(state);
  }

  return newlyCompleted;
}

export function claimReward(missionId: string): number {
  const state = loadDailyMissions();
  let reward = 0;

  state.missions = state.missions.map((m) => {
    if (m.id === missionId && m.completed && !m.claimed) {
      reward = m.rewardCoins;
      return { ...m, claimed: true };
    }
    return m;
  });

  if (reward > 0) {
    saveDailyMissions(state);
  }

  return reward;
}

export function countUnclaimedMissions(state: DailyMissionsState): number {
  return state.missions.filter((m) => m.completed && !m.claimed).length;
}

export function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diffMs = tomorrow.getTime() - now.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}
