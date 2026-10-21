import { StageId } from '../types/game';
import { WeatherDefinition, WeatherState, WeatherType } from '../types/weather';

export const WEATHER_DEFINITIONS: Record<WeatherType, WeatherDefinition> = {
  CLEAR: {
    type: 'CLEAR',
    name: 'Céu Limpo',
    icon: '☀️',
    description: 'Pista seca, excelente tração e máxima visibilidade.',
    baseGripMultiplier: 1.0,
    baseVisibility: 1.0,
    windSpeed: 0.1,
    rainIntensity: 0.0,
    fogDensity: 0.0,
    sandDensity: 0.0
  },
  RAIN: {
    type: 'RAIN',
    name: 'Chuva Torrencial',
    icon: '🌧️',
    description: 'Pista molhada e escorregadia. Aderência reduzida em subidas íngremes.',
    baseGripMultiplier: 0.78, // 22% a menos de aderência
    baseVisibility: 0.72,
    windSpeed: 0.55,
    rainIntensity: 0.95,
    fogDensity: 0.25,
    sandDensity: 0.0
  },
  FOG: {
    type: 'FOG',
    name: 'Nevoeiro Denso',
    icon: '🌫️',
    description: 'Visibilidade muito limitada. Asfalto e terra úmidos com leve derrapagem.',
    baseGripMultiplier: 0.88, // 12% a menos de aderência
    baseVisibility: 0.48, // Visibilidade baixa com névoa volumétrica
    windSpeed: 0.25,
    rainIntensity: 0.05,
    fogDensity: 0.95,
    sandDensity: 0.0
  },
  SANDSTORM: {
    type: 'SANDSTORM',
    name: 'Tempestade de Areia',
    icon: '🌪️',
    description: 'Rajadas fortes de vento e dunas instáveis. Dificuldade de aceleração contínua.',
    baseGripMultiplier: 0.82, // 18% a menos de aderência
    baseVisibility: 0.52,
    windSpeed: 0.85,
    rainIntensity: 0.0,
    fogDensity: 0.35,
    sandDensity: 0.95
  }
};

// Climas possíveis e probabilidades por Cenário
export const STAGE_WEATHER_OPTIONS: Record<StageId, { type: WeatherType; weight: number }[]> = {
  stage_1_green_hills: [
    { type: 'CLEAR', weight: 0.55 },
    { type: 'RAIN', weight: 0.45 }
  ],
  stage_2_pine_forest: [
    { type: 'FOG', weight: 0.45 },
    { type: 'RAIN', weight: 0.35 },
    { type: 'CLEAR', weight: 0.20 }
  ],
  stage_3_autumn_valley: [
    { type: 'CLEAR', weight: 0.40 },
    { type: 'RAIN', weight: 0.35 },
    { type: 'FOG', weight: 0.25 }
  ],
  stage_4_desert_pyramids: [
    { type: 'CLEAR', weight: 0.55 },
    { type: 'SANDSTORM', weight: 0.45 }
  ]
};

/**
 * Cria o estado inicial do clima ao iniciar corrida em determinado cenário
 */
export function createInitialWeather(stageId: StageId): WeatherState {
  const options = STAGE_WEATHER_OPTIONS[stageId] || STAGE_WEATHER_OPTIONS.stage_1_green_hills;
  // Começa com o primeiro tipo do cenário (ou CLEAR)
  const initialType = options[0].type;
  const def = WEATHER_DEFINITIONS[initialType];

  return {
    currentType: initialType,
    targetType: initialType,
    transitionProgress: 1.0,
    intensity: initialType === 'CLEAR' ? 0.0 : 1.0,
    visibility: def.baseVisibility,
    gripMultiplier: def.baseGripMultiplier,
    windX: def.windSpeed,
    timeRemaining: 30 + Math.random() * 20, // Ciclos de 30 a 50 segundos
    cycleDuration: 35,
    weatherDef: def
  };
}

/**
 * Seleciona o próximo clima aleatório respeitando as opções do cenário
 */
function pickNextWeather(stageId: StageId, currentType: WeatherType): WeatherType {
  const options = STAGE_WEATHER_OPTIONS[stageId] || STAGE_WEATHER_OPTIONS.stage_1_green_hills;
  // Filtra opções alternativas
  const alternatives = options.filter(opt => opt.type !== currentType);
  if (alternatives.length === 0) return currentType;

  const totalWeight = alternatives.reduce((acc, cur) => acc + cur.weight, 0);
  let r = Math.random() * totalWeight;

  for (const opt of alternatives) {
    if (r <= opt.weight) {
      return opt.type;
    }
    r -= opt.weight;
  }
  return alternatives[0].type;
}

/**
 * Atualiza o sistema meteorológico dinâmico a cada frame de física
 */
export function stepWeather(
  weather: WeatherState,
  stageId: StageId,
  dt: number,
  onWeatherChanged?: (newWeather: WeatherDefinition) => void
): WeatherState {
  const next = { ...weather };
  next.timeRemaining -= dt;

  // Transição suave entre tipos de clima (duração de 4 segundos de interpolação)
  const TRANSITION_SPEED = 0.25; // 4 segundos para transição completa

  if (next.currentType !== next.targetType) {
    next.transitionProgress += dt * TRANSITION_SPEED;
    if (next.transitionProgress >= 1.0) {
      next.transitionProgress = 1.0;
      next.currentType = next.targetType;
      next.weatherDef = WEATHER_DEFINITIONS[next.currentType];
      if (onWeatherChanged) {
        onWeatherChanged(next.weatherDef);
      }
    }
  } else if (next.timeRemaining <= 0) {
    // Escolhe o próximo clima
    const target = pickNextWeather(stageId, next.currentType);
    if (target !== next.currentType) {
      next.targetType = target;
      next.transitionProgress = 0.0;
      next.timeRemaining = 28 + Math.random() * 22;
      const targetDef = WEATHER_DEFINITIONS[target];
      if (onWeatherChanged) {
        onWeatherChanged(targetDef);
      }
    } else {
      next.timeRemaining = 25;
    }
  }

  // Interpolação suave dos parâmetros visuais e físicos
  const currentDef = WEATHER_DEFINITIONS[next.currentType];
  const targetDef = WEATHER_DEFINITIONS[next.targetType];
  const t = next.transitionProgress;

  // Interpolação cúbica suave (ease-in-out)
  const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  const targetGrip = currentDef.baseGripMultiplier + (targetDef.baseGripMultiplier - currentDef.baseGripMultiplier) * easeT;
  const targetVisibility = currentDef.baseVisibility + (targetDef.baseVisibility - currentDef.baseVisibility) * easeT;
  const targetWind = currentDef.windSpeed + (targetDef.windSpeed - currentDef.windSpeed) * easeT;

  const activeWeatherType = next.transitionProgress > 0.5 ? next.targetType : next.currentType;
  const targetIntensity = activeWeatherType === 'CLEAR' ? (1 - easeT) : Math.max(0.2, easeT);

  next.gripMultiplier = targetGrip;
  next.visibility = targetVisibility;
  next.windX = targetWind;
  next.intensity = activeWeatherType === 'CLEAR' ? (1.0 - next.visibility) : targetIntensity;

  return next;
}
