import { CarState, Particle, Pickup, WheelState, StageId } from '../types/game';
import { getBiomeForStage, getTerrainY } from './terrain';
import { VEHICLES } from '../config/vehicles';
import { getImage } from './assetLoader';

/**
 * Renderizador de Mundo 2D em Canvas HTML5
 */

// Sprites de Decoração por Bioma
const BIOME_DECORATIONS: Record<string, { src: string; width: number; height: number; offsetY?: number }[]> = {
  GREEN_HILLS: [
    { src: '/assets/aistudio/tree_1aaf2cb3.png', width: 65, height: 85 },
    { src: '/assets/aistudio/treeSmall_green1_2224591d.png', width: 45, height: 62 },
    { src: '/assets/aistudio/bush1_e14d775d.png', width: 44, height: 26 },
    { src: '/assets/aistudio/bush2_35c22084.png', width: 46, height: 28 }
  ],
  PINE_FOREST: [
    { src: '/assets/aistudio/treePine_a7314ced.png', width: 55, height: 95 },
    { src: '/assets/aistudio/treePineSnow_c7a6593f.png', width: 55, height: 95 },
    { src: '/assets/aistudio/fence_74a4fd03.png', width: 48, height: 32 }
  ],
  AUTUMN_VALLEY: [
    { src: '/assets/aistudio/treeOrange_d0c1bf45.png', width: 68, height: 90 },
    { src: '/assets/aistudio/treePineOrange_22e1170b.png', width: 55, height: 95 },
    { src: '/assets/aistudio/bushOrange1_23288293.png', width: 44, height: 26 },
    { src: '/assets/aistudio/bushOrange2_1e372f9d.png', width: 48, height: 28 }
  ],
  DESERT_PYRAMIDS: [
    { src: '/assets/aistudio/pyramid_3a3061b2.png', width: 140, height: 110, offsetY: 12 },
    { src: '/assets/aistudio/pyramidMayan_2e35b70d.png', width: 130, height: 100, offsetY: 10 },
    { src: '/assets/aistudio/cactus1_43a58b9f.png', width: 34, height: 60 },
    { src: '/assets/aistudio/cactus2_3d81fa30.png', width: 38, height: 65 },
    { src: '/assets/aistudio/cactus3_628b26ea.png', width: 32, height: 55 },
    { src: '/assets/aistudio/treePalm_879b25be.png', width: 62, height: 95 }
  ]
};

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  car: CarState,
  pickups: Pickup[],
  particles: Particle[],
  isBoostActive: boolean,
  stageId: StageId = 'stage_1_green_hills'
) {
  // Limpa o canvas
  ctx.clearRect(0, 0, width, height);

  // O bioma agora respeita 100% o cenário selecionado pelo jogador
  const biome = getBiomeForStage(stageId);
  const now = performance.now() * 0.003;

  // 1. Céu com gradiente dinâmico do bioma
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, biome.skyColors[0]);
  skyGrad.addColorStop(0.55, biome.skyColors[1]);
  skyGrad.addColorStop(1, biome.skyColors[2]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Sol Dourado
  const sunImg = getImage('/assets/aistudio/sun_81a02dcd.png');
  const sunX = width * 0.82;
  const sunY = 55;
  if (sunImg) {
    ctx.drawImage(sunImg, sunX - 35, sunY - 35, 70, 70);
  } else {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Nuvens de Paralaxe Flutuantes
  const cloudSprites = [
    '/assets/aistudio/cloud1_6b2120c1.png',
    '/assets/aistudio/cloud2_cdb2c2e1.png',
    '/assets/aistudio/cloud3_3482086e.png'
  ];
  for (let c = 0; c < 5; c++) {
    const cloudImg = getImage(cloudSprites[c % cloudSprites.length]);
    const speed = 0.04 + c * 0.015;
    const cx = ((c * 240 + now * 18 - car.x * speed) % (width + 300) + width + 300) % (width + 300) - 150;
    const cy = 40 + (c * 34) % 110;
    const cWidth = 90 + (c % 3) * 25;
    const cHeight = cWidth * 0.55;

    if (cloudImg) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(cloudImg, cx, cy, cWidth, cHeight);
      ctx.globalAlpha = 1.0;
    }
  }

  // 4. Camada 1 de Montanhas distantes (Paralaxe Lento)
  const farMountainImg = getImage(
    biome.id === 'DESERT_PYRAMIDS'
      ? '/assets/aistudio/mountainB_e970ee01.png'
      : (biome.id === 'PINE_FOREST' ? '/assets/aistudio/mountainA_9721f091.png' : '/assets/aistudio/mountains_33e78798.png')
  );

  if (farMountainImg) {
    const tileW = 320;
    const offset = (-car.x * 0.06) % tileW;
    const startTile = -tileW + offset;
    for (let tx = startTile; tx < width + tileW; tx += tileW) {
      ctx.globalAlpha = 0.45;
      ctx.drawImage(farMountainImg, tx, height * 0.44, tileW, height * 0.42);
      ctx.globalAlpha = 1.0;
    }
  } else {
    ctx.fillStyle = biome.mountainColorFar;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let sx = 0; sx <= width; sx += 40) {
      const wx = sx + car.x * 0.08;
      const my = height * 0.62 - Math.sin(wx * 0.0018) * 110 - Math.cos(wx * 0.004) * 50;
      ctx.lineTo(sx, my);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }

  // 5. Camada 2 de Colinas intermediárias
  const nearHillsImg = getImage(
    biome.id === 'DESERT_PYRAMIDS'
      ? '/assets/aistudio/hillsLarge_25777502.png'
      : (biome.id === 'PINE_FOREST' ? '/assets/aistudio/mountainB_e970ee01.png' : '/assets/aistudio/hills_3ab7cec6.png')
  );

  if (nearHillsImg) {
    const tileW = 280;
    const offset = (-car.x * 0.14) % tileW;
    const startTile = -tileW + offset;
    for (let tx = startTile; tx < width + tileW; tx += tileW) {
      ctx.globalAlpha = 0.65;
      ctx.drawImage(nearHillsImg, tx, height * 0.52, tileW, height * 0.38);
      ctx.globalAlpha = 1.0;
    }
  } else {
    ctx.fillStyle = biome.mountainColorNear;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let sx = 0; sx <= width; sx += 30) {
      const wx = sx + car.x * 0.18;
      const my = height * 0.68 - Math.sin(wx * 0.0035 + 1.2) * 85 - Math.cos(wx * 0.007) * 35;
      ctx.lineTo(sx, my);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }

  // 6. Configuração da Câmera (Segue o carro e antecipa a rampa à frente)
  const camX = car.x - width * 0.28;
  const camY = car.y - height * 0.54;

  ctx.save();
  ctx.translate(-camX, -camY);

  const startX = Math.floor(camX / 14) * 14 - 40;
  const endX = camX + width + 60;

  // 7. Elementos de Fundo no Terreno (Árvores, Pirâmides, Cactos e Vegetação antes do corte do solo)
  const propSpacing = 170;
  const firstProp = Math.floor(startX / propSpacing) * propSpacing;
  for (let px = firstProp; px <= endX + 80; px += propSpacing) {
    if (px < 160) continue;
    const py = getTerrainY(px);
    const list = BIOME_DECORATIONS[biome.id] || BIOME_DECORATIONS.GREEN_HILLS;
    // Seleção determinística baseada na coordenada X
    const seed = Math.abs(Math.floor(px * 13.37));
    const item = list[seed % list.length];
    const sprite = getImage(item.src);

    if (sprite) {
      const drawX = px - item.width * 0.5;
      const drawY = py - item.height + (item.offsetY || 4);
      ctx.drawImage(sprite, drawX, drawY, item.width, item.height);
    }
  }

  // 8. Preenchimento Subterrâneo do Terreno
  ctx.beginPath();
  ctx.moveTo(startX, camY + height + 300);
  for (let x = startX; x <= endX; x += 12) {
    ctx.lineTo(x, getTerrainY(x));
  }
  ctx.lineTo(endX, camY + height + 300);
  ctx.closePath();

  const groundGrad = ctx.createLinearGradient(0, camY, 0, camY + height);
  groundGrad.addColorStop(0, biome.groundBaseColor);
  groundGrad.addColorStop(0.4, biome.groundSubColor);
  groundGrad.addColorStop(1, '#050505');
  ctx.fillStyle = groundGrad;
  ctx.fill();

  // 9. Camada Superior da Pista (Específica do Bioma)
  ctx.beginPath();
  for (let x = startX; x <= endX; x += 10) {
    const y = getTerrainY(x);
    if (x === startX) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 14;
  ctx.strokeStyle = biome.trackColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Borda superior iluminada
  ctx.lineWidth = 4;
  ctx.strokeStyle = biome.trackBorderColor;
  ctx.stroke();

  // 10. Pórtico de Largada Oficial aos 0 Metros (sx = 100)
  if (startX <= 220 && endX >= 60) {
    const lx = 100;
    const ly = getTerrainY(lx);

    ctx.save();
    // Linha zebrada de largada no asfalto / terreno
    for (let c = -20; c <= 20; c += 8) {
      ctx.fillStyle = (Math.floor(c / 8) % 2 === 0) ? '#ffffff' : '#0f172a';
      ctx.fillRect(lx + c, ly - 4, 8, 8);
    }

    // Postes laterais do pórtico
    ctx.fillStyle = '#334155';
    ctx.fillRect(lx - 28, ly - 95, 6, 95);
    ctx.fillRect(lx + 28, ly - 95, 6, 95);

    // Faixa Superior do Pórtico
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(lx - 55, ly - 116, 110, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁 LARGADA - 0 METROS 🏁', lx, ly - 103);
    ctx.restore();
  }

  // 10.1 Placas de Metros ao longo da subida a cada 100m (1000px):
  // 100m, 200m, 300m, 400m, etc.
  const signInterval = 1000; // 1000px = 100 metros
  const firstSignStep = Math.max(1, Math.floor((startX - 100) / signInterval));
  const firstSignX = 100 + firstSignStep * signInterval;

  for (let sx = firstSignX; sx <= endX; sx += signInterval) {
    if (sx < 100) continue;
    const sy = getTerrainY(sx);
    const meters = Math.round((sx - 100) / 10);
    const signBiome = biome;

    // Haste metálica
    ctx.fillStyle = '#64748b';
    ctx.fillRect(sx - 3, sy - 54, 6, 54);

    // Placa arredondada temática
    ctx.fillStyle = signBiome.signBgColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(sx - 40, sy - 84, 80, 30, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = signBiome.signTextColor;
    ctx.font = 'bold 12px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${meters}m ${signBiome.signIcon}`, sx, sy - 69);
  }

  // 11. Moedas e Galões de Combustível
  pickups.forEach(p => {
    if (p.collected || p.x < startX - 40 || p.x > endX + 40) return;

    if (p.type === 'coin') {
      const floatOffset = Math.sin(now + p.x * 0.02) * 4;
      ctx.save();
      ctx.translate(p.x, p.y + floatOffset);

      // Efeito de giro visual na moeda (largura oscilante)
      const scaleX = Math.cos(now * 1.5 + p.x);
      ctx.scale(Math.abs(scaleX) * 0.6 + 0.4, 1);

      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#854d0e';
      ctx.font = 'bold 12px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0.5);

      ctx.restore();
    } else if (p.type === 'fuel') {
      const floatOffset = Math.sin(now + p.x * 0.03) * 5;
      ctx.save();
      ctx.translate(p.x, p.y + floatOffset);

      // Galão vermelho estilizado
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-14, -18, 28, 34, 5);
      ctx.fill();
      ctx.stroke();

      // Alça do galão
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-7, -14, 14, 5);

      // Tampa
      ctx.fillStyle = '#facc15';
      ctx.fillRect(4, -22, 6, 5);

      // Texto
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAS', 0, 6);

      ctx.restore();
    }
  });

  // 12. Partículas
  particles.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.alpha);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, Math.max(1, pt.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 13. Desenha o Carro com Sistema de Amortecimento e Sprites Reais
  drawVehicle(ctx, car, isBoostActive);

  ctx.restore();
}

function drawSpringAndShock(
  ctx: CanvasRenderingContext2D,
  mountX: number,
  mountY: number,
  wheelX: number,
  wheelY: number,
  compressionRatio: number
) {
  const dx = wheelX - mountX;
  const dy = wheelY - mountY;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(mountX, mountY);
  ctx.rotate(angle);

  // Pistão Hidráulico (Cilindro superior e haste cromada)
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, -5, dist * 0.52, 10);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(dist * 0.35, -2.5, dist * 0.65, 5);

  // Mola Helicoidal externa (Muda de cor com a compressão)
  let springColor = '#38bdf8'; // Ciano normal
  if (compressionRatio > 0.72) springColor = '#ef4444'; // Vermelho sob carga
  else if (compressionRatio > 0.38) springColor = '#f59e0b'; // Âmbar moderado

  ctx.strokeStyle = springColor;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const coils = 6;
  const coilWidth = 9;
  const startOffset = 6;
  const endOffset = dist - 6;
  const activeLen = Math.max(8, endOffset - startOffset);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(startOffset, 0);

  for (let i = 0; i <= coils * 2; i++) {
    const progress = i / (coils * 2);
    const xPos = startOffset + progress * activeLen;
    const yOffset = i % 2 === 0 ? -coilWidth : coilWidth;
    ctx.lineTo(xPos, yOffset);
  }

  ctx.lineTo(dist, 0);
  ctx.stroke();

  // Pinos de ancoragem
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.arc(dist, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  wheel: WheelState,
  radius: number,
  wheelImageSrc?: string
) {
  ctx.save();
  ctx.translate(wheel.worldX, wheel.worldY);
  ctx.rotate(wheel.spinAngle);

  const wheelImg = wheelImageSrc ? getImage(wheelImageSrc) : null;
  if (wheelImg && wheelImg.complete && wheelImg.naturalWidth > 0) {
    const d = radius * 2;
    ctx.drawImage(wheelImg, -radius, -radius, d, d);
  } else {
    // Pneu Off-Road de alta aderência (fallback procedural)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cravos externos do pneu (Treads)
    const numTreads = 10;
    ctx.fillStyle = '#334155';
    for (let i = 0; i < numTreads; i++) {
      const a = (i / numTreads) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillRect(radius - 3, -3, 5, 6);
      ctx.restore();
    }

    // Roda esportiva metálica
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
    ctx.fill();

    // Raios da roda
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * radius * 0.54, Math.sin(a) * radius * 0.54);
      ctx.stroke();
    }

    // Cubo central vermelho anodizado
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawVehicle(ctx: CanvasRenderingContext2D, car: CarState, isBoostActive: boolean) {
  const vDef = VEHICLES[car.vehicleId] || VEHICLES.red_speedster;
  const cosA = Math.cos(car.angle);
  const sinA = Math.sin(car.angle);

  // Pontos de ancoragem superior dos amortecedores no chassi
  const rearMountX = car.x + car.rearWheel.offsetX * cosA - car.rearWheel.offsetY * sinA;
  const rearMountY = car.y + car.rearWheel.offsetX * sinA + car.rearWheel.offsetY * cosA;

  const frontMountX = car.x + car.frontWheel.offsetX * cosA - car.frontWheel.offsetY * sinA;
  const frontMountY = car.y + car.frontWheel.offsetX * sinA + car.frontWheel.offsetY * cosA;

  // Braços oscilantes da suspensão (Trailing arms metálicos)
  const centerChassisX = car.x - 10 * sinA;
  const centerChassisY = car.y + 10 * cosA;
  ctx.strokeStyle = car.vehicleId === 'orc_war_rig' ? '#451a03' : '#64748b';
  ctx.lineWidth = car.vehicleId === 'orc_war_rig' ? 7 : 5;
  ctx.beginPath();
  ctx.moveTo(centerChassisX, centerChassisY);
  ctx.lineTo(car.rearWheel.worldX, car.rearWheel.worldY);
  ctx.moveTo(centerChassisX, centerChassisY);
  ctx.lineTo(car.frontWheel.worldX, car.frontWheel.worldY);
  ctx.stroke();

  // Desenha os dois amortecedores telescópicos
  drawSpringAndShock(
    ctx,
    rearMountX,
    rearMountY,
    car.rearWheel.worldX,
    car.rearWheel.worldY,
    car.rearWheel.compressionRatio
  );
  drawSpringAndShock(
    ctx,
    frontMountX,
    frontMountY,
    car.frontWheel.worldX,
    car.frontWheel.worldY,
    car.frontWheel.compressionRatio
  );

  // Desenha Chassi e Cabine
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  // Fogo do Turbo no escapamento
  if (isBoostActive && car.fuel > 0) {
    const exhaustX = -vDef.bodyWidth * 0.46;
    const exhaustY = vDef.bodyOffsetY + vDef.bodyHeight * 0.3;

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(exhaustX, exhaustY - 5);
    ctx.lineTo(exhaustX - 35 - Math.random() * 25, exhaustY);
    ctx.lineTo(exhaustX, exhaustY + 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(exhaustX, exhaustY - 3);
    ctx.lineTo(exhaustX - 20 - Math.random() * 15, exhaustY);
    ctx.lineTo(exhaustX, exhaustY + 3);
    ctx.closePath();
    ctx.fill();
  }

  // Dinâmica de balanço do piloto (G-Force & solavancos)
  const headSwayAngle = Math.max(-0.35, Math.min(0.35, -car.angularVel * 0.08 - (car.vx * 0.0003)));
  const headBounceY = Math.sin(performance.now() * 0.015) * Math.min(2.5, Math.abs(car.vx) * 0.04);

  const headImg = vDef.headImage ? getImage(vDef.headImage) : null;
  const bodyImg = vDef.bodyImage ? getImage(vDef.bodyImage) : null;

  // 1. Piloto (desenhado na cabine)
  if (headImg && headImg.complete && headImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(vDef.headOffsetX, vDef.headOffsetY + headBounceY);
    ctx.rotate(headSwayAngle);
    ctx.drawImage(
      headImg,
      -vDef.headWidth / 2,
      -vDef.headHeight / 2,
      vDef.headWidth,
      vDef.headHeight
    );
    ctx.restore();
  } else {
    // Fallback capacete se imagem ainda não carregou
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(vDef.headOffsetX, vDef.headOffsetY + headBounceY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(vDef.headOffsetX + 2, vDef.headOffsetY + headBounceY - 4, 7, 5);
  }

  // 2. Chassi / Carroceria
  if (bodyImg && bodyImg.complete && bodyImg.naturalWidth > 0) {
    ctx.drawImage(
      bodyImg,
      -vDef.bodyWidth / 2,
      -vDef.bodyHeight / 2 + vDef.bodyOffsetY,
      vDef.bodyWidth,
      vDef.bodyHeight
    );
  } else {
    // Fallback carroceria
    const bodyGrad = ctx.createLinearGradient(-60, -15, 60, 20);
    bodyGrad.addColorStop(0, '#ef4444');
    bodyGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-vDef.bodyWidth / 2, -15, vDef.bodyWidth, 30, 8);
    ctx.fill();
  }

  ctx.restore();

  // 3. Rodas com textura do veículo
  drawWheel(ctx, car.rearWheel, car.wheelRadius, vDef.wheelRearImage);
  drawWheel(ctx, car.frontWheel, car.wheelRadius, vDef.wheelFrontImage);
}
