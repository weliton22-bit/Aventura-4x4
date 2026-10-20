import { BiomeConfig, TerrainInfo } from '../types/game';

export const BIOMES: BiomeConfig[] = [
  {
    id: 'GREEN_HILLS',
    name: 'Colinas Verdes',
    minDist: 0,
    maxDist: 2000,
    skyColors: ['#38bdf8', '#7dd3fc', '#bae6fd'],
    mountainColorFar: '#93c5fd',
    mountainColorNear: '#60a5fa',
    groundBaseColor: '#4d2912',
    groundSubColor: '#1e0f06',
    trackColor: '#16a34a',
    trackBorderColor: '#86efac',
    signBgColor: '#22c55e',
    signTextColor: '#052e16',
    signIcon: '🌱',
    gravityFactor: 1.0
  },
  {
    id: 'PINE_FOREST',
    name: 'Floresta Selvagem',
    minDist: 2000,
    maxDist: 4000,
    skyColors: ['#0284c7', '#38bdf8', '#a5f3fc'],
    mountainColorFar: '#0369a1',
    mountainColorNear: '#0284c7',
    groundBaseColor: '#36210f',
    groundSubColor: '#170c06',
    trackColor: '#15803d',
    trackBorderColor: '#4ade80',
    signBgColor: '#10b981',
    signTextColor: '#064e3b',
    signIcon: '🌲',
    gravityFactor: 1.0
  },
  {
    id: 'AUTUMN_VALLEY',
    name: 'Vale do Outono',
    minDist: 4000,
    maxDist: 6000,
    skyColors: ['#ea580c', '#fb923c', '#fed7aa'],
    mountainColorFar: '#c2410c',
    mountainColorNear: '#ea580c',
    groundBaseColor: '#7c2d12',
    groundSubColor: '#2b0f06',
    trackColor: '#d97706',
    trackBorderColor: '#fde047',
    signBgColor: '#f97316',
    signTextColor: '#431407',
    signIcon: '🍂',
    gravityFactor: 1.0
  },
  {
    id: 'DESERT_PYRAMIDS',
    name: 'Deserto das Pirâmides',
    minDist: 6000,
    maxDist: 999999,
    skyColors: ['#0284c7', '#38bdf8', '#fef08a'],
    mountainColorFar: '#ca8a04',
    mountainColorNear: '#eab308',
    groundBaseColor: '#854d0e',
    groundSubColor: '#3d2407',
    trackColor: '#eab308',
    trackBorderColor: '#fef08a',
    signBgColor: '#eab308',
    signTextColor: '#422006',
    signIcon: '🏜️',
    gravityFactor: 1.0
  }
];

export function getBiomeForStage(stageId: string): BiomeConfig {
  switch (stageId) {
    case 'stage_2_pine_forest':
      return BIOMES[1];
    case 'stage_3_autumn_valley':
      return BIOMES[2];
    case 'stage_4_desert_pyramids':
      return BIOMES[3];
    case 'stage_1_green_hills':
    default:
      return BIOMES[0];
  }
}

export function getBiome(meters: number): BiomeConfig {
  for (let i = BIOMES.length - 1; i >= 0; i--) {
    if (meters >= BIOMES[i].minDist) {
      return BIOMES[i];
    }
  }
  return BIOMES[0];
}

/**
 * Gerador de Terreno Procedural Contínuo, Suave e Estável em Distâncias Extremas (7000m+)
 * Utiliza harmônicas limitadas para evitar derivadas extremas ou saltos angulares que poderiam quebrar a física.
 */
export function getTerrainY(x: number): number {
  if (x < 260) {
    return 440;
  }

  const d = x - 260;

  // Ondulação macroscópica de longo alcance (ciclos de 1.6km)
  const macro = Math.sin(d * 0.00038) * 120;

  // Colinas principais (frequência controlada para garantir rampas de escalada com inclinação justa)
  const hill1 = -Math.sin(d * 0.0028) * 95;
  const hill2 = Math.sin(d * 0.0058 + 0.6) * 42;

  // Micro-ondulações e lombadas suaves
  const ripples = Math.sin(d * 0.014) * 12;

  // Transição do Deserto (após 60.000px = 6000m) com dunas suaves contínuas
  let duneWave = 0;
  if (d > 60000) {
    const desertProgress = Math.min(1, (d - 60000) / 2000); // Rampa de transição suave de 200m
    const duneD = d - 60000;
    duneWave = desertProgress * (Math.sin(duneD * 0.002) * 55 + Math.sin(duneD * 0.0045) * 22);
  }

  // Transição inicial suave na largada
  const startBlend = Math.min(1, d / 320);

  return 440 + startBlend * (macro + hill1 + hill2 + ripples + duneWave);
}

/**
 * Calcula a normal, a tangente e o ângulo de inclinação no ponto X
 * com delta seguro para estabilidade numérica
 */
export function getTerrainInfo(x: number): TerrainInfo {
  const delta = 2.5;
  const y1 = getTerrainY(x - delta);
  const y2 = getTerrainY(x + delta);
  const dx = delta * 2;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);

  return {
    y: (y1 + y2) * 0.5,
    tangentX: dx / len,
    tangentY: dy / len,
    normalX: dy / len,   // Aponta para cima perpendicular à pista
    normalY: -dx / len,
    angle: Math.atan2(dy, dx)
  };
}

export function getZoneName(meters: number, stageId?: string): string {
  const biome = stageId ? getBiomeForStage(stageId) : getBiome(meters);
  return `${biome.signIcon} ${biome.name}`;
}
