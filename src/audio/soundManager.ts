/**
 * Gerenciador de Áudio com Síntese Procedural Realista de Motor (Web Audio API)
 * Inclui síntese multi-oscilador (pistões + sub-grave + saturação harmônica de escape),
 * modulação contínua de RPM sob acelerador e turbo, som de pneu cantando e espirro de turbo (blow-off).
 */

import { VehicleId } from '../types/game';

function makeDistortionCurve(amount: number = 18): Float32Array {
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Motor em loop (Pistões primários + Sub-grave + Saturação harmônica)
  private primaryOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private isEngineRunning: boolean = false;

  // Assobio contínuo de turbocompressor
  private turboOsc: OscillatorNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;
  private turboGain: GainNode | null = null;
  private wasBoostActive: boolean = false;

  // Alerta de combustível
  private lastFuelWarningTime: number = 0;

  constructor() {
    try {
      const savedMute = localStorage.getItem('hillclimb_muted');
      this.isMuted = savedMute === 'true';
    } catch {
      this.isMuted = false;
    }

    // Desbloqueia contexto de áudio em qualquer interação do usuário até estar 'running'
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (!this.ctx || this.ctx.state === 'suspended') {
          this.init();
        }
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
    }
  }

  public init() {
    try {
      if (!this.ctx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtxClass) return;
        this.ctx = new AudioCtxClass();
        this.isInitialized = true;
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Ignora falhas se Web Audio não for suportado
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('hillclimb_muted', this.isMuted ? 'true' : 'false');
    } catch {
      // Ignora erro
    }

    if (this.isMuted) {
      this.stopEngine();
    } else {
      this.init();
      this.startEngine();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Inicia o motor sonoro com camadas ricas de combustão e escape
  public startEngine() {
    if (this.isMuted) return;

    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      if (this.isEngineRunning && this.primaryOsc && this.subOsc && this.engineGain) {
        return;
      }

      const t = this.ctx.currentTime;

      // 1. Oscilador Primário (Dentes de serra para o disparo dos cilindros)
      this.primaryOsc = this.ctx.createOscillator();
      this.primaryOsc.type = 'sawtooth';
      this.primaryOsc.frequency.setValueAtTime(45, t);

      // 2. Oscilador Sub-grave (Onda triangular para o peso e vibração do motor)
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'triangle';
      this.subOsc.frequency.setValueAtTime(24, t);

      // 3. Saturação / Distorção harmônica suave para som encorpado de escape real
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = makeDistortionCurve(16) as Float32Array<ArrayBuffer>;
      this.distortionNode.oversample = '2x';

      // 4. Filtro passa-baixa dinâmico (começa em marcha lenta suave e abre ao acelerar)
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(240, t);
      this.engineFilter.Q.setValueAtTime(2.2, t);

      // 5. Controle Master de Volume do Motor (marcha lenta suave por padrão)
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.06, t);

      // Conexões do motor
      this.primaryOsc.connect(this.distortionNode);
      this.subOsc.connect(this.distortionNode);
      this.distortionNode.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.primaryOsc.start(t);
      this.subOsc.start(t);

      // 6. Canal de Turbocompressor (assobio agudo de rotação da turbina)
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(700, t);

      this.turboFilter = this.ctx.createBiquadFilter();
      this.turboFilter.type = 'bandpass';
      this.turboFilter.frequency.setValueAtTime(950, t);
      this.turboFilter.Q.setValueAtTime(4, t);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0, t);

      this.turboOsc.connect(this.turboFilter);
      this.turboFilter.connect(this.turboGain);
      this.turboGain.connect(this.ctx.destination);
      this.turboOsc.start(t);

      this.isEngineRunning = true;
    } catch {
      this.isEngineRunning = false;
    }
  }

  // Atualiza RPM do motor com resposta imediata e automática ao acelerar
  public updateEngine(
    speedKmh: number,
    isAccelerating: boolean,
    isBraking: boolean,
    isBoost: boolean,
    vehicleId: VehicleId = 'red_speedster'
  ) {
    if (this.isMuted) return;

    // Se o motor ainda não estiver tocando, inicia automaticamente sem precisar do botão de som
    if (!this.isEngineRunning || !this.primaryOsc || !this.subOsc || !this.engineFilter || !this.engineGain || !this.ctx) {
      this.startEngine();
      if (!this.isEngineRunning || !this.primaryOsc || !this.subOsc || !this.engineFilter || !this.engineGain || !this.ctx) {
        return;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;

    // Afinação sonora por veículo:
    // - Red Speedster: Alto giro, esportivo e elástico
    // - Orc War Rig: Diesel pesado, graves profundos e batidas lentas
    // - Monster Truck: V8 encorpado e potente
    let baseIdleFreq = 46;
    let rpmClimbFactor = 1.6;
    let throttleBoost = 52;
    let maxFreq = 270;

    if (vehicleId === 'orc_war_rig') {
      baseIdleFreq = 34;
      rpmClimbFactor = 1.15;
      throttleBoost = 40;
      maxFreq = 190;
    } else if (vehicleId === 'monster_truck') {
      baseIdleFreq = 40;
      rpmClimbFactor = 1.35;
      throttleBoost = 48;
      maxFreq = 230;
    }

    // Frequência base de rotação conforme velocidade do carro
    let targetFreq = baseIdleFreq + Math.min(speedKmh * rpmClimbFactor, 140);

    // Resposta imediata e automática de giro ao pisar no acelerador
    if (isAccelerating) {
      targetFreq += throttleBoost;
    }
    if (isBoost) {
      targetFreq += 75;
    }
    if (isBraking) {
      targetFreq = Math.max(baseIdleFreq - 6, targetFreq - 22);
    }

    targetFreq = Math.min(maxFreq, Math.max(26, targetFreq));

    // Ajusta o disparo primário e o sub-grave (1 oitava abaixo)
    this.primaryOsc.frequency.setTargetAtTime(targetFreq, t, 0.05);
    this.subOsc.frequency.setTargetAtTime(targetFreq * 0.5, t, 0.05);

    // O filtro abre instantaneamente ao acelerar, liberando a respiração e estalo do motor
    let filterFreq = targetFreq * 2.2;
    if (isAccelerating) {
      filterFreq = targetFreq * 3.8 + 220; // Aberto, rugindo forte com o pé no acelerador
    }
    if (isBoost) {
      filterFreq = targetFreq * 4.6 + 450;
    }
    this.engineFilter.frequency.setTargetAtTime(Math.min(1300, filterFreq), t, 0.05);

    // Volume do motor dinâmico: discreto na lenta / parado (0.055)
    // e encorpado e potente automaticamente ao acelerar (0.18 a 0.24)
    let targetGain = 0.055;
    if (speedKmh > 6) {
      targetGain = 0.08 + Math.min(speedKmh * 0.001, 0.05);
    }
    if (isAccelerating) {
      targetGain = isBoost ? 0.24 : 0.18; // Ronco encorpado imediato
    } else if (isBoost) {
      targetGain = 0.22;
    }
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.06);

    // Controle do assobio da turbina
    if (this.turboGain && this.turboOsc && this.turboFilter) {
      if (isBoost) {
        const turboFreq = 850 + Math.min(speedKmh * 10, 600);
        this.turboOsc.frequency.setTargetAtTime(turboFreq, t, 0.05);
        this.turboFilter.frequency.setTargetAtTime(turboFreq, t, 0.05);
        this.turboGain.gain.setTargetAtTime(0.09, t, 0.06);
      } else {
        this.turboGain.gain.setTargetAtTime(0, t, 0.12);
        // Espirro de válvula de alívio (Blow-off) ao soltar o nitro!
        if (this.wasBoostActive) {
          this.playBlowOff();
        }
      }
      this.wasBoostActive = isBoost;
    }
  }

  // Espirro de Válvula de Turbo (Blow-off valve "tssschhh!")
  private playBlowOff() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Ignora erro
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.primaryOsc) {
        this.primaryOsc.stop();
        this.primaryOsc.disconnect();
        this.primaryOsc = null;
      }
      if (this.subOsc) {
        this.subOsc.stop();
        this.subOsc.disconnect();
        this.subOsc = null;
      }
      if (this.turboOsc) {
        this.turboOsc.stop();
        this.turboOsc.disconnect();
        this.turboOsc = null;
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
        this.engineGain = null;
      }
      if (this.turboGain) {
        this.turboGain.disconnect();
        this.turboGain = null;
      }
    } catch {
      // Ignora erro de encerramento
    }
    this.isEngineRunning = false;
  }

  // Efeito de Moeda Coletada (Tilintar harmônico cristalino)
  public playCoin() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(1174, now); // D6
      osc2.frequency.setValueAtTime(1760, now + 0.06); // A6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.28);
    } catch {
      // Ignora erro de áudio
    }
  }

  // Efeito de Gasolina Coletada (Arpeggio ascendente gratificante)
  public playFuel() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const duration = 0.07;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = now + idx * duration;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.2, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration * 1.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration * 1.5);
      });
    } catch {
      // Ignora erro
    }
  }

  // Efeito de Turbo / Nitro
  public playTurboBurst() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignora erro
    }
  }

  // Efeito de Alerta de Combustível Baixo
  public playLowFuelWarning() {
    if (this.isMuted || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastFuelWarningTime < 1800) return; // Evita repetição excessiva
    this.lastFuelWarningTime = now;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(330, t + 0.1);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Ignora erro
    }
  }

  // Efeito de Batida / Capotamento
  public playCrash() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Ignora erro
    }
  }

  // Som de Compra de Upgrade na Oficina
  public playUpgrade() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignora erro
    }
  }
}

export const soundManager = new SoundManager();
