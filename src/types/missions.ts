export type MissionType =
  | 'DRIVE_DISTANCE_SINGLE_RUN'
  | 'COLLECT_COINS_CUMULATIVE_DAY'
  | 'STAGE2_DISTANCE_CUMULATIVE_DAY'
  | 'AIR_TIME_CUMULATIVE_DAY'
  | 'COLLECT_FUEL_SINGLE_RUN';

export interface DailyMission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  iconName: 'flag' | 'coins' | 'fuel' | 'terrain' | 'wing' | 'trophy';
}

export interface DailyMissionsState {
  date: string; // YYYY-MM-DD
  missions: DailyMission[];
}
