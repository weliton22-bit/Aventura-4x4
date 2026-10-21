import { StageId } from './game';

export type WeatherType = 'CLEAR' | 'RAIN' | 'FOG' | 'SANDSTORM';

export interface WeatherDefinition {
  type: WeatherType;
  name: string;
  icon: string;
  description: string;
  baseGripMultiplier: number;
  baseVisibility: number;
  windSpeed: number; // Força horizontal do vento (-1 a 1)
  rainIntensity: number; // 0 a 1
  fogDensity: number; // 0 a 1
  sandDensity: number; // 0 a 1
}

export interface WeatherState {
  currentType: WeatherType;
  targetType: WeatherType;
  transitionProgress: number; // 0 a 1
  intensity: number; // 0 a 1
  visibility: number; // 0 a 1 (1 = visibilidade total, ~0.45 = denso)
  gripMultiplier: number; // Multiplicador de aderência dos pneus
  windX: number; // Velocidade do vento atual
  timeRemaining: number; // Segundos até o próximo ciclo
  cycleDuration: number;
  weatherDef: WeatherDefinition;
}
