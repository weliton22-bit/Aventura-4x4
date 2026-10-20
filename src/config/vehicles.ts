export type VehicleId = 'red_speedster' | 'orc_war_rig' | 'monster_truck';

export interface VehicleDef {
  id: VehicleId;
  name: string;
  tagline: string;
  driverName: string;
  bodyImage: string;
  headImage: string;
  wheelRearImage: string;
  wheelFrontImage: string;
  bodyWidth: number;
  bodyHeight: number;
  bodyOffsetY: number;
  headWidth: number;
  headHeight: number;
  headOffsetX: number;
  headOffsetY: number;
  wheelRadius: number;
  wheelBase: number;
  rearWheelOffsetX: number;
  frontWheelOffsetX: number;
  suspensionRestLength: number;
  mass: number;
  inertia: number;
  engineBonus: number;     // Multiplicador de torque/velocidade nativo
  gripBonus: number;       // Multiplicador de tração/aderência nativo
  fuelCapacity: number;    // Capacidade base do tanque nativa
  unlockCost: number;      // Custo de desbloqueio em moedas
}

/**
 * Características Nativas dos Veículos:
 * Quanto mais caro o veículo, significativamente melhores são suas características
 * por natureza (potência, aderência 4WD, tamanho de rodas e tanque), independentemente de upgrades!
 */
export const VEHICLES: Record<VehicleId, VehicleDef> = {
  // Carro 1: Grátis (Inicial). Equilibrado, leve e ágil.
  red_speedster: {
    id: 'red_speedster',
    name: 'Speedster Retrô',
    tagline: 'Conversível ágil e veloz para iniciantes',
    driverName: 'Mia Speedy',
    bodyImage: '/assets/aistudio/Body_00dfe238.png',
    headImage: '/assets/aistudio/Head_352418c6.png',
    wheelRearImage: '/assets/aistudio/Wheel__1__f1024710.png',
    wheelFrontImage: '/assets/aistudio/Wheel__2__b2c3f27e.png',
    bodyWidth: 140,
    bodyHeight: 49,
    bodyOffsetY: -5,
    headWidth: 38,
    headHeight: 28,
    headOffsetX: -4,
    headOffsetY: -24,
    wheelRadius: 23,
    wheelBase: 110,
    rearWheelOffsetX: -55,
    frontWheelOffsetX: 55,
    suspensionRestLength: 48,
    mass: 2.5,
    inertia: 6000,
    engineBonus: 1.0,      // Potência base de referência
    gripBonus: 1.0,        // Tração base
    fuelCapacity: 100,     // Tanque de 100L
    unlockCost: 0          // Grátis desde o início
  },

  // Carro 2: 300 Moedas. Blindagem reforçada, rodas denteadas com espinhos e muito mais torque.
  orc_war_rig: {
    id: 'orc_war_rig',
    name: 'Aríete de Guerra Orc',
    tagline: 'Torque bruto avassalador e tração reforçada nas subidas',
    driverName: 'Grommash Destruidor',
    bodyImage: '/assets/aistudio/Body_7303dd0b.png',
    headImage: '/assets/aistudio/Head_396f0d58.png',
    wheelRearImage: '/assets/aistudio/Wheel__1__80ab2e32.png',
    wheelFrontImage: '/assets/aistudio/Wheel__2__7c041634.png',
    bodyWidth: 154,
    bodyHeight: 53,
    bodyOffsetY: -8,
    headWidth: 36,
    headHeight: 28,
    headOffsetX: -14,
    headOffsetY: -26,
    wheelRadius: 27,       // Rodas maiores que vencem desníveis
    wheelBase: 120,
    rearWheelOffsetX: -60,
    frontWheelOffsetX: 60,
    suspensionRestLength: 54,
    mass: 3.1,
    inertia: 7400,
    engineBonus: 1.50,     // +50% de torque nativo! Escala rampas com extrema facilidade
    gripBonus: 1.45,       // +45% de aderência nos pneus cravados
    fuelCapacity: 135,     // Tanque maior nativo: 135L (+35% de autonomia)
    unlockCost: 300        // Desbloqueável com 300 moedas
  },

  // Carro 3: 600 Moedas. Máquina definitiva! Rodas gigantes, suspensão alta e motor V8 Supercharged colossal.
  monster_truck: {
    id: 'monster_truck',
    name: 'Monster Truck Fogo Azul',
    tagline: 'O rei da colina! Pneus gigantes, suspensão monstro e motor V8 brutal',
    driverName: 'Jack "Stunt" Miller',
    bodyImage: '/assets/aistudio/Body_9c187670.png',
    headImage: '/assets/aistudio/Head_dd4ff538.png',
    wheelRearImage: '/assets/aistudio/Wheel__1__c7d1839d.png',
    wheelFrontImage: '/assets/aistudio/Wheel__2__d1d40fab.png',
    bodyWidth: 156,
    bodyHeight: 97,
    bodyOffsetY: -18,
    headWidth: 34,
    headHeight: 29,
    headOffsetX: -10,
    headOffsetY: -48,
    wheelRadius: 33,       // Rodas gigantescas de trator monster
    wheelBase: 128,
    rearWheelOffsetX: -64,
    frontWheelOffsetX: 64,
    suspensionRestLength: 64, // Suspensão gigante com absorção de impacto máxima
    mass: 3.5,
    inertia: 8800,
    engineBonus: 2.10,     // +110% de força motriz nativa! Escala paredes e salta como um foguete
    gripBonus: 1.90,       // +90% de aderência nos pneus tratorados
    fuelCapacity: 170,     // Tanque gigante nativo: 170L (+70% de autonomia)
    unlockCost: 600        // Desbloqueável com 600 moedas
  }
};
