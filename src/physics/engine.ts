import { CarState, Particle, Pickup, SuspensionConfig, Upgrades, VehicleId, StageId } from '../types/game';
import { getBiomeForStage, getTerrainInfo, getTerrainY } from './terrain';
import { soundManager } from '../audio/soundManager';
import { VEHICLES } from '../config/vehicles';

export interface KeyControls {
  gas: boolean;
  brake: boolean;
  boost: boolean;
}

export function createInitialCar(
  upgrades: Upgrades,
  suspension: SuspensionConfig,
  vehicleId: VehicleId = 'red_speedster',
  startX: number = 100
): CarState {
  const vDef = VEHICLES[vehicleId] || VEHICLES.red_speedster;
  const startY = getTerrainY(startX) - 80;
  const maxFuel = Math.round(vDef.fuelCapacity + (upgrades.fuelTank - 1) * 15);

  return {
    x: startX,
    y: startY,
    prevX: startX,
    prevY: startY,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
    mass: vDef.mass,
    inertia: vDef.inertia,
    wheelBase: vDef.wheelBase,
    wheelRadius: vDef.wheelRadius,
    fuel: maxFuel,
    maxFuel: maxFuel,
    isGameOver: false,
    gameOverReason: '',
    upsideDownTimer: 0,
    airTimer: 0,
    throttleRamp: 0,
    airRotation: 0,
    completedFlips: 0,
    vehicleId: vehicleId,
    rearWheel: {
      offsetX: vDef.rearWheelOffsetX,
      offsetY: 18,
      legLength: vDef.suspensionRestLength,
      prevCompression: 0,
      compressionRatio: 0,
      worldX: startX + vDef.rearWheelOffsetX,
      worldY: startY + vDef.suspensionRestLength,
      onGround: true,
      spinAngle: 0,
      spinSpeed: 0
    },
    frontWheel: {
      offsetX: vDef.frontWheelOffsetX,
      offsetY: 18,
      legLength: vDef.suspensionRestLength,
      prevCompression: 0,
      compressionRatio: 0,
      worldX: startX + vDef.frontWheelOffsetX,
      worldY: startY + vDef.suspensionRestLength,
      onGround: true,
      spinAngle: 0,
      spinSpeed: 0
    }
  };
}

/**
 * Distância mínima de um ponto a um segmento de reta (para varredura contínua de pickups)
 */
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

/**
 * Passo de física com alta precisão e resolução de colisão de corpo rígido
 */
