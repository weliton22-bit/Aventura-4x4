import { CarState, StageId } from '../types/game';
import { WeatherState } from '../types/weather';
import { getTerrainY } from './terrain';

/**
 * Módulo de Renderização de Clima Dinâmico (Chuva, Nevoeiro, Tempestade de Areia)
 * Desenvolvido com pools de partículas de alta performance (Zero Garbage Collection)
 */

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

interface LensDroplet {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speedY: number;
  life: number;
}

interface SandParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
}

interface SplashRipple {
  worldX: number;
  worldY: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const RAIN_POOL_SIZE = 120;
const rainPool: RainDrop[] = [];

const LENS_POOL_SIZE = 14;
const lensPool: LensDroplet[] = [];

const SAND_POOL_SIZE = 130;
const sandPool: SandParticle[] = [];

const SPLASH_POOL_SIZE = 25;
const splashPool: SplashRipple[] = [];

let isInitialized = false;

function initPools(width: number, height: number) {
  if (isInitialized) return;
  isInitialized = true;

  for (let i = 0; i < RAIN_POOL_SIZE; i++) {
    rainPool.push({
      x: Math.random() * (width + 400) - 200,
      y: Math.random() * height,
      length: 14 + Math.random() * 20,
      speed: 750 + Math.random() * 350,
      alpha: 0.3 + Math.random() * 0.45
    });
  }

  for (let i = 0; i < LENS_POOL_SIZE; i++) {
    lensPool.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2 + Math.random() * 3.5,
      alpha: Math.random() * 0.7,
      speedY: 4 + Math.random() * 12,
      life: Math.random() * 8
    });
  }

  for (let i = 0; i < SAND_POOL_SIZE; i++) {
    sandPool.push({
      x: Math.random() * (width + 300) - 150,
      y: Math.random() * height,
      size: 1.5 + Math.random() * 3,
      speedX: 500 + Math.random() * 450,
      speedY: 30 + (Math.random() - 0.5) * 80,
      alpha: 0.25 + Math.random() * 0.5
    });
  }

  for (let i = 0; i < SPLASH_POOL_SIZE; i++) {
    splashPool.push({
      worldX: 0,
      worldY: 0,
      radius: 0,
      maxRadius: 8 + Math.random() * 10,
      alpha: 0
    });
  }
}

/**
 * 1. Camada de Fundo do Clima: Ajusta luminosidade e atmosfera de céu e montanhas
 */
