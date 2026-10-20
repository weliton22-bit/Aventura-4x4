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
import { HUD } from './components/HUD';
import { Pedals } from './components/Pedals';
import { SuspensionTuningPanel } from './components/SuspensionTuningPanel';
import { GarageModal } from './components/GarageModal';
import { GameOverModal } from './components/GameOverModal';
import { TitleScreen } from './components/TitleScreen';

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
        if (parsed.red_speedster && parsed.orc_war_rig && parsed.monster_truck) {
          return parsed as VehicleUpgrades;
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
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [bestDistance, setBestDistance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hillclimb_best_dist');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [suspension, setSuspension] = useState<SuspensionConfig>(DEFAULT_SUSPENSION);

  // Estado da UI
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isTuningOpen, setIsTuningOpen] = useState<boolean>(false);
  const [isGarageOpen, setIsGarageOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());
  const [biomeToast, setBiomeToast] = useState<string | null>(null);

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
  const nextFuelXRef = useRef<number>(540);
  const lastKmMarkRef = useRef<number>(0);
  const runCoinsRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const nextPickupIdRef = useRef<number>(1);

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

      // Dificuldade progressiva da Gasolina:
      // A cada 1000m os galões se distanciam gradualmente (de 500px até ~940px),
      // exigindo melhor controle de acelerador e upgrades, mas 100% jogável e nunca impossível!
      const fuelInterval = Math.min(940, 500 + tier * 65);

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

      lastGeneratedXRef.current += 460;
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
    nextFuelXRef.current = startX + 440;
    lastKmMarkRef.current = 0;
    setBiomeToast(null);
    runCoinsRef.current = 0;
    nextPickupIdRef.current = 1;
    ensurePickupsAhead(carRef.current.x);

    setHudData({
      distance: 0,
      speedKmh: 0,
      slopeDeg: 0,
      runCoins: 0,
      fuel: carRef.current.maxFuel,
      maxFuel: carRef.current.maxFuel,
      gameOverReason: ''
    });

    soundManager.startEngine();
  }, [vehicleUpgrades, suspension, selectedVehicleId, ensurePickupsAhead]);

  // Troca de Cenário
  const handleSelectStage = useCallback((id: StageId) => {
    setSelectedStageId(id);
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

  // Iniciar jogo a partir do menu
  const handleStartGame = () => {
    soundManager.init();
    setGameState('PLAYING');
    resetRun();
    soundManager.startEngine();
  };

  // Tratar fim de corrida / game over
  const handleGameOver = useCallback((reason: string) => {
    if (gameState === 'GAME_OVER') return;
    setGameState('GAME_OVER');
    soundManager.stopEngine();

    const car = carRef.current;
    const dist = Math.max(0, Math.floor((car.x - 100) / 10));

    setBestDistance((prev) => Math.max(prev, dist));

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

  // Manipulação de Moedas coletadas em tempo real (contabiliza imediatamente no saldo e na corrida)
  const handleCoinCollected = useCallback((val: number) => {
    runCoinsRef.current += val;
    setTotalCoins((prev) => prev + val);
    setHudData((prev) => ({
      ...prev,
      runCoins: runCoinsRef.current
    }));
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
    controlsRef.current[key] = state;
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
        setGameState('PLAYING');
        resetRun();
        soundManager.startEngine();
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
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, setControlState, resetRun]);

  // Redimensionamento de Canvas
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Teste de salto da suspensão
  const handleBounceTest = () => {
    if (gameState === 'PLAYING') {
      carRef.current.vy = -360;
      carRef.current.angularVel = (Math.random() - 0.5) * 1.6;
    }
  };

  // Loop Principal do Jogo (60fps no Canvas)
  useEffect(() => {
    let lastHudUpdate = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTimeRef.current) / 1000;
      const dt = Math.min(rawDt, 0.04);
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const car = carRef.current;
          const currentCarUpgrades = vehicleUpgrades[selectedVehicleId] || DEFAULT_VEHICLE_UPGRADES.red_speedster;

          // Se estiver jogando, executa a física com os upgrades do carro selecionado
          if (gameState === 'PLAYING') {
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
              selectedStageId
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
          } else if (gameState === 'MENU') {
            // No menu, movimento suave da câmera na pista para fundo vivo
            car.x += 35 * dt;
            car.y = getTerrainY(car.x) - 75;
            car.angle = Math.sin(now * 0.001) * 0.05;
            ensurePickupsAhead(car.x);
          }

          // Renderização do mundo com o cenário selecionado
          renderWorld(
            ctx,
            canvas.width,
            canvas.height,
            car,
            pickupsRef.current,
            particlesRef.current,
            controlsRef.current.boost,
            selectedStageId
          );

          // Atualização periódica do HUD (a cada ~80ms para poupar ciclos React)
          if (now - lastHudUpdate > 80 && gameState === 'PLAYING') {
            lastHudUpdate = now;
            const dist = Math.max(0, Math.floor((car.x - 100) / 10));
            const speedKmh = Math.round(Math.hypot(car.vx, car.vy) * 0.18);
            const slopeDeg = Math.round(-(car.angle) * (180 / Math.PI));

            // Detector de marcos de distância alcançada (a cada 1000m)
            const currentKm = Math.floor(dist / 1000);
            if (currentKm > 0 && currentKm !== lastKmMarkRef.current) {
              lastKmMarkRef.current = currentKm;
              const stageDef = STAGES[selectedStageId] || STAGES.stage_1_green_hills;
              setBiomeToast(`🏆 RECORDE EM ${stageDef.name.toUpperCase()}: ${currentKm * 1000} METROS!`);
              setTimeout(() => setBiomeToast(null), 4000);
            }

            setHudData({
              distance: dist,
              speedKmh,
              slopeDeg,
              runCoins: runCoinsRef.current,
              fuel: car.fuel,
              maxFuel: car.maxFuel,
              gameOverReason: ''
            });
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
  }, [gameState, vehicleUpgrades, selectedVehicleId, selectedStageId, suspension, ensurePickupsAhead, handleCoinCollected, handleGameOver]);

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
      {/* Canvas Principal do Jogo */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Tela de Título Inicial */}
      {gameState === 'MENU' && (
        <TitleScreen
          bestDistance={bestDistance}
          totalCoins={totalCoins}
          upgrades={vehicleUpgrades[selectedVehicleId] || DEFAULT_VEHICLE_UPGRADES.red_speedster}
          selectedVehicleId={selectedVehicleId}
          unlockedVehicles={unlockedVehicles}
          selectedStageId={selectedStageId}
          unlockedStages={unlockedStages}
          onSelectVehicle={handleSelectVehicle}
          onSelectStage={handleSelectStage}
          onStartGame={handleStartGame}
          onOpenGarage={() => setIsGarageOpen(true)}
        />
      )}

      {/* HUD Superior de Telemetria e Status */}
      {gameState !== 'MENU' && (
        <HUD
          car={carRef.current}
          distance={hudData.distance}
          speedKmh={hudData.speedKmh}
          slopeDeg={hudData.slopeDeg}
          currentRunCoins={hudData.runCoins}
          totalCoins={totalCoins}
          stageId={selectedStageId}
          isMuted={isMuted}
          isPaused={gameState === 'PAUSED'}
          isTuningOpen={isTuningOpen}
          onToggleMute={toggleMute}
          onTogglePause={togglePause}
          onOpenGarage={() => {
            setGameState('PAUSED');
            soundManager.stopEngine();
            setIsGarageOpen(true);
          }}
          onToggleTuning={() => setIsTuningOpen((prev) => !prev)}
          onEndRun={handleEndRun}
        />
      )}

      {/* Banner de Notificação de Recorde de Distância */}
      {biomeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 w-full max-w-lg text-center animate-bounce">
          <div className="bg-slate-900/95 border-2 border-amber-400 backdrop-blur-md px-4 py-2 rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.4)] text-amber-300 font-racing font-bold text-xs sm:text-sm tracking-wide">
            {biomeToast}
          </div>
        </div>
      )}

      {/* Pedais na Tela para Mobile e Desktop */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <Pedals
          controls={controlsRef.current}
          onSetControl={setControlState}
        />
      )}

      {/* Painel Retrátil de Oficina da Suspensão */}
      <SuspensionTuningPanel
        isOpen={isTuningOpen && gameState !== 'MENU'}
        config={suspension}
        onChangeConfig={setSuspension}
        onBounceTest={handleBounceTest}
        onResetCar={resetRun}
        onToggleOpen={() => setIsTuningOpen((prev) => !prev)}
      />

      {/* Modal de Oficina de Upgrades Individuais, Garagem de Veículos e Cenários */}
      <GarageModal
        isOpen={isGarageOpen}
        vehicleUpgrades={vehicleUpgrades}
        totalCoins={totalCoins}
        selectedVehicleId={selectedVehicleId}
        unlockedVehicles={unlockedVehicles}
        selectedStageId={selectedStageId}
        unlockedStages={unlockedStages}
        onSelectVehicle={handleSelectVehicle}
        onUnlockVehicle={handleUnlockVehicle}
        onSelectStage={handleSelectStage}
        onUnlockStage={handleUnlockStage}
        onUpgrade={handleUpgrade}
        onClose={() => {
          setIsGarageOpen(false);
          if (gameState === 'PAUSED') {
            setGameState('PLAYING');
            soundManager.startEngine();
          }
        }}
      />

      {/* Modal de Fim de Corrida (Game Over) */}
      <GameOverModal
        isOpen={gameState === 'GAME_OVER'}
        reason={hudData.gameOverReason}
        distance={hudData.distance}
        bestDistance={bestDistance}
        runCoins={hudData.runCoins}
        totalCoins={totalCoins}
        onRestart={() => {
          setGameState('PLAYING');
          resetRun();
          soundManager.startEngine();
        }}
        onOpenGarage={() => setIsGarageOpen(true)}
      />

      {/* Indicador de Pausa */}
      {gameState === 'PAUSED' && !isGarageOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center text-white max-w-sm w-full shadow-2xl">
            <h2 className="font-racing font-bold text-2xl text-amber-400 uppercase mb-2">Corrida Pausada</h2>
            <p className="text-slate-300 text-xs mb-5">Pressione continuar ou use [Esc] para retornar à pista.</p>
            <div className="space-y-2">
              <button
                onClick={togglePause}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-racing font-bold uppercase rounded-xl transition hover:brightness-110"
              >
                Continuar Corrida
              </button>
              <button
                onClick={() => setIsGarageOpen(true)}
                className="w-full py-2.5 bg-slate-800 text-slate-200 border border-slate-700 font-racing font-bold text-xs uppercase rounded-xl transition hover:bg-slate-700"
              >
                Abrir Oficina de Upgrades
              </button>
              <button
                onClick={handleEndRun}
                className="w-full py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/60 font-racing font-bold text-xs uppercase rounded-xl transition"
              >
                Encerrar Corrida
              </button>
              <button
                onClick={() => {
                  setGameState('MENU');
                  soundManager.stopEngine();
                }}
                className="w-full py-2 text-slate-400 hover:text-white text-xs transition"
              >
                Voltar ao Menu Principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
