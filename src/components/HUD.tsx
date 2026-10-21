import React, { useState } from 'react';
import { Volume2, VolumeX, Wrench, Settings2, Pause, Play, ChevronUp, ChevronDown, Compass, Flag, Maximize } from 'lucide-react';
import { CarState, StageId } from '../types/game';
import { getZoneName } from '../physics/terrain';

interface HUDProps {
  car: CarState;
  distance: number;
  speedKmh: number;
  slopeDeg: number;
  currentRunCoins: number;
  totalCoins: number;
  stageId?: StageId;
  isMuted: boolean;
  isPaused: boolean;
  isTuningOpen: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenGarage: () => void;
  onToggleTuning: () => void;
  onEndRun: () => void;
  onToggleFullScreen?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  car,
  distance,
  speedKmh,
  slopeDeg,
  currentRunCoins,
  totalCoins,
  stageId,
  isMuted,
  isPaused,
  isTuningOpen,
  onToggleMute,
  onTogglePause,
  onOpenGarage,
  onToggleTuning,
  onEndRun,
  onToggleFullScreen
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const safeFuel = Number.isFinite(car?.fuel) ? car.fuel : 100;
  const safeMaxFuel = Number.isFinite(car?.maxFuel) && car.maxFuel > 0 ? car.maxFuel : 100;
  const fuelPct = Math.max(0, Math.min(100, Math.round((safeFuel / safeMaxFuel) * 100)));
  const isLowFuel = fuelPct < 25;
  const isAirborne = !car?.rearWheel?.onGround && !car?.frontWheel?.onGround;

  const safeDistance = Number.isFinite(distance) ? Math.max(0, Math.floor(distance)) : 0;
  const safeRunCoins = Number.isFinite(currentRunCoins) ? Math.max(0, currentRunCoins) : 0;
  const safeTotalCoins = Number.isFinite(totalCoins) ? Math.max(0, totalCoins) : 0;
  const safeSpeed = Number.isFinite(speedKmh) ? Math.max(0, Math.round(speedKmh)) : 0;
  const safeSlope = Number.isFinite(slopeDeg) ? Math.round(slopeDeg) : 0;

  return (
    <div className="fixed top-0 left-0 right-0 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] p-2 sm:p-2.5 flex justify-between items-start pointer-events-none z-20 select-none">
      {/* Painel Compacto e Minimalista (Sem poluição visual) */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-white shadow-lg pointer-events-auto flex flex-col gap-1 w-[185px] sm:w-[210px] transition-all duration-200">
        {/* Cabeçalho Compacto */}
        <div className="flex items-center justify-between pb-0.5 border-b border-slate-800/80">
          <span className="text-[10px] font-mono font-semibold text-cyan-300 max-w-[130px] truncate">
            {getZoneName(safeDistance, stageId)}
          </span>
          <button
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-0.5 rounded text-slate-400 hover:text-white transition"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
            aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* Linha Principal de Telemetria: Distância apenas em metros, Velocidade e Moedas */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-racing font-bold text-base text-white tabular-nums">{safeDistance}m</span>
            <span className="text-[10px] font-mono text-cyan-400">{safeSpeed}km/h</span>
          </div>
          <div className="flex items-center gap-1 font-racing text-xs text-amber-400 font-bold">
            <span className="text-[9px]">🪙</span>
            <span>+{safeRunCoins}</span>
          </div>
        </div>

        {/* Barra de Gasolina - Desce gradualmente para dar urgência e emoção */}
        <div className="w-full">
          <div className="flex justify-between text-[8px] font-semibold text-slate-400 mb-0.5">
            <span>GASOLINA</span>
            <span className={isLowFuel ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400'}>
              {fuelPct}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isLowFuel ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400'
              }`}
              style={{ width: `${fuelPct}%` }}
            />
          </div>
        </div>

        {/* Detalhes extras se expandido */}
        {!isMinimized && (
          <div className="flex items-center justify-between text-[8px] text-slate-400 pt-0.5">
            <div className="flex items-center gap-1">
              <Compass className="w-2.5 h-2.5 text-slate-500" />
              <span className={slopeDeg > 20 ? 'text-rose-400' : slopeDeg < -20 ? 'text-emerald-400' : 'text-slate-300'}>
                {slopeDeg}°
              </span>
            </div>
            {isAirborne && (
              <span className="bg-purple-500/25 text-purple-200 px-1 py-0.2 rounded font-bold uppercase text-[7px]">
                NO AR!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Botões Rápidos Compactos (Encerrar Corrida, Oficina, Suspensão, Som, Pausa) */}
      <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
        {/* Botão de Encerrar Corrida */}
        <button
          onClick={onEndRun}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600/85 hover:bg-rose-500 text-white font-racing font-bold text-[10px] uppercase shadow hover:brightness-110 active:scale-95 transition border border-rose-400/50"
          title="Encerrar Corrida e Salvar Ganhos"
        >
          <Flag className="w-3 h-3 text-white" />
          <span>Encerrar</span>
        </button>

        {/* Garagem / Oficina */}
        <button
          onClick={onOpenGarage}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-racing font-bold text-[10px] uppercase shadow hover:brightness-110 active:scale-95 transition"
          title="Abrir Garagem e Oficinas"
        >
          <Wrench className="w-3 h-3" />
          <span>Garagem ({safeTotalCoins}🪙)</span>
        </button>

        {/* Ajuste de Suspensão */}
        <button
          onClick={onToggleTuning}
          className={`p-1 rounded-lg text-[10px] border transition ${
            isTuningOpen
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Oficina de Molas"
        >
          <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        {/* Som Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className="p-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition"
          title={isMuted ? 'Ativar Som' : 'Desativar Som'}
          aria-label={isMuted ? 'Ativar Som' : 'Desativar Som'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* Tela Cheia */}
        {onToggleFullScreen && (
          <button
            onClick={onToggleFullScreen}
            className="p-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Alternar Tela Cheia"
            aria-label="Alternar Tela Cheia"
          >
            <Maximize className="w-3.5 h-3.5 text-amber-300" />
          </button>
        )}

        {/* Pausa */}
        <button
          onClick={onTogglePause}
          className="p-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition"
          title={isPaused ? 'Continuar' : 'Pausar'}
          aria-label={isPaused ? 'Continuar' : 'Pausar'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