export function renderWeatherBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  weather?: WeatherState
) {
  if (!weather || weather.intensity <= 0.02) return;

  const intensity = weather.intensity;

  if (weather.currentType === 'RAIN') {
    // Escurecimento nublado de tempestade
    const stormGrad = ctx.createLinearGradient(0, 0, 0, height);
    stormGrad.addColorStop(0, `rgba(15, 23, 42, ${0.42 * intensity})`);
    stormGrad.addColorStop(0.6, `rgba(30, 41, 59, ${0.28 * intensity})`);
    stormGrad.addColorStop(1, `rgba(15, 23, 42, ${0.15 * intensity})`);
    ctx.fillStyle = stormGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (weather.currentType === 'FOG') {
    // Bruma leitoza que faz o horizonte e montanhas distantes sumirem
    const fogGrad = ctx.createLinearGradient(0, 0, 0, height);
    fogGrad.addColorStop(0, `rgba(203, 213, 225, ${0.38 * intensity})`);
    fogGrad.addColorStop(0.5, `rgba(226, 232, 240, ${0.48 * intensity})`);
    fogGrad.addColorStop(1, `rgba(241, 245, 249, ${0.32 * intensity})`);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (weather.currentType === 'SANDSTORM') {
    // Névoa âmbar de poeira do deserto
    const sandGrad = ctx.createLinearGradient(0, 0, 0, height);
    sandGrad.addColorStop(0, `rgba(217, 119, 6, ${0.35 * intensity})`);
    sandGrad.addColorStop(0.6, `rgba(245, 158, 11, ${0.28 * intensity})`);
    sandGrad.addColorStop(1, `rgba(180, 83, 9, ${0.20 * intensity})`);
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * 2. Respingos no Terreno do Mundo (World Space)
 */
export function renderWorldSplashes(
  ctx: CanvasRenderingContext2D,
  car: CarState,
  weather?: WeatherState
) {
  if (!weather || weather.currentType !== 'RAIN' || weather.intensity <= 0.1) return;

  const dt = 0.016;
  const intensity = weather.intensity;

  // Atualiza ou gera novos respingos onde a chuva toca o solo visível
  for (let i = 0; i < splashPool.length; i++) {
    const sp = splashPool[i];
    if (sp.alpha > 0) {
      sp.radius += 24 * dt;
      sp.alpha -= 2.2 * dt;
      if (sp.alpha > 0) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${sp.alpha * intensity * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(sp.worldX, sp.worldY, sp.radius, sp.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (Math.random() < 0.25 * intensity) {
      // Cria novo respingo próximo ao carro
      const rx = car.x + (Math.random() - 0.4) * 750;
      const ry = getTerrainY(rx);
      sp.worldX = rx;
      sp.worldY = ry - 2;
      sp.radius = 1;
      sp.maxRadius = 6 + Math.random() * 8;
      sp.alpha = 0.75;
    }
  }
}

/**
 * 3. Overlays de Tela (Screen Space): Chuva, Gotas na Lente, Nevoeiro Volumétrico e Tempestade
 */
export function renderWeatherOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  car: CarState,
  weather?: WeatherState,
  stageId: StageId = 'stage_1_green_hills'
) {
  if (!weather || weather.intensity <= 0.02) return;

  initPools(width, height);

  const intensity = weather.intensity;
  const windX = weather.windX || 0.2;
  const dt = 0.016;
  const now = performance.now() * 0.001;

  // Carro na tela (geralmente fixado na proporção 28% largura, 54% altura)
  const carScreenX = width * 0.28;
  const carScreenY = height * 0.54;

  // =========================================================================
  // EFEITO 1: NEVOEIRO VOLUMÉTRICO COM HOLOFOTE DE CLARIDADE NO CARRO
  // =========================================================================
  if (weather.currentType === 'FOG' || (weather.currentType === 'RAIN' && intensity > 0.4)) {
    const fogAlpha = (weather.currentType === 'FOG' ? 0.65 : 0.28) * intensity;

    ctx.save();

    // Paleta de névoa por bioma
    let mistColor1 = 'rgba(226, 232, 240, ';
    let mistColor2 = 'rgba(203, 213, 225, ';
    if (stageId === 'stage_2_pine_forest') {
      mistColor1 = 'rgba(209, 213, 219, ';
      mistColor2 = 'rgba(156, 163, 175, ';
    } else if (stageId === 'stage_3_autumn_valley') {
      mistColor1 = 'rgba(254, 243, 199, ';
      mistColor2 = 'rgba(253, 230, 138, ';
    }

    // 3 Faixas de bruma ondulantes proceduralmente
    for (let layer = 0; layer < 3; layer++) {
      const speed = 0.4 + layer * 0.25;
      const waveFreq = 0.0035 + layer * 0.002;
      const yBase = height * (0.35 + layer * 0.22);
      const amp = 24 + layer * 15;

      ctx.fillStyle = `${mistColor1}${(fogAlpha * (0.25 + layer * 0.15)).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 35) {
        const y = yBase + Math.sin(x * waveFreq + now * speed + layer) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }

    // Holofote de visibilidade radial centrado no carro (Vignette suave)
    // Mantém a visibilidade e jogabilidade perfeita ao redor do veículo
    const clearRadius = Math.max(80, Math.min(width, height) * 0.28);
    const outerRadius = Math.max(width, height) * 0.95;

    const radialFog = ctx.createRadialGradient(
      carScreenX,
      carScreenY,
      clearRadius,
      carScreenX,
      carScreenY,
      outerRadius
    );
    radialFog.addColorStop(0, 'rgba(226, 232, 240, 0)');
    radialFog.addColorStop(0.4, `${mistColor2}${(fogAlpha * 0.35).toFixed(3)})`);
    radialFog.addColorStop(1, `${mistColor2}${(fogAlpha * 0.85).toFixed(3)})`);

    ctx.fillStyle = radialFog;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  // =========================================================================
  // EFEITO 2: CHUVA TORRENCIAL COM GOTAS EM ÂNGULO E LENS DROPLETS
  // =========================================================================
  if (weather.currentType === 'RAIN') {
    ctx.save();

    const activeDrops = Math.floor(RAIN_POOL_SIZE * intensity);
    const slantX = windX * 180;

    ctx.strokeStyle = `rgba(224, 242, 254, ${(0.55 * intensity).toFixed(2)})`;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();

    for (let i = 0; i < activeDrops; i++) {
      const drop = rainPool[i];

      // Movimenta a gota
      drop.y += drop.speed * dt;
      drop.x += slantX * dt;

      // Wrap around da tela
      if (drop.y > height + 40) {
        drop.y = -20 - Math.random() * 30;
        drop.x = Math.random() * (width + 300) - 150;
      }
      if (drop.x > width + 200) drop.x = -100;
      else if (drop.x < -100) drop.x = width + 100;

      // Desenha o risco da gota em alta velocidade
      const tailX = drop.x - (slantX / drop.speed) * drop.length;
      const tailY = drop.y - drop.length;

      ctx.moveTo(tailX, tailY);
      ctx.lineTo(drop.x, drop.y);
    }
    ctx.stroke();

    // Gotas de água escorrendo na lente da câmera (Windshield / Lens Droplets)
    for (let i = 0; i < LENS_POOL_SIZE; i++) {
      const d = lensPool[i];
      d.y += d.speedY * dt;
      d.life += dt;

      if (d.y > height + 20 || d.life > 10) {
        d.y = Math.random() * height * 0.6;
        d.x = Math.random() * width;
        d.radius = 2.0 + Math.random() * 3.5;
        d.alpha = 0.2 + Math.random() * 0.55;
        d.life = 0;
      }

      const dropletAlpha = d.alpha * intensity;
      if (dropletAlpha > 0.05) {
        // Gota arredondada com refração
        ctx.fillStyle = `rgba(255, 255, 255, ${dropletAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ponto de brilho especular
        ctx.fillStyle = `rgba(186, 230, 253, ${(dropletAlpha * 0.8).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(d.x - d.radius * 0.3, d.y - d.radius * 0.3, d.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // EFEITO 3: TEMPESTADE DE AREIA DO DESERTO
  // =========================================================================
  if (weather.currentType === 'SANDSTORM') {
    ctx.save();

    // Haze quente geral
    ctx.fillStyle = `rgba(217, 119, 6, ${(0.24 * intensity).toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);

    const activeParticles = Math.floor(SAND_POOL_SIZE * intensity);

    ctx.fillStyle = '#fef3c7';
    for (let i = 0; i < activeParticles; i++) {
      const p = sandPool[i];
      p.x += p.speedX * dt * windX * 1.3;
      p.y += p.speedY * dt;

      if (p.x > width + 40) {
        p.x = -20;
        p.y = Math.random() * height;
      }
      if (p.y > height + 20) p.y = 0;
      else if (p.y < -20) p.y = height;

      ctx.globalAlpha = p.alpha * intensity;
      ctx.beginPath();
      // Partículas alongadas pelo vento horizontal veloz
      ctx.ellipse(p.x, p.y, p.size * 2.5, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }
}