export function stepPhysics(
  car: CarState,
  controls: KeyControls,
  upgrades: Upgrades,
  suspension: SuspensionConfig,
  pickups: Pickup[],
  particles: Particle[],
  dt: number,
  onCoinCollected: (val: number) => void,
  onGameOver: (reason: string) => void,
  stageId: StageId = 'stage_1_green_hills',
  onFuelCollected?: () => void
) {
  if (car.isGameOver) return;

  car.prevX = car.x;
  car.prevY = car.y;

  const subSteps = 10;
  const subDt = dt / subSteps;
  const biome = getBiomeForStage(stageId);
  const gravity = 660 * biome.gravityFactor;

  // Modificadores de Upgrades e Atributos Próprios do Veículo Selecionado
  const vDef = VEHICLES[car.vehicleId] || VEHICLES.red_speedster;
  const safeEngine = Number.isFinite(upgrades?.engine) ? Math.max(1, upgrades.engine) : 1;
  const safeTires = Number.isFinite(upgrades?.tires) ? Math.max(1, upgrades.tires) : 1;
  const safeSusp = Number.isFinite(upgrades?.suspension) ? Math.max(1, upgrades.suspension) : 1;
  const safeTank = Number.isFinite(upgrades?.fuelTank) ? Math.max(1, upgrades.fuelTank) : 1;

  // Curva de Aceleração e Ré Realista e Progressiva:
  // Agora a marcha ré recebe a mesma potência, torque e rampa de aceleração do pedal dianteiro!
  if ((controls.gas || controls.boost || controls.brake) && car.fuel > 0) {
    const rampRate = controls.boost ? 0.90 : 0.40;
    car.throttleRamp = Math.min(1.0, (car.throttleRamp || 0) + dt * rampRate);
  } else {
    car.throttleRamp = Math.max(0, (car.throttleRamp || 0) - dt * 1.4);
  }

  // Fator progressivo de torque: escala de 0.65 até 1.55 no pedal, ou 1.70 no Turbo
  let throttleFactor = 0.65 + (car.throttleRamp || 0) * 0.90;
  if (controls.boost) {
    throttleFactor = Math.max(throttleFactor, 1.70);
  }

  const enginePower = (1320 + safeEngine * 170) * (vDef.engineBonus || 1) * throttleFactor;
  const tireGrip = (2.7 + safeTires * 0.32) * (vDef.gripBonus || 1);
  const suspensionStab = 1 + safeSusp * 0.08;

  for (let s = 0; s < subSteps; s++) {
    let totalFx = 0;
    let totalFy = car.mass * gravity;
    let totalTorque = 0;

    const cosA = Math.cos(car.angle);
    const sinA = Math.sin(car.angle);

    // Vetor unitário apontando para baixo na orientação do chassi
    const strutDirX = -sinA;
    const strutDirY = cosA;

    // Deslocamento do Centro de Massa (CoM): 5px para frente e 7px para baixo (estabilidade de rali)
    const comOffsetX = 5 * cosA - 7 * sinA;
    const comOffsetY = 5 * sinA + 7 * cosA;

    // Resolução de cada uma das rodas (Tração 4x4 integral 50/50: frente puxa e traseira empurra)
    const wheels = [
      { wheel: car.rearWheel, isRear: true, powerRatio: 0.5 },
      { wheel: car.frontWheel, isRear: false, powerRatio: 0.5 }
    ];

    wheels.forEach(({ wheel, powerRatio }) => {
      // Ponto de montagem no chassi em relação ao Centro de Massa
      const rawRelX = wheel.offsetX * cosA - wheel.offsetY * sinA;
      const rawRelY = wheel.offsetX * sinA + wheel.offsetY * cosA;

      const mountRelX = rawRelX - comOffsetX;
      const mountRelY = rawRelY - comOffsetY;

      const mountX = car.x + rawRelX;
      const mountY = car.y + rawRelY;

      // Velocidade do ponto de montagem
      const mountVelX = car.vx - car.angularVel * mountRelY;
      const mountVelY = car.vy + car.angularVel * mountRelX;

      const maxLeg = suspension.restLength;
      const extendedWheelX = mountX + strutDirX * maxLeg;
      const extendedWheelY = mountY + strutDirY * maxLeg;

      // Consulta de terreno abaixo da roda
      const terrain = getTerrainInfo(extendedWheelX);
      const groundContactY = terrain.y - car.wheelRadius / Math.max(0.5, Math.cos(terrain.angle));

      // Contato com o solo considerando ângulo e compressão
      const isTouchingGround = extendedWheelY >= groundContactY && strutDirY > 0.05;

      if (isTouchingGround) {
        wheel.onGround = true;

        const desiredLeg = (groundContactY - mountY) / Math.max(0.15, strutDirY);
        const minLeg = Math.max(14, maxLeg - suspension.maxCompression);
        wheel.legLength = Math.max(minLeg, Math.min(maxLeg, desiredLeg));

        const compression = maxLeg - wheel.legLength;
        wheel.compressionRatio = Math.min(1, Math.max(0, compression / suspension.maxCompression));

        const compressionVel = (compression - wheel.prevCompression) / subDt;
        wheel.prevCompression = compression;

        // Amortecimento de retorno natural (permite que a suspensão empurre o carro em cristas para saltos reais)
        const dampingCoeff = compressionVel < 0 ? suspension.damping * 1.05 : suspension.damping;
        let springForce = suspension.stiffness * suspensionStab * compression;
        let damperForce = dampingCoeff * suspensionStab * compressionVel;

        // Bump stop (batente de segurança se comprimir além do limite)
        if (desiredLeg < minLeg) {
          springForce += (minLeg - desiredLeg) * 1400;
        }

        const suspForce = Math.max(0, springForce + damperForce);

        const suspFx = -strutDirX * suspForce;
        const suspFy = -strutDirY * suspForce;

        totalFx += suspFx;
        totalFy += suspFy;
        totalTorque += (mountRelX * suspFy - mountRelY * suspFx);

        // Posição final da roda
        wheel.worldX = mountX + strutDirX * wheel.legLength;
        wheel.worldY = mountY + strutDirY * wheel.legLength;

        // Força motriz e tração (4x4 com auxílio ativo de subida de rampa)
        // Força motriz e tração (4x4 com potência idêntica para ré e aceleração à frente)
        let driveForce = 0;
        if (car.fuel > 0) {
          if (controls.gas) {
            driveForce += enginePower * powerRatio;
            // Compensação vetorial da gravidade ao longo da rampa (garante subida de qualquer inclinação!)
            const slopeGravityResist = Math.max(0, -terrain.tangentY) * car.mass * gravity;
            driveForce += slopeGravityResist * 1.35 * powerRatio;
          }
          if (controls.brake) {
            // Marcha ré com a MESMA potência integral do motor e compensação de rampa!
            driveForce -= enginePower * powerRatio;
            const slopeGravityResist = Math.max(0, terrain.tangentY) * car.mass * gravity;
            driveForce -= slopeGravityResist * 1.35 * powerRatio;
          }
          if (controls.boost) {
            // Propulsão ativa com jato massivo independente de estar pisando no acelerador
            driveForce += (enginePower * 1.15 + 1100) * powerRatio;
          }
        }

        // Atrito de contato com o solo e anti-recuo em subidas
        const tangentVel = mountVelX * terrain.tangentX + mountVelY * terrain.tangentY;
        let rollingResistance = -tangentVel * 0.45;

        // Se o jogador estiver acelerando e a velocidade for nula ou negativa na subida, trava o recuo
        if (controls.gas && car.fuel > 0 && tangentVel < 5 && terrain.tangentY < -0.05) {
          rollingResistance += Math.abs(tangentVel) * tireGrip * 2.2;
        } else if (controls.brake && car.fuel > 0 && tangentVel > -5 && terrain.tangentY > 0.05) {
          // Na marcha ré subindo rampa inclinada para trás, trava o recuo para frente
          rollingResistance -= Math.abs(tangentVel) * tireGrip * 2.2;
        }

        const totalTraction = driveForce + rollingResistance;
        const tracFx = terrain.tangentX * totalTraction;
        const tracFy = terrain.tangentY * totalTraction;

        totalFx += tracFx;
        totalFy += tracFy;
        // Torque rotacional suave da tração em relação ao CoM rebaixado
        totalTorque += (mountRelX * tracFy - mountRelY * tracFx) * 0.06;

        wheel.spinSpeed = tangentVel / car.wheelRadius;
        if ((controls.gas || controls.boost) && car.fuel > 0) {
          wheel.spinSpeed += controls.boost ? 4.0 : (1.0 + (car.throttleRamp || 0) * 1.8);
        } else if (controls.brake && car.fuel > 0) {
          wheel.spinSpeed -= (1.0 + (car.throttleRamp || 0) * 1.8);
        }
      } else {
        wheel.onGround = false;
        wheel.legLength += (maxLeg - wheel.legLength) * Math.min(1, subDt * 16);
        wheel.prevCompression = maxLeg - wheel.legLength;
        wheel.compressionRatio = Math.max(0, wheel.prevCompression / suspension.maxCompression);
        wheel.worldX = mountX + strutDirX * wheel.legLength;
        wheel.worldY = mountY + strutDirY * wheel.legLength;

        if (controls.boost && car.fuel > 0) wheel.spinSpeed = 24;
        else if (controls.gas && car.fuel > 0) wheel.spinSpeed = 10 + (car.throttleRamp || 0) * 8;
        else if (controls.brake && car.fuel > 0) wheel.spinSpeed = -(10 + (car.throttleRamp || 0) * 8);
        else wheel.spinSpeed *= 0.98;
      }

      wheel.spinAngle += wheel.spinSpeed * subDt;
    });

    // ==========================================
    // COLISÃO DE CORPO RÍGIDO DO CHASSI (ANTI-AFUNDAMENTO)
    // ==========================================
    const chassisCheckPoints = [
      { rx: 65, ry: 10, name: 'bumper_f' },   // Para-choque frontal
      { rx: 32, ry: 18, name: 'belly_f' },    // Assoalho dianteiro
      { rx: 0, ry: 20, name: 'belly_mid' },   // Ventre central
      { rx: -32, ry: 18, name: 'belly_r' },   // Assoalho traseiro
      { rx: -65, ry: 10, name: 'bumper_r' },  // Para-choque traseiro
      { rx: 55, ry: -6, name: 'hood' }        // Capô dianteiro
    ];

    let maxPenetration = 0;
    let worstTerrInfo = getTerrainInfo(car.x);

    chassisCheckPoints.forEach(pt => {
      const worldPtX = car.x + pt.rx * cosA - pt.ry * sinA;
      const worldPtY = car.y + pt.rx * sinA + pt.ry * cosA;

      const groundY = getTerrainY(worldPtX);
      const penetration = worldPtY - groundY;

      if (penetration > 0) {
        if (penetration > maxPenetration) {
          maxPenetration = penetration;
          worstTerrInfo = getTerrainInfo(worldPtX);
        }

        const terrInfo = getTerrainInfo(worldPtX);
        const normalSpeed = (car.vx * terrInfo.normalX + car.vy * terrInfo.normalY);
        if (normalSpeed < 0) {
          const impulse = -normalSpeed * car.mass * 0.75;
          totalFx += terrInfo.normalX * impulse;
          totalFy += terrInfo.normalY * impulse;

          const relX = worldPtX - (car.x + comOffsetX);
          const relY = worldPtY - (car.y + comOffsetY);
          const impactTorque = (relX * (terrInfo.normalY * impulse) - relY * (terrInfo.normalX * impulse)) * 0.08;
          totalTorque += Math.max(-6000, Math.min(6000, impactTorque));
        }

        if (car.vy > 0) {
          car.vy *= 0.88;
        }
      }
    });

    // Correção posicional suave e limitada (elimina explosões físicas em distâncias extremas >7000m)
    if (maxPenetration > 0) {
      const shift = Math.min(1.8, maxPenetration * 0.35);
      car.y -= shift;
      car.x += shift * worstTerrInfo.normalX * 0.5;
    }

    // ==========================================
    // SISTEMA ESTABILIZADOR ANTI-CAPOTAMENTO (ANTI-WHEELIE & ESTABILIDADE DE SOLO)
    // ==========================================
    const isAnyWheelGrounded = car.rearWheel.onGround || car.frontWheel.onGround;

    if (isAnyWheelGrounded) {
      // Quando no chão, alinha o chassi com a pista e impede que a frente empine para trás
      const terrainAtCar = getTerrainInfo(car.x);
      const angleDiff = car.angle - terrainAtCar.angle;

      // Se a frente do carro estiver empinando desnecessariamente acima do terreno (angleDiff < -0.06):
      // Aplica torque corretivo forte que empurra o bico para baixo mantendo o carro colado na subida!
      // Torque anti-empinamento moderado: só atua se a empinada for muito extrema (< -0.35)
      // Permite que o carro levante a frente ao saltar sobre colinas para aquele suspense real de capotamento!
      if (angleDiff < -0.35) {
        const antiWheelieTorque = Math.abs(angleDiff) * 8500;
        totalTorque += antiWheelieTorque;
      }

      // Amortecimento rotacional no solo
      car.angularVel *= Math.pow(0.88, subDt * 60);

      // Tração suave com o solo (sem grudar artificialmente para permitir decolagens e saltos)
      totalFx += terrainAtCar.normalX * -60;
      totalFy += terrainAtCar.normalY * -60;
    } else {
      // ==========================================
      // CONTROLE AÉREO E RISCO REAL DE CAPOTAMENTO
      // ==========================================
      // Acelerar no ar inclina para trás (pode dar backflip ou capotar se exagerar!)
      // Frear no ar embica para frente (essencial para aterrisar suavemente alinhado na descida)
      const airPitchTorque = 6500;

      if (car.fuel > 0) {
        if (controls.gas) {
          totalTorque -= airPitchTorque;
        }
        if (controls.brake) {
          totalTorque += airPitchTorque;
        }
        if (controls.boost) {
          totalFx += cosA * 1150;
          totalFy += sinA * 700;
        }
      }

      // Amortecimento rotacional no ar: mais forte quando o piloto solta os pedais para estabilizar a atitude
      if (!controls.gas && !controls.brake) {
        car.angularVel *= Math.pow(0.91, subDt * 60);
      } else {
        car.angularVel *= Math.pow(0.96, subDt * 60);
      }

      // Limitação estrita da velocidade angular no ar (impede rotações descontroladas ou loops acidentais)
      const maxAirRot = 2.4;
      car.angularVel = Math.max(-maxAirRot, Math.min(maxAirRot, car.angularVel));

      // ==========================================
      // ASSISTÊNCIA SUAVE DE AUTO-ALINHAMENTO PARA POUSO
      // ==========================================
      const terrBelow = getTerrainInfo(car.x);
      const distToGround = terrBelow.y - car.y;

      // Ativa quando estiver em fase de descida (vy > 10) e se aproximando do solo (< 150px)
      if (car.vy > 10 && distToGround > 0 && distToGround < 150) {
        const landingAngleDiff = car.angle - terrBelow.angle;
        const proximityFactor = Math.min(1, Math.max(0, (150 - distToGround) / 100));

        // Se o piloto não estiver forçando manobra oposta, alinha o chassi com o terreno suavemente
        const isCounterActing = (landingAngleDiff > 0 && controls.brake) || (landingAngleDiff < 0 && controls.gas);
        if (!isCounterActing) {
          const autoAlignTorque = -landingAngleDiff * (12000 * proximityFactor);
          totalTorque += autoAlignTorque;
        }
      }
    }

    // Integração de movimento do chassi
    car.vx += (totalFx / car.mass) * subDt;
    car.vy += (totalFy / car.mass) * subDt;

    // Resistência do ar aerodinâmica suave e progressiva
    car.vx *= Math.pow(0.988, subDt * 60);
    car.vy *= Math.pow(0.995, subDt * 60);

    // Limitação progressiva de velocidade (Ajustado um pouquinho mais rápido para permitir saltos emocionantes):
    // - 1ª marcha (arranque): ~40-44 km/h
    // - 2ª a 4ª marcha (embalando na pista): cresce progressivamente até ~78-85 km/h
    // - Propulsão / Turbo NITRO: decola a ~105-112 km/h!
    const baseSpeedX = 245 + safeEngine * 18;
    let maxSpeedX = baseSpeedX + (car.throttleRamp || 0) * 215;
    if (controls.boost) {
      maxSpeedX += 165;
    }
    // Velocidade e potência máxima em marcha ré equivalente à aceleração para frente
    const maxReverseSpeedX = -(baseSpeedX + (car.throttleRamp || 0) * 215);
    car.vx = Math.max(maxReverseSpeedX, Math.min(maxSpeedX, car.vx));

    car.x += car.vx * subDt;
    car.y += car.vy * subDt;

    // Barreira no início da pista
    if (car.x < 50) {
      car.x = 50;
      car.vx = Math.max(0, car.vx);
    }

    car.angularVel += (totalTorque / car.inertia) * subDt;
    car.angularVel *= Math.pow(0.95, subDt * 60);
    car.angle += car.angularVel * subDt;
  }

  // Atualiza tempo no ar
  if (!car.rearWheel.onGround && !car.frontWheel.onGround) {
    car.airTimer += dt;
  } else {
    car.airTimer = 0;
  }

  // Consumo desafiador e veloz (Estilo Hill Climb Racing):
  // - Marcha lenta / parado: 2.0 u/s
  // - Acelerando com pedal [Gas] ou [Brake/Ré]: 12.5 u/s total (mesma potência e tração do motor!)
  // - Turbo Nitro [Boost]: +16.0 u/s adicional (Total 28.5 u/s)
  if (car.fuel > 0) {
    let burnRate = 2.0;
    if (controls.boost) {
      burnRate += 16.0;
    } else if (controls.gas || controls.brake) {
      burnRate += 10.5; // Potência integral fornecida ao motor tanto para frente quanto na marcha ré
    }
    const efficiency = Math.max(0.75, 1 - (safeTank - 1) * 0.03);
    car.fuel = Math.max(0, car.fuel - burnRate * efficiency * dt);

    // Aviso sonoro suave quando abaixo de 30%
    if (car.fuel / car.maxFuel < 0.30) {
      soundManager.playLowFuelWarning();
    }
  }

    // Partículas de poeira e escapamento (para frente ou marcha ré com tração ativa)
    if ((car.rearWheel.onGround || car.frontWheel.onGround) && (controls.gas || controls.boost || controls.brake) && Math.random() < 0.7) {
      const activeWheel = controls.brake ? car.frontWheel : car.rearWheel;
      const kickDir = controls.brake ? 1 : -1;
      particles.push({
        x: activeWheel.worldX + (controls.brake ? 8 : -8),
        y: activeWheel.worldY + car.wheelRadius - 3,
        vx: -car.vx * 0.3 + kickDir * (40 + Math.random() * 45),
        vy: -18 - Math.random() * 30,
        size: 5 + Math.random() * 6,
        alpha: 0.85,
        color: controls.boost ? '#38bdf8' : '#a8a29e',
        type: controls.boost ? 'turbo' : 'dust'
      });
    }

  // ==========================================
  // DETECÇÃO INFALÍVEL DE MOEDAS E COMBUSTÍVEL (SWEPT BOUNDING)
  // ==========================================
  const cosA = Math.cos(car.angle);
  const sinA = Math.sin(car.angle);
  const frontBumperX = car.x + 65 * cosA - 10 * sinA;
  const frontBumperY = car.y + 65 * sinA + 10 * cosA;

  pickups.forEach(p => {
    if (p.collected) return;
    // Otimização de alta performance: só calcula colisão com itens próximos (evita queda de FPS em 7000m+)
    if (Math.abs(p.x - car.x) > 220) return;

    // 1. Distância ao centro do chassi
    const distCenter = Math.hypot(car.x - p.x, car.y - p.y);
    // 2. Distância à roda dianteira
    const distFrontWheel = Math.hypot(car.frontWheel.worldX - p.x, car.frontWheel.worldY - p.y);
    // 3. Distância à roda traseira
    const distRearWheel = Math.hypot(car.rearWheel.worldX - p.x, car.rearWheel.worldY - p.y);
    // 4. Distância ao para-choque frontal
    const distBumper = Math.hypot(frontBumperX - p.x, frontBumperY - p.y);
    // 5. Distância ao segmento percorrido entre o frame anterior e atual (anti-teletransporte)
    const distSwept = distToSegment(p.x, p.y, car.prevX, car.prevY, car.x, car.y);

    const isColliding =
      distCenter < 72 ||
      distFrontWheel < 46 ||
      distRearWheel < 46 ||
      distBumper < 50 ||
      distSwept < 65;

    if (isColliding) {
      p.collected = true;

      if (p.type === 'coin') {
        onCoinCollected(p.value ?? 1);
        soundManager.playCoin();

        // Efeito visual de partículas de moeda
        for (let k = 0; k < 6; k++) {
          particles.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 120,
            vy: -40 - Math.random() * 80,
            size: 3 + Math.random() * 4,
            alpha: 1,
            color: '#facc15',
            type: 'coin'
          });
        }
      } else if (p.type === 'fuel') {
        // Recarga de combustível desafiadora (+45% do tanque atual)
        const refillAmount = car.maxFuel * 0.45;
        car.fuel = Math.min(car.maxFuel, car.fuel + refillAmount);
        soundManager.playFuel();
        if (onFuelCollected) onFuelCollected();

        // Partículas verdes/vermelhas de recarga
        for (let k = 0; k < 8; k++) {
          particles.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 140,
            vy: -50 - Math.random() * 90,
            size: 4 + Math.random() * 5,
            alpha: 1,
            color: '#10b981',
            type: 'spark'
          });
        }
      }
    }
  });

  // Checagem de Capotamento (Teto bate no solo)
  const roofX = car.x - 4 * cosA - (-32) * sinA;
  const roofY = car.y - 4 * sinA + (-32) * cosA;
  const roofGroundY = getTerrainY(roofX);

  if (roofY >= roofGroundY - 6 && Math.cos(car.angle) < 0.12) {
    car.upsideDownTimer += dt;
    if (car.upsideDownTimer > 0.65) {
      soundManager.playCrash();
      onGameOver('O veículo capotou na subida! Equilibre o acelerador e freio no ar.');
    }
  } else {
    car.upsideDownTimer = 0;
  }

  // Checagem de Pane Seca (Sem combustível e parado)
  if (car.fuel <= 0 && Math.abs(car.vx) < 12 && Math.abs(car.vy) < 12) {
    soundManager.playCrash();
    onGameOver('Acabou o combustível! Colete os galões vermelhos ou melhore o tanque na oficina.');
  }

  // Atualização das partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.alpha -= dt * 1.5;
    pt.size += dt * 6;
    if (pt.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  // Proteção contra valores inválidos / NaN para garantir que o carro e o placar nunca congelem
  if (!Number.isFinite(car.x) || !Number.isFinite(car.y)) {
    car.x = Number.isFinite(car.prevX) ? car.prevX : 100;
    car.y = Number.isFinite(car.prevY) ? car.prevY : getTerrainY(car.x) - 75;
    car.vx = 0;
    car.vy = 0;
    car.angularVel = 0;
  }
}
