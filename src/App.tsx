/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Upgrades, SuspensionConfig, CarState, Pickup, Particle, VehicleId, StageId, VehicleUpgrades } from './types/game';
import { getBiome, getTerrainY } from './physics/terrain';
import { createInitialCar, stepPhysics, KeyControls } from './physics/engine';
import { renderWorld } from './physics/renderer';
import { soundManager } from './audio/soundManager';
import { VEHICLES } from './config/vehicles';
import { STAGES } from './config/stages';
import { preloadAllVehicleAssets } from './physics/assetLoader';
import { HUD, TelemetryData } from './components/HUD';
import { Pedals } from './components/Pedals';
import { GarageScreen } from './components/GarageScreen';
import { StagesScreen } from './components/StagesScreen';
import { CreditsScreen } from './components/CreditsScreen';
import { GameOverModal } from './components/GameOverModal';
import { TitleScreen } from './components/TitleScreen';
import { getCheckpointForDistance, LEVEL_CHECKPOINTS } from './config/checkpoints';
import { LevelCelebration, LevelCelebrationData } from './components/LevelCelebration';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { loadDailyMissions, recordMissionProgress, countUnclaimedMissions } from './utils/missionsManager';
import { DailyMission } from './types/missions';
import { Target } from 'lucide-react';
import { WeatherState } from './types/weather';
import { createInitialWeather, stepWeather } from './config/weather';

const DEFAULT_VEHICLE_UPGRADES: VehicleUpgrades = {
  red_speedster: { engine: 1, tires: 1, suspension: 1, fuelTank: 1 },
  orc_war_rig: { engine: 1, tires: 1, suspension: 1, fuelTank: 1 },
  monster_truck: { engine: 1, tires: 1, suspension: 1, fuelTank: 1 }
};

