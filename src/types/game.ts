export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GARAGE' | 'GAME_OVER';

export interface Upgrades {
  engine: number;      // 1 a 10: Torque e velocidade máxima
  tires: number;       // 1 a 10: Tração 4x4 e aderência em rampas
  suspension: number;  // 1 a 10: Estabilidade e absorção de impacto
  fuelTank: number;    // 1 a 10: Capacidade do tanque e autonomia
}

export type VehicleUpgrades = Record<VehicleId, Upgrades>;

export interface SuspensionConfig {
  stiffness: number;     // Constante elástica da mola (K)
  damping: number;       // Amortecimento hidráulico (C)
  restLength: number;    // Altura / comprimento livre do amortecedor
  maxCompression: number;
  maxExtension: number;
}

export interface WheelState {
  offsetX: number;
  offsetY: number;
  legLength: number;
  prevCompression: number;
  compressionRatio: number;
  worldX: number;
  worldY: number;
  onGround: boolean;
  spinAngle: number;
  spinSpeed: number;
}

export type VehicleId = 'red_speedster' | 'orc_war_rig' | 'monster_truck';

export interface CarState {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  mass: number;
  inertia: number;
  wheelBase: number;
  wheelRadius: number;
  fuel: number;
  maxFuel: number;
  isGameOver: false;
  gameOverReason: string;
  upsideDownTimer: number;
  airTimer: number;
  vehicleId: VehicleId;
  rearWheel: WheelState;
  frontWheel: WheelState;
}

export interface Pickup {
  id: number;
  x: number;
  y: number;
  type: 'coin' | 'fuel';
  collected: boolean;
  value: number;
  animScale?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  type?: 'dust' | 'turbo' | 'coin' | 'spark';
}

export interface TerrainInfo {
  y: number;
  tangentX: number;
  tangentY: number;
  normalX: number;
  normalY: number;
  angle: number;
}

export type BiomeId = 'GREEN_HILLS' | 'PINE_FOREST' | 'AUTUMN_VALLEY' | 'DESERT_PYRAMIDS';

export type StageId = 'stage_1_green_hills' | 'stage_2_pine_forest' | 'stage_3_autumn_valley' | 'stage_4_desert_pyramids';

export interface StageConfig {
  id: StageId;
  biomeId: BiomeId;
  name: string;
  subtitle: string;
  price: number;
  icon: string;
  thumbnail: string;
  description: string;
  roughnessMultiplier: number;
  frictionMultiplier: number;
  startOffsetMeters: number;
}

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  minDist: number;
  maxDist: number;
  skyColors: [string, string, string];
  mountainColorFar: string;
  mountainColorNear: string;
  groundBaseColor: string;
  groundSubColor: string;
  trackColor: string;
  trackBorderColor: string;
  signBgColor: string;
  signTextColor: string;
  signIcon: string;
  gravityFactor: number;
  hasStars?: boolean;
}

