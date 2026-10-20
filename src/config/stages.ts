import { StageConfig, StageId } from '../types/game';

export const STAGES: Record<StageId, StageConfig> = {
  stage_1_green_hills: {
    id: 'stage_1_green_hills',
    biomeId: 'GREEN_HILLS',
    name: 'Colinas Verdes',
    subtitle: 'Cenário Inicial Clássico',
    price: 0, // Desbloqueado por padrão
    icon: '🌱',
    thumbnail: './assets/aistudio/backgroundColorGrass_cef70dcc.png',
    description: 'Montanhas suaves com grama verde vibrante, árvores frondosas, arbustos e céu limpo. Excelente para acelerar e juntar moedas!',
    roughnessMultiplier: 1.0,
    frictionMultiplier: 1.0,
    startOffsetMeters: 0
  },
  stage_2_pine_forest: {
    id: 'stage_2_pine_forest',
    biomeId: 'PINE_FOREST',
    name: 'Floresta Selvagem',
    subtitle: 'Pinheiros & Cordilheiras',
    price: 150, // 150 moedas conforme pedido
    icon: '🌲',
    thumbnail: './assets/aistudio/backgroundColorForest_469a60c0.png',
    description: 'Altos pinheiros pontiagudos e montanhas imponentes. Relevo mais ondulado que exige bom amortecimento e controle.',
    roughnessMultiplier: 1.15,
    frictionMultiplier: 1.02,
    startOffsetMeters: 0
  },
  stage_3_autumn_valley: {
    id: 'stage_3_autumn_valley',
    biomeId: 'AUTUMN_VALLEY',
    name: 'Vale do Outono',
    subtitle: 'Colinas Douradas & Folhagem',
    price: 300, // 300 moedas conforme pedido
    icon: '🍂',
    thumbnail: './assets/aistudio/backgroundColorFall_b4df338e.png',
    description: 'Atmosfera acolhedora com árvores douradas e terreno terracota. Rampas mais longas e saltos acrobáticos eletrizantes!',
    roughnessMultiplier: 1.25,
    frictionMultiplier: 0.98,
    startOffsetMeters: 0
  },
  stage_4_desert_pyramids: {
    id: 'stage_4_desert_pyramids',
    biomeId: 'DESERT_PYRAMIDS',
    name: 'Deserto das Pirâmides',
    subtitle: 'Dunas Ancestrais & Monumentos',
    price: 600, // 600 moedas conforme pedido
    icon: '🏜️',
    thumbnail: './assets/aistudio/backgroundColorDesert_0a63e5e3.png',
    description: 'Grandes Pirâmides históricas, templos antigos, cactos gigantes e dunas douradas escaldantes! Desafio épico de pilotagem.',
    roughnessMultiplier: 1.35,
    frictionMultiplier: 0.94,
    startOffsetMeters: 0
  }
};

export const STAGE_LIST: StageConfig[] = [
  STAGES.stage_1_green_hills,
  STAGES.stage_2_pine_forest,
  STAGES.stage_3_autumn_valley,
  STAGES.stage_4_desert_pyramids
];
