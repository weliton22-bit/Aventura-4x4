import React, { useState, useEffect } from 'react';
import { Fuel, Pause, Play, AlertTriangle } from 'lucide-react';
import { WeatherState } from '../types/weather';

export interface TelemetryData {
  distance: number;
  speedKmh: number;
  slopeDeg: number;
  runCoins: number;
  totalCoins: number;
  fuel: number;
  maxFuel: number;
  isAirborne: boolean;
  currentLevel: number;
  targetMeters: number;
  prevTargetMeters: number;
  levelProgressPct: number;
}

export const DEFAULT_TELEMETRY: TelemetryData = {
  distance: 0,
  speedKmh: 0,
  slopeDeg: 0,
  runCoins: 0,
  totalCoins: 0,
  fuel: 100,
  maxFuel: 100,
  isAirborne: false,
  currentLevel: 1,
  targetMeters: 200,
  prevTargetMeters: 0,
  levelProgressPct: 0
};

interface HUDProps {
  telemetryRef: React.RefObject<TelemetryData>;
  isPaused: boolean;
  onTogglePause: () => void;
  weather?: WeatherState | null;
}

export const HUD: React.FC<HUDProps> = ({
  telemetryRef,
  isPaused,
  onTogglePause,
  weather
}) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>(() => telemetryRef.current || DEFAULT_TELEMETRY);

  useEffect(() => {
    const timer = setInterval(() => {
      if (telemetryRef.current) {
        setTelemetry({ ...telemetryRef.current });
      }
    }, 70);

    return () => clearInterval(timer);
  }, [telemetryRef]);

  const safeFuel = Number.isFinite(telemetry.fuel) ? telemetry.fuel : 100;
  const safeMaxFuel = Number.isFinite(telemetry.maxFuel) && telemetry.maxFuel > 0 ? telemetry.maxFuel : 100;
  const fuelPct = Math.max(0, Math.min(100, Math.round((safeFuel / safeMaxFuel) * 100)));
  const isWarningFuel = fuelPct <= 25;

  const safeDistance = Number.isFinite(telemetry.distance) ? Math.max(0, Math.floor(telemetry.distance)) : 0;
  const safeRunCoins = Number.isFinite(telemetry.runCoins) ? Math.max(0, telemetry.runCoins) : 0;

  return (
    <div className="fixed top-0 left-0 right-0 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] p-2 sm:p-3 flex justify-between items-center pointer-events-none z-20 select-none">
      {/* 1. Contador de Moedas & Distância (Esquerda) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Moedas Coletadas na Corrida */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 text-white shadow-lg">
          <span className="text-sm">🪙</span>
          <span className="font-racing font-bold text-sm sm:text-base text-yellow-300 tabular-nums">
            {safeRunCoins}
          </span>
        </div>

        {/* Distância Percorrida */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 text-white shadow-lg">
          <span className="text-xs text-slate-400 font-semibold font-racing uppercase">Dist:</span>
          <span className="font-racing font-bold text-sm sm:text-base text-white tabular-nums">
            {safeDistance}m
          </span>
        </div>
      </div>

      {/* 2. Barra de Combustível Limpa e Destacada (Centro) */}
      <div className="flex-1 max-w-[180px] sm:max-w-xs mx-3 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-lg">
          <div className="flex items-center justify-between text-[10px] font-racing font-bold uppercase tracking-wide mb-1">
            <span className="flex items-center gap-1 text-slate-300">
              <Fuel className="w-3.5 h-3.5 text-rose-400" />
              Gasolina
            </span>
            <span
              className={`font-mono font-bold ${
                isWarningFuel ? 'text-rose-400 animate-pulse' : 'text-slate-200'
              }`}
            >
              {fuelPct}%
            </span>
          </div>

          {/* Barra de Progresso do Tanque */}
          <div className="w-full h-2.5 sm:h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700 p-0.5 flex items-center">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                isWarningFuel
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400'
              }`}
              style={{ width: `${fuelPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Indicador Dinâmico de Clima (Tempo, Visibilidade e Grip) */}
      {weather && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-lg pointer-events-auto shrink-0 mr-1.5">
          <span className="text-sm select-none">{weather.weatherDef.icon}</span>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-racing font-bold text-[10px] text-white leading-tight">
              {weather.weatherDef.name}
            </span>
            <span className="font-mono text-[9px] text-amber-300 font-bold leading-none">
              {weather.gripMultiplier < 0.98
                ? `Grip ${Math.round(weather.gripMultiplier * 100)}%`
                : weather.visibility < 0.95
                ? `Visib. ${Math.round(weather.visibility * 100)}%`
                : 'Pista Seca'}
            </span>
          </div>
        </div>
      )}

      {/* 4. Botão Pausa Discreto (Direita) */}
      <div className="pointer-events-auto">
        <button
          onClick={onTogglePause}
          className="p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow-lg active:scale-95 flex items-center gap-1"
          title={isPaused ? 'Continuar' : 'Pausar'}
          aria-label={isPaused ? 'Continuar' : 'Pausar'}
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> : <Pause className="w-4 h-4" />}
          <span className="hidden sm:inline font-racing text-xs font-bold uppercase">
            {isPaused ? 'Continuar' : 'Pausa'}
          </span>
        </button>
      </div>
    </div>
  );
};