const DEFAULT_SUSPENSION: SuspensionConfig = {
  stiffness: 240,
  damping: 13,
  restLength: 52,
  maxCompression: 36,
  maxExtension: 22
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cenários Desbloqueados (Cenário 1 desbloqueado por padrão, 2 por 150, 3 por 300, 4 por 600 moedas)
  const [unlockedStages, setUnlockedStages] = useState<StageId[]>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_unlocked_stages_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.includes('stage_1_green_hills')) {
          return parsed as StageId[];
        }
      }
      return ['stage_1_green_hills'];
    } catch {
      return ['stage_1_green_hills'];
    }
  });

  const [selectedStageId, setSelectedStageId] = useState<StageId>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_selected_stage_v2') as StageId;
      if (saved && STAGES[saved]) {
        return saved;
      }
      return 'stage_1_green_hills';
    } catch {
      return 'stage_1_green_hills';
    }
  });

  // Veículo Selecionado & Veículos Desbloqueados (Carro 1 grátis, 2 por 300 e 3 por 600)
  const [unlockedVehicles, setUnlockedVehicles] = useState<VehicleId[]>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_unlocked_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.includes('red_speedster')) {
          return parsed as VehicleId[];
        }
      }
      return ['red_speedster'];
    } catch {
      return ['red_speedster'];
    }
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<VehicleId>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_vehicle') as VehicleId;
      if (saved && VEHICLES[saved]) {
        return saved;
      }
      return 'red_speedster';
    } catch {
      return 'red_speedster';
    }
  });

  // Melhorias de Nível INDIVIDUAIS POR CARRO (Carro 1, 2 e 3 possuem oficinas e níveis separados!)
  const [vehicleUpgrades, setVehicleUpgrades] = useState<VehicleUpgrades>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_vehicle_upgrades_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const sanitize = (u: any, def: Upgrades): Upgrades => ({
            engine: Number.isFinite(u?.engine) ? Math.max(1, Math.floor(u.engine)) : def.engine,
            tires: Number.isFinite(u?.tires) ? Math.max(1, Math.floor(u.tires)) : def.tires,
            suspension: Number.isFinite(u?.suspension) ? Math.max(1, Math.floor(u.suspension)) : def.suspension,
            fuelTank: Number.isFinite(u?.fuelTank) ? Math.max(1, Math.floor(u.fuelTank)) : def.fuelTank
          });
          return {
            red_speedster: sanitize(parsed.red_speedster, DEFAULT_VEHICLE_UPGRADES.red_speedster),
            orc_war_rig: sanitize(parsed.orc_war_rig, DEFAULT_VEHICLE_UPGRADES.orc_war_rig),
            monster_truck: sanitize(parsed.monster_truck, DEFAULT_VEHICLE_UPGRADES.monster_truck)
          };
        }
      }
      return DEFAULT_VEHICLE_UPGRADES;
    } catch {
      return DEFAULT_VEHICLE_UPGRADES;
    }
  });

  const [totalCoins, setTotalCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_total_coins');
      if (!saved) return 0;
      const parsed = parseInt(saved, 10);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    } catch {
      return 0;
    }
  });

  const [bestDistance, setBestDistance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_best_dist');
      if (!saved) return 0;
      const parsed = parseInt(saved, 10);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    } catch {
      return 0;
    }
  });

  const [suspension, setSuspension] = useState<SuspensionConfig>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_suspension_cfg');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.stiffness === 'number') {
          return { ...DEFAULT_SUSPENSION, ...parsed };
        }
      }
    } catch {
      // Ignora erro
    }
    return DEFAULT_SUSPENSION;
  });

  // Estado da Navegação entre Telas
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());
  const [biomeToast, setBiomeToast] = useState<string | null>(null);
  const [levelCelebration, setLevelCelebration] = useState<LevelCelebrationData | null>(null);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [unclaimedMissionsCount, setUnclaimedMissionsCount] = useState<number>(() =>
    countUnclaimedMissions(loadDailyMissions())
  );
  const [missionToast, setMissionToast] = useState<{ title: string; rewardCoins: number } | null>(null);
  const fuelCansCollectedRef = useRef<number>(0);
  const lastStage2DistanceRef = useRef<number>(0);
  const airTimeAccumulatorRef = useRef<number>(0);

  // Sistema de Clima Dinâmico por Cenário e Bioma
  const weatherRef = useRef<WeatherState>(createInitialWeather(selectedStageId));
  const [currentWeather, setCurrentWeather] = useState<WeatherState>(() => weatherRef.current);

  // Métricas do HUD (atualizadas em taxa moderada para performance)
  const [hudData, setHudData] = useState({
    distance: 0,
    speedKmh: 0,
    slopeDeg: 0,
    runCoins: 0,
    fuel: 100,
    maxFuel: 100,
    gameOverReason: ''
  });

  // Controles
  const controlsRef = useRef<KeyControls>({
    gas: false,
    brake: false,
    boost: false
  });
  const [activeControls, setActiveControls] = useState<KeyControls>({
    gas: false,
    brake: false,
    boost: false
  });

  // Estado da simulação (isolado para 60fps sem render reentrante de React)
  const carRef = useRef<CarState>(
    createInitialCar(
      vehicleUpgrades[selectedVehicleId] || DEFAULT_VEHICLE_UPGRADES.red_speedster,
      suspension,
      selectedVehicleId
    )
  );
  const pickupsRef = useRef<Pickup[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastGeneratedXRef = useRef<number>(300);
  const nextFuelXRef = useRef<number>(1950);
  const lastKmMarkRef = useRef<number>(0);
  const lastCompletedLevelRef = useRef<number>(0);
  const runCoinsRef = useRef<number>(0);
  const totalCoinsRef = useRef<number>(totalCoins);
  const distanceRef = useRef<number>(0);
  const telemetryRef = useRef<TelemetryData>({
    distance: 0,
    speedKmh: 0,
    slopeDeg: 0,
    runCoins: 0,
    totalCoins: totalCoins,
    fuel: 100,
    maxFuel: 100,
    isAirborne: false,
    currentLevel: 1,
    targetMeters: 200,
    prevTargetMeters: 0,
    levelProgressPct: 0
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const nextPickupIdRef = useRef<number>(1);
  const hudFrameCountRef = useRef<number>(0);

  // Pré-carregamento imediato de todos os sprites dos veículos
  useEffect(() => {
    preloadAllVehicleAssets();
  }, []);

  // Sincroniza salvamento de cenários, veículos, moedas e melhorias individuais
  useEffect(() => {
    try {
      localStorage.setItem('hillclimb_selected_stage_v2', selectedStageId);
    } catch {
      // Ignora erro
    }
  }, [selectedStageId]);

  useEffect(() => {
    try {
      localStorage.setItem('hillclimb_unlocked_stages_v2', JSON.stringify(unlockedStages));
    } catch {
      // Ignora erro
    }
  }, [unlockedStages]);

  useEffect(() => {
    try {
      localStorage.setItem('hillclimb_vehicle', selectedVehicleId);
    } catch {
      // Ignora erro
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    try {
      localStorage.setItem('hillclimb_unlocked_v3', JSON.stringify(unlockedVehicles));
    } catch {
      // Ignora erro
    }
  }, [unlockedVehicles]);

  useEffect(() => {
    try {
      localStorage.setItem('hillclimb_vehicle_upgrades_v3', JSON.stringify(vehicleUpgrades));
    } catch {
      // Ignora erro
    }
  }, [vehicleUpgrades]);

  useEffect(() => {
    totalCoinsRef.current = totalCoins;
    telemetryRef.current.totalCoins = totalCoins;
    try {
      localStorage.setItem('hillclimb_total_coins', totalCoins.toString());
    } catch {
      // Ignora erro
    }
  }, [totalCoins]);

  useEffect(() => {
    try {
      localStorage.setItem('hillclimb_best_dist', bestDistance.toString());
    } catch {
      // Ignora erro
    }
  }, [bestDistance]);

  // Geração contínua e espaçada com DIFICULDADE PROGRESSIVA de combustível e valor de moedas
  const ensurePickupsAhead = useCallback((currentCarX: number) => {
    while (lastGeneratedXRef.current < currentCarX + 2600) {
      const baseX = lastGeneratedXRef.current;
      const meters = Math.max(0, Math.floor((baseX - 100) / 10));
      const tier = Math.floor(meters / 1000); // Tier 0: 0-1000m, Tier 1: 1000-2000m, ..., Tier 6: 6000m+

      // Cada moeda coletada vale estritamente 1 ponto / 1 moeda
      const coinValue = 1;

      // Grupo de 4 moedas acompanhando o relevo suave
      for (let i = 0; i < 4; i++) {
        const px = baseX + i * 55;
        const ty = getTerrainY(px);
        pickupsRef.current.push({
          id: nextPickupIdRef.current++,
          x: px,
          y: ty - 42,
          type: 'coin',
          value: coinValue,
          collected: false
        });
      }

      // Espaçamento dos galões de gasolina ampliado conforme solicitado:
      // Galões surgem a cada 185 a 230 metros (1850px a 2300px)
      // Exige acelerar com controle e velocidade para não ter pane seca antes de alcançar o próximo!
      const fuelInterval = Math.min(2300, 1850 + tier * 60);

      if (baseX >= nextFuelXRef.current) {
        const fuelX = baseX + 200;
        const fuelY = getTerrainY(fuelX) - 46;
        pickupsRef.current.push({
          id: nextPickupIdRef.current++,
          x: fuelX,
          y: fuelY,
          type: 'fuel',
          value: 0,
          collected: false
        });
        nextFuelXRef.current = baseX + fuelInterval;
      }

      lastGeneratedXRef.current += 380;
    }
  }, []);

  // Reiniciar corrida com cenário e veículo selecionados (Sempre começando do 0m / 0km)
  const resetRun = useCallback(() => {
    const startX = 100;
    const carUpgrades = vehicleUpgrades[selectedVehicleId] || DEFAULT_VEHICLE_UPGRADES.red_speedster;

    carRef.current = createInitialCar(carUpgrades, suspension, selectedVehicleId, startX);
    pickupsRef.current = [];
    particlesRef.current = [];
    lastGeneratedXRef.current = startX + 200;
    nextFuelXRef.current = startX + 1850; // Primeiro galão aos ~185 metros!
    fuelCansCollectedRef.current = 0;
    lastStage2DistanceRef.current = 0;
    airTimeAccumulatorRef.current = 0;
    lastKmMarkRef.current = 0;
    lastCompletedLevelRef.current = 0;
    setLevelCelebration(null);
    setBiomeToast(null);
    runCoinsRef.current = 0;
    distanceRef.current = 0;
    nextPickupIdRef.current = 1;
    ensurePickupsAhead(carRef.current.x);

    telemetryRef.current = {
      distance: 0,
      speedKmh: 0,
      slopeDeg: 0,
      runCoins: 0,
      totalCoins: totalCoinsRef.current,
      fuel: carRef.current.maxFuel,
      maxFuel: carRef.current.maxFuel,
      isAirborne: false,
      currentLevel: 1,
      targetMeters: 200,
      prevTargetMeters: 0,
      levelProgressPct: 0
    };

    setHudData({
      distance: 0,
      speedKmh: 0,
      slopeDeg: 0,
      runCoins: 0,
      fuel: carRef.current.maxFuel,
      maxFuel: carRef.current.maxFuel,
      gameOverReason: ''
    });

    weatherRef.current = createInitialWeather(selectedStageId);
    setCurrentWeather({ ...weatherRef.current });

    soundManager.startEngine();
  }, [vehicleUpgrades, suspension, selectedVehicleId, selectedStageId, ensurePickupsAhead]);

  // Troca de Cenário
  const handleSelectStage = useCallback((id: StageId) => {
    setSelectedStageId(id);
    weatherRef.current = createInitialWeather(id);
    setCurrentWeather({ ...weatherRef.current });
    const startX = 100;
    const carUpgrades = vehicleUpgrades[selectedVehicleId] || DEFAULT_VEHICLE_UPGRADES.red_speedster;
    carRef.current = createInitialCar(carUpgrades, suspension, selectedVehicleId, startX);
    lastGeneratedXRef.current = startX + 200;
    nextFuelXRef.current = startX + 440;
    pickupsRef.current = [];
    ensurePickupsAhead(carRef.current.x);
  }, [vehicleUpgrades, suspension, selectedVehicleId, ensurePickupsAhead]);

  // Desbloqueio de Cenário (150, 300, 600 moedas)
  const handleUnlockStage = useCallback((id: StageId, cost: number) => {
    if (totalCoins >= cost && !unlockedStages.includes(id)) {
      setTotalCoins((prev) => prev - cost);
      setUnlockedStages((prev) => [...prev, id]);
      setSelectedStageId(id);
      weatherRef.current = createInitialWeather(id);
      setCurrentWeather({ ...weatherRef.current });
      soundManager.playUpgrade();
      const startX = 100;
      const carUpgrades = vehicleUpgrades[selectedVehicleId] || DEFAULT_VEHICLE_UPGRADES.red_speedster;
      carRef.current = createInitialCar(carUpgrades, suspension, selectedVehicleId, startX);
      lastGeneratedXRef.current = startX + 200;
      nextFuelXRef.current = startX + 440;
      pickupsRef.current = [];
      ensurePickupsAhead(carRef.current.x);
    }
  }, [totalCoins, unlockedStages, vehicleUpgrades, suspension, selectedVehicleId, ensurePickupsAhead]);

  // Troca de Veículo
  const handleSelectVehicle = useCallback((id: VehicleId) => {
    setSelectedVehicleId(id);
    const startX = 100;
    const carUpgrades = vehicleUpgrades[id] || DEFAULT_VEHICLE_UPGRADES.red_speedster;
    carRef.current = createInitialCar(carUpgrades, suspension, id, startX);
    ensurePickupsAhead(carRef.current.x);
  }, [vehicleUpgrades, suspension, ensurePickupsAhead]);

  // Desbloqueio de Novo Veículo
  const handleUnlockVehicle = useCallback((id: VehicleId, cost: number) => {
    if (totalCoins >= cost && !unlockedVehicles.includes(id)) {
      setTotalCoins((prev) => prev - cost);
      setUnlockedVehicles((prev) => [...prev, id]);
      setSelectedVehicleId(id);
      const startX = 100;
      const carUpgrades = vehicleUpgrades[id] || DEFAULT_VEHICLE_UPGRADES.red_speedster;
      carRef.current = createInitialCar(carUpgrades, suspension, id, startX);
      ensurePickupsAhead(carRef.current.x);
    }
  }, [totalCoins, unlockedVehicles, vehicleUpgrades, suspension, ensurePickupsAhead]);

  // Alternar tela cheia (oculta barras do navegador no Android e PC)
  const toggleFullScreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Ignora restrições do navegador
    }
  }, []);

  // Função isolada de redimensionamento do canvas para preencher a tela em escala 1:1 real
  const resizeCanvasToScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth || document.documentElement.clientWidth || 800;
    const h = window.innerHeight || document.documentElement.clientHeight || 450;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }, []);

  // Iniciar jogo a partir do menu com tela cheia automática e sincronização imediata do canvas
  const handleStartGame = () => {
    soundManager.init();
    // 1. Atualização imediata das dimensões do canvas antes da transição de estado
    resizeCanvasToScreen();
    setGameState('PLAYING');
    resetRun();
    soundManager.startEngine();

    // 2. Atualização logo após o contêiner receber display: block e antes do loop principal via requestAnimationFrame
    requestAnimationFrame(() => {
      resizeCanvasToScreen();
    });

    try {
      if (typeof document !== 'undefined' && !document.fullscreenElement && document.documentElement?.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignora restrições de permissão
    }
  };

  // Tratar fim de corrida / game over
  const handleGameOver = useCallback((reason: string) => {
    if (gameState === 'GAME_OVER') return;
    setGameState('GAME_OVER');
    soundManager.stopEngine();

    const car = carRef.current;
    const dist = Number.isFinite(distanceRef.current) && distanceRef.current > 0
      ? distanceRef.current
      : (Number.isFinite(car.x) ? Math.max(0, Math.floor((car.x - 100) / 10)) : 0);
    distanceRef.current = dist;

    setBestDistance((prev) => Math.max(Number.isFinite(prev) ? prev : 0, dist));

    setHudData((prev) => ({
      ...prev,
      distance: dist,
      gameOverReason: reason
    }));
  }, [gameState]);

  // Botão de Encerrar Corrida pelo jogador
  const handleEndRun = useCallback(() => {
    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
      handleGameOver('Corrida finalizada pelo piloto.');
    }
  }, [gameState, handleGameOver]);

  // Disparo de notificação e som comemorativo ao completar missão diária
  const triggerMissionCompleted = useCallback((newly: DailyMission[]) => {
    if (newly && newly.length > 0) {
      soundManager.playLevelUp();
      setMissionToast({ title: newly[0].title, rewardCoins: newly[0].rewardCoins });
      setUnclaimedMissionsCount(countUnclaimedMissions(loadDailyMissions()));
      setTimeout(() => {
        setMissionToast((prev) => (prev?.title === newly[0].title ? null : prev));
      }, 3500);
    }
  }, []);

  // Manipulação de Combustível coletado (alimenta missões diárias)
  const handleFuelCollected = useCallback(() => {
    fuelCansCollectedRef.current += 1;
    const newly = recordMissionProgress('COLLECT_FUEL_SINGLE_RUN', fuelCansCollectedRef.current, false);
    triggerMissionCompleted(newly);
  }, [triggerMissionCompleted]);

  // Manipulação de Moedas coletadas em tempo real (contabiliza imediatamente no saldo e na corrida)
  const handleCoinCollected = useCallback((val: number) => {
    const safeVal = Number.isFinite(val) && val > 0 ? val : 1;
    runCoinsRef.current += safeVal;
    totalCoinsRef.current += safeVal;

    telemetryRef.current.runCoins = runCoinsRef.current;
    telemetryRef.current.totalCoins = totalCoinsRef.current;

    try {
      localStorage.setItem('hillclimb_total_coins', totalCoinsRef.current.toString());
    } catch {
      // Ignora erro
    }

    setTotalCoins(totalCoinsRef.current);
    const newly = recordMissionProgress('COLLECT_COINS_CUMULATIVE_DAY', safeVal, true);
    triggerMissionCompleted(newly);
  }, [triggerMissionCompleted]);

  // Resgate de recompensas de missões diárias
  const handleMissionRewardClaimed = useCallback((coins: number) => {
    totalCoinsRef.current += coins;
    setTotalCoins(totalCoinsRef.current);
    try {
      localStorage.setItem('hillclimb_total_coins', totalCoinsRef.current.toString());
    } catch {
      // Ignora erro
    }
    setUnclaimedMissionsCount(countUnclaimedMissions(loadDailyMissions()));
  }, []);

  // Compra de upgrade na oficina (Individual por veículo!)
  const handleUpgrade = (vehicleId: VehicleId, key: keyof Upgrades, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins((prev) => prev - cost);
    setVehicleUpgrades((prev) => {
      const carCurrent = prev[vehicleId] || DEFAULT_VEHICLE_UPGRADES[vehicleId];
      const newUpgrades = {
        ...carCurrent,
        [key]: carCurrent[key] + 1
      };
      if (vehicleId === selectedVehicleId && key === 'fuelTank') {
        const vDef = VEHICLES[vehicleId] || VEHICLES.red_speedster;
        const newMaxFuel = Math.round(vDef.fuelCapacity + (newUpgrades.fuelTank - 1) * 15);
        carRef.current.maxFuel = newMaxFuel;
        carRef.current.fuel = Math.min(carRef.current.fuel + 15, newMaxFuel);
      }
      return {
        ...prev,
        [vehicleId]: newUpgrades
      };
    });
  };

  // Controles
  const setControlState = useCallback((key: keyof KeyControls, state: boolean) => {
    if (controlsRef.current[key] !== state) {
      controlsRef.current[key] = state;
      setActiveControls((prev) => (prev[key] === state ? prev : { ...prev, [key]: state }));
    }
    if (gameState === 'PLAYING') {
      if (state) {
        soundManager.startEngine();
      }
      if (key === 'boost' && state) {
        soundManager.playTurboBurst();
      }
    }
  }, [gameState]);

  // Efeito do Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Começar jogo com Enter ou Espaço no menu ou game over
      if (gameState === 'MENU' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGame();
        return;
      }
      if (gameState === 'GAME_OVER' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGame();
        return;
      }

      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') setGameState('PAUSED');
        else if (gameState === 'PAUSED') setGameState('PLAYING');
        return;
      }

      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setControlState('gas', true);
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setControlState('brake', true);
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        setControlState('boost', true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setControlState('gas', false);
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setControlState('brake', false);
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        setControlState('boost', false);
      }
    };

    const handleBlur = () => {
      controlsRef.current.gas = false;
      controlsRef.current.brake = false;
      controlsRef.current.boost = false;
      setActiveControls({ gas: false, brake: false, boost: false });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, setControlState]);

  // Redimensionamento responsivo do Canvas (resize, rotação e orientationchange)
  useEffect(() => {
    window.addEventListener('resize', resizeCanvasToScreen);
    window.addEventListener('orientationchange', resizeCanvasToScreen);
    resizeCanvasToScreen();

    return () => {
      window.removeEventListener('resize', resizeCanvasToScreen);
      window.removeEventListener('orientationchange', resizeCanvasToScreen);
    };
  }, [resizeCanvasToScreen]);

  // Sincronização garantida logo que a partida for iniciada ou despausada
  useEffect(() => {
    if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAME_OVER') {
      resizeCanvasToScreen();
      const rafId = requestAnimationFrame(() => {
        resizeCanvasToScreen();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [gameState, resizeCanvasToScreen]);

  // Teste de salto da suspensão
  const handleBounceTest = () => {
    if (gameState === 'PLAYING') {
      carRef.current.vy = -360;
      carRef.current.angularVel = (Math.random() - 0.5) * 1.6;
    }
  };

  // Loop Principal do Jogo (Só ativa quando a tela de corrida estiver ativa: PLAYING, PAUSED ou GAME_OVER)
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'PAUSED' && gameState !== 'GAME_OVER') {
      return;
    }

    const loop = (now: number) => {
      const currentTime = typeof now === 'number' && Number.isFinite(now) ? now : performance.now();
      if (!Number.isFinite(lastTimeRef.current) || lastTimeRef.current <= 0) {
        lastTimeRef.current = currentTime;
      }
      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      const dt = Number.isFinite(rawDt) ? Math.min(Math.max(rawDt, 0.001), 0.04) : 0.016;
      lastTimeRef.current = currentTime;

      const canvas = canvasRef.current;
      if (canvas) {
        // Garantia de resolução e proporção 1:1 exata sem esticar ou achatar (portrait ou landscape)
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const car = carRef.current;
          const currentCarUpgrades = vehicleUpgrades[selectedVehicleId] || DEFAULT_VEHICLE_UPGRADES.red_speedster;

          // Se estiver jogando, executa a física com os upgrades do carro selecionado
          if (gameState === 'PLAYING') {
            // Atualização contínua do clima dinâmico por bioma
            weatherRef.current = stepWeather(
              weatherRef.current,
              selectedStageId,
              dt,
              (newWeatherDef) => {
                setBiomeToast(`${newWeatherDef.icon} ${newWeatherDef.name.toUpperCase()}: ${newWeatherDef.description}`);
                setTimeout(() => setBiomeToast(null), 3800);
              }
            );

            stepPhysics(
              car,
              controlsRef.current,
              currentCarUpgrades,
              suspension,
              pickupsRef.current,
              particlesRef.current,
              dt,
              handleCoinCollected,
              handleGameOver,
              selectedStageId,
              handleFuelCollected,
              weatherRef.current
            );

            ensurePickupsAhead(car.x);

            // Limpeza de memória contínua: remove pickups deixados para trás (mais de 1400px atrás do carro)
            // Mantém 60 FPS cravados aos 7000m e além!
            if (pickupsRef.current.length > 70) {
              pickupsRef.current = pickupsRef.current.filter((p) => p.x >= car.x - 1400);
            }

            // Atualiza áudio do motor com personalidade de som de cada veículo
            const speedKmh = Math.round(Math.hypot(car.vx, car.vy) * 0.18);
            soundManager.updateEngine(
              speedKmh,
              controlsRef.current.gas,
              controlsRef.current.brake,
              controlsRef.current.boost,
              selectedVehicleId
            );

            // =========================================================================
            // TELEMETRIA EM TEMPO REAL NO REF (ATUALIZADA A 60 FPS NO LOOP FÍSICO)
            // =========================================================================
            const dist = Number.isFinite(car.x) ? Math.max(0, Math.floor((car.x - 100) / 10)) : 0;
            const slopeDeg = Number.isFinite(car.angle) ? Math.round(-(car.angle) * (180 / Math.PI)) : 0;
            const isAirborne = !car.rearWheel.onGround && !car.frontWheel.onGround;

            // Sistema de Metas por Nível (Level Checkpoints estilo Hill Climb Racing)
            const cp = getCheckpointForDistance(dist);

            // Verifica se cruzou a meta de algum nível anterior que ainda não foi comemorado
            for (const item of LEVEL_CHECKPOINTS) {
              if (dist >= item.targetMeters && lastCompletedLevelRef.current < item.level) {
                lastCompletedLevelRef.current = item.level;
                const newLevel = item.level + 1;
                const nextTarget = LEVEL_CHECKPOINTS.find((c) => c.level === newLevel)?.targetMeters || (item.targetMeters + 1500);
                const reward = item.rewardCoins;

                // 1. Bonificação imediata de moedas
                handleCoinCollected(reward);

                // 2. Som festivo de conquista
                soundManager.playLevelUp();

                // 3. Efeito visual comemorativo rápido (confetes e partículas douradas no Canvas)
                const confettiColors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#e11d48', '#fbbf24'];
                for (let k = 0; k < 45; k++) {
                  particlesRef.current.push({
                    x: car.x + (Math.random() - 0.5) * 220,
                    y: car.y - 40 - Math.random() * 80,
                    vx: (Math.random() - 0.5) * 340,
                    vy: -130 - Math.random() * 190,
                    size: 4 + Math.random() * 6,
                    alpha: 1,
                    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                    type: 'coin'
                  });
                }

                // 4. Exibe o banner animado no centro com zoom e fade out
                setLevelCelebration({
                  completedLevel: item.level,
                  newLevel,
                  nextTargetMeters: nextTarget,
                  rewardCoins: reward
                });

                setTimeout(() => {
                  setLevelCelebration(null);
                }, 2600);

                break;
              }
            }

            distanceRef.current = dist;
            telemetryRef.current.distance = dist;
            telemetryRef.current.speedKmh = speedKmh;
            telemetryRef.current.slopeDeg = slopeDeg;
            telemetryRef.current.runCoins = runCoinsRef.current;
            telemetryRef.current.totalCoins = totalCoinsRef.current;
            telemetryRef.current.fuel = car.fuel;
            telemetryRef.current.maxFuel = car.maxFuel;
            telemetryRef.current.isAirborne = isAirborne;
            telemetryRef.current.currentLevel = cp.level;
            telemetryRef.current.targetMeters = cp.targetMeters;
            telemetryRef.current.prevTargetMeters = cp.prevTargetMeters;
            telemetryRef.current.levelProgressPct = cp.progressPct;

            // Detector de marcos de distância alcançada (a cada 1000m)
            const currentKm = Math.floor(dist / 1000);
            if (currentKm > 0 && currentKm !== lastKmMarkRef.current) {
              lastKmMarkRef.current = currentKm;
              const stageDef = STAGES[selectedStageId] || STAGES.stage_1_green_hills;
              setBiomeToast(`🏆 RECORDE EM ${stageDef.name.toUpperCase()}: ${currentKm * 1000} METROS!`);
              setTimeout(() => setBiomeToast(null), 4000);
            }
          }

          // Renderização do mundo com o cenário selecionado e clima dinâmico
          renderWorld(
            ctx,
            canvas.width,
            canvas.height,
            car,
            pickupsRef.current,
            particlesRef.current,
            controlsRef.current.boost,
            selectedStageId,
            weatherRef.current
          );

          // Rastreamento contínuo de tempo de voo nos saltos (missão diária cumulativa)
          if (!car.rearWheel.onGround && !car.frontWheel.onGround) {
            airTimeAccumulatorRef.current += dt;
            if (airTimeAccumulatorRef.current >= 1.0) {
              const wholeSec = Math.floor(airTimeAccumulatorRef.current);
              airTimeAccumulatorRef.current -= wholeSec;
              const newlyAir = recordMissionProgress('AIR_TIME_CUMULATIVE_DAY', wholeSec, true);
              triggerMissionCompleted(newlyAir);
            }
          }

          // Sincronização secundária com o estado do React em baixa frequência (1x por segundo)
          hudFrameCountRef.current = (hudFrameCountRef.current + 1) % 60;
          if (hudFrameCountRef.current === 0 && gameState === 'PLAYING') {
            const dist = Number.isFinite(car.x) ? Math.max(0, Math.floor((car.x - 100) / 10)) : 0;
            const speedKmh = Number.isFinite(car.vx) && Number.isFinite(car.vy) ? Math.round(Math.hypot(car.vx, car.vy) * 0.18) : 0;
            const slopeDeg = Number.isFinite(car.angle) ? Math.round(-(car.angle) * (180 / Math.PI)) : 0;
            const safeRunCoins = Number.isFinite(runCoinsRef.current) ? Math.max(0, runCoinsRef.current) : 0;
            const safeFuel = Number.isFinite(car.fuel) ? car.fuel : 100;
            const safeMaxFuel = Number.isFinite(car.maxFuel) && car.maxFuel > 0 ? car.maxFuel : 100;

            // Rastreamento contínuo de missões diárias:
            // 1. Distância única na corrida
            const newlyDist = recordMissionProgress('DRIVE_DISTANCE_SINGLE_RUN', dist, false);
            triggerMissionCompleted(newlyDist);

            // 2. Especialista de Terreno: 2.000m jogando especificamente no cenário 2 (Pine Forest)
            if (selectedStageId === 'stage_2_pine_forest') {
              const deltaStage2 = Math.max(0, dist - lastStage2DistanceRef.current);
              if (deltaStage2 > 0) {
                lastStage2DistanceRef.current = dist;
                const newlyStage2 = recordMissionProgress('STAGE2_DISTANCE_CUMULATIVE_DAY', deltaStage2, true);
                triggerMissionCompleted(newlyStage2);
              }
            }

            setHudData({
              distance: dist,
              speedKmh,
              slopeDeg,
              runCoins: safeRunCoins,
              fuel: safeFuel,
              maxFuel: safeMaxFuel,
              gameOverReason: ''
            });
          }

          if (hudFrameCountRef.current % 15 === 0 && gameState === 'PLAYING') {
            setCurrentWeather({ ...weatherRef.current });
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameState,
    vehicleUpgrades,
    selectedVehicleId,
    selectedStageId,
    suspension,
    ensurePickupsAhead,
    handleCoinCollected,
    handleGameOver,
    handleFuelCollected,
    triggerMissionCompleted
  ]);

  // Encerramento de áudio somente ao desmontar a aplicação
  useEffect(() => {
    return () => {
      soundManager.stopEngine();
    };
  }, []);

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted && gameState === 'PLAYING') {
      soundManager.startEngine();
    }
  };

  const togglePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      soundManager.stopEngine();
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      soundManager.startEngine();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#090d16]">
      {/* 1. TELA INICIAL (MENU PRINCIPAL) */}
      {gameState === 'MENU' && (
        <TitleScreen
          totalCoins={totalCoins}
          bestDistance={bestDistance}
          isMuted={isMuted}
          onStartGame={handleStartGame}
          onNavigate={(screen) => setGameState(screen)}
          onToggleMute={toggleMute}
          onToggleFullScreen={toggleFullScreen}
        />
      )}

      {/* 2. TELA DEDICADA DA GARAGEM & OFICINAS */}
      {gameState === 'GARAGE' && (
        <GarageScreen
          vehicleUpgrades={vehicleUpgrades}
          totalCoins={totalCoins}
          selectedVehicleId={selectedVehicleId}
          unlockedVehicles={unlockedVehicles}
          suspensionConfig={suspension}
          onChangeSuspension={(newConfig) => {
            setSuspension(newConfig);
            try {
              localStorage.setItem('hillclimb_suspension_cfg', JSON.stringify(newConfig));
            } catch {
              // Ignora erro
            }
          }}
          onSelectVehicle={handleSelectVehicle}
          onUnlockVehicle={handleUnlockVehicle}
          onUpgrade={handleUpgrade}
          onBackToMenu={() => setGameState('MENU')}
          onStartGame={handleStartGame}
        />
      )}

      {/* 3. TELA DEDICADA DE CENÁRIOS & PISTAS */}
      {gameState === 'STAGES' && (
        <StagesScreen
          totalCoins={totalCoins}
          selectedStageId={selectedStageId}
          unlockedStages={unlockedStages}
          onSelectStage={handleSelectStage}
          onUnlockStage={handleUnlockStage}
          onBackToMenu={() => setGameState('MENU')}
        />
      )}

      {/* 4. TELA DEDICADA DE CRÉDITOS */}
      {gameState === 'CREDITS' && (
        <CreditsScreen onBackToMenu={() => setGameState('MENU')} />
      )}

      {/* 5. TELA DE CORRIDA ATIVA (CANVAS E CAMADAS DO JOGO) */}
      <div
        className={`absolute inset-0 w-full h-full ${
          gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAME_OVER'
            ? 'block'
            : 'hidden pointer-events-none'
        }`}
      >
        {/* Canvas Principal da Corrida com inicialização imediata e proporção 1:1 */}
        <canvas
          ref={(el) => {
            canvasRef.current = el;
            if (el) {
              const w = window.innerWidth || document.documentElement.clientWidth || 800;
              const h = window.innerHeight || document.documentElement.clientHeight || 450;
              if (el.width !== w || el.height !== h) {
                el.width = w;
                el.height = h;
              }
            }
          }}
          className="block w-full h-full"
        />

        {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAME_OVER') && (
          <>
            {/* Interface Limpa: Apenas Barra de Combustível, Contador de Moedas e Distância */}
            <HUD
              telemetryRef={telemetryRef}
              distanceRef={distanceRef}
              isPaused={gameState === 'PAUSED'}
              onTogglePause={togglePause}
              weather={currentWeather}
            />

            {/* Pedais na Tela */}
            <Pedals
              controls={activeControls}
              onSetControl={setControlState}
            />

            {/* Banner de Recorde de Distância */}
            {biomeToast && (
              <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 w-full max-w-lg text-center animate-bounce">
                <div className="bg-slate-900/95 border-2 border-amber-400 backdrop-blur-md px-4 py-2 rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.4)] text-amber-300 font-racing font-bold text-xs sm:text-sm tracking-wide">
                  {biomeToast}
                </div>
              </div>
            )}

            {/* Comemoração Festiva Compacta de Passagem de Nível */}
            {levelCelebration && <LevelCelebration data={levelCelebration} />}

            {/* Modal de Fim de Corrida (Game Over) */}
            <GameOverModal
              isOpen={gameState === 'GAME_OVER'}
              reason={hudData.gameOverReason}
              distance={distanceRef.current > 0 ? distanceRef.current : hudData.distance}
              bestDistance={bestDistance}
              runCoins={hudData.runCoins}
              totalCoins={totalCoins}
              onRestart={handleStartGame}
              onOpenGarage={() => setGameState('GARAGE')}
              onOpenMissions={() => setIsMissionsOpen(true)}
              onBackToMenu={() => {
                setGameState('MENU');
                soundManager.stopEngine();
              }}
            />

            {/* Modal de Pausa Limpo */}
            {gameState === 'PAUSED' && (
              <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-40 flex items-center justify-center p-4">
                <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 text-center text-white max-w-sm w-full shadow-2xl">
                  <h2 className="font-racing font-extrabold text-2xl text-amber-400 uppercase tracking-wide mb-1">
                    Corrida Pausada
                  </h2>
                  <p className="text-slate-300 text-xs mb-5">Pressione Continuar ou retorne ao menu.</p>
                  <div className="space-y-2.5">
                    <button
                      onClick={togglePause}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-racing font-extrabold text-sm uppercase rounded-xl transition shadow active:scale-95"
                    >
                      Continuar Corrida
                    </button>
                    <button
                      onClick={handleStartGame}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-racing font-bold text-xs uppercase rounded-xl transition active:scale-95"
                    >
                      Reiniciar Corrida
                    </button>
                    <button
                      onClick={() => {
                        setGameState('GARAGE');
                        soundManager.stopEngine();
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-racing font-bold text-xs uppercase rounded-xl transition active:scale-95"
                    >
                      Ir para Garagem
                    </button>
                    <button
                      onClick={() => {
                        setGameState('MENU');
                        soundManager.stopEngine();
                      }}
                      className="w-full py-2 text-slate-400 hover:text-white font-racing text-xs transition"
                    >
                      Voltar ao Menu Principal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Missões Diárias */}
      <DailyMissionsModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        onRewardClaimed={handleMissionRewardClaimed}
      />

      {/* Toast Flutuante de Notificação de Missão Concluída */}
      {missionToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 select-none animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/95 border-2 border-amber-400 backdrop-blur-md shadow-[0_10px_30px_rgba(245,158,11,0.5)] text-white">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow shrink-0">
              <Target className="w-4 h-4 text-slate-950" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-amber-300 font-racing">
                🎯 Missão Diária Concluída!
              </span>
              <span className="text-xs font-racing font-extrabold text-white">
                {missionToast.title} <strong className="text-yellow-300 font-bold">(+{missionToast.rewardCoins} 🪙)</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
