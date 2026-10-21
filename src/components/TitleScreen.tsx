import React from 'react';
import { Play, Wrench, Trophy, Check, Lock, MapPin, Maximize } from 'lucide-react';
import { Upgrades, VehicleId, StageId } from '../types/game';
import { VEHICLES } from '../config/vehicles';
import { STAGES } from '../config/stages';
import { soundManager } from '../audio/soundManager';
import { getAssetUrl } from '../physics/assetLoader';

interface TitleScreenProps {
  bestDistance: number;
  totalCoins: number;
  upgrades: Upgrades;
  selectedVehicleId: VehicleId;
  unlockedVehicles: VehicleId[];
  selectedStageId: StageId;
  unlockedStages: StageId[];
  onSelectVehicle: (id: VehicleId) => void;
  onSelectStage: (id: StageId) => void;
  onStartGame: () => void;
  onOpenGarage: () => void;
  onToggleFullScreen?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  bestDistance,
  totalCoins,
  upgrades,
  selectedVehicleId,
  unlockedVehicles,
  selectedStageId,
  unlockedStages,
  onSelectVehicle,
  onSelectStage,
  onStartGame,
  onOpenGarage,
  onToggleFullScreen
}) => {
  const currentVehicle = VEHICLES[selectedVehicleId] || VEHICLES.red_speedster;
  const currentStage = STAGES[selectedStageId] || STAGES.stage_1_green_hills;

  const safeBest = Number.isFinite(bestDistance) ? Math.max(0, Math.floor(bestDistance)) : 0;
  const safeCoins = Number.isFinite(totalCoins) ? Math.max(0, Math.floor(totalCoins)) : 0;

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] p-3 sm:p-6 pointer-events-auto bg-gradient-to-b from-slate-950/85 via-slate-950/50 to-slate-950/95 select-none overflow-y-auto">
      {/* Topo: Estatísticas e Moedas */}
      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 text-white">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Recorde:</span>
            <span className="font-racing font-bold text-xs sm:text-sm text-emerald-400 tabular-nums">
              {safeBest} m
            </span>
          </div>

          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 text-white">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Moedas:</span>
            <span className="font-racing font-bold text-xs sm:text-sm text-amber-400 tabular-nums">
              {safeCoins}🪙
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-1.5 text-amber-300 font-racing font-bold text-xs uppercase transition shadow-lg active:scale-95"
              title="Alternar Tela Cheia"
            >
              <Maximize className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Tela Cheia</span>
            </button>
          )}

          <button
            onClick={onOpenGarage}
            className="bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 text-white font-racing font-bold text-xs uppercase transition shadow-lg active:scale-95"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Garagem & Loja</span>
          </button>
        </div>
      </div>

      {/* Centro: Título & Seletor de Carros e Cenários */}
      <div className="flex flex-col items-center justify-center text-center my-auto max-w-3xl mx-auto py-2">
        <h1 className="font-racing font-extrabold text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 tracking-wider uppercase mb-1 drop-shadow-md">
          Hill Climb Pro
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mb-3 leading-relaxed">
          Suba serras extremas com física 2D real, desbloqueie carros e conquiste novos cenários!
        </p>

        {/* Card do Cenário Ativo */}
        <div className="w-full max-w-xl bg-slate-900/80 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 mb-3 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
              <img
                src={getAssetUrl(currentStage.thumbnail)}
                alt={currentStage.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{currentStage.icon}</span>
                <span className="font-racing font-bold text-xs sm:text-sm text-white uppercase">
                  {currentStage.name}
                </span>
                <span className="text-[10px] text-amber-400 font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                  Cenário Ativo
                </span>
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1">{currentStage.subtitle}</div>
            </div>
          </div>

          <button
            onClick={onOpenGarage}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 font-racing font-bold text-xs uppercase transition shrink-0"
          >
            Trocar Cenário
          </button>
        </div>

        {/* Barra de Seleção Rápida dos 3 Carros */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-xl mb-4">
          {Object.values(VEHICLES).map((v) => {
            const isSelected = selectedVehicleId === v.id;
            const isUnlocked = unlockedVehicles.includes(v.id);

            return (
              <button
                key={v.id}
                onClick={() => {
                  if (isUnlocked) {
                    soundManager.playCoin();
                    onSelectVehicle(v.id);
                  } else {
                    onOpenGarage();
                  }
                }}
                className={`relative rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-between transition-all border text-left ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                    : isUnlocked
                    ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                {/* Imagem do carro */}
                <div className="h-12 sm:h-14 flex items-center justify-center relative w-full mb-1">
                  <img
                    src={getAssetUrl(v.bodyImage)}
                    alt={v.name}
                    className="max-h-10 sm:max-h-11 max-w-[90%] object-contain drop-shadow"
                  />
                  <img
                    src={getAssetUrl(v.headImage)}
                    alt={v.driverName}
                    className="absolute w-5 h-5 sm:w-6 sm:h-6 object-contain top-0 left-[28%]"
                  />
                </div>

                <div className="w-full text-center">
                  <div className="font-racing font-bold text-[10px] sm:text-xs text-white uppercase truncate">
                    {v.name}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">{v.driverName}</div>
                </div>

                {isSelected ? (
                  <span className="mt-1 text-[8px] sm:text-[9px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Ativo
                  </span>
                ) : isUnlocked ? (
                  <span className="mt-1 text-[8px] sm:text-[9px] text-slate-400 uppercase">Selecionar</span>
                ) : (
                  <span className="mt-1 text-[8px] sm:text-[9px] text-amber-400 uppercase font-mono font-bold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    <Lock className="w-2.5 h-2.5 text-amber-400" /> ${v.unlockCost}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CTA Principal de Início */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-lg">
          <button
            type="button"
            onClick={onStartGame}
            className="w-full px-8 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-racing font-extrabold text-base sm:text-xl uppercase tracking-wider rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.45)] transition active:scale-95 flex items-center justify-center gap-3 cursor-pointer ring-4 ring-amber-400/40 hover:ring-amber-400 animate-pulse"
          >
            <Play className="w-6 h-6 fill-slate-950 text-slate-950" />
            <span>PILOTAR AGORA ({currentVehicle.name})</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
            <span className="text-[11px] text-amber-300 font-mono font-bold flex items-center gap-1">
              <span>🏁</span> Na Largada (0m) · Clique em PILOTAR para pontuar!
            </span>

            <button
              type="button"
              onClick={onOpenGarage}
              className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-white font-racing font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700/80 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Garagem & Loja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé: Linha de Controles */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5 max-w-5xl mx-auto w-full gap-2">
        <div className="font-racing tracking-wide text-slate-300">
          WASD ou Setas Mover · Espaço Nitro · Esc Pausar
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>Pista: <strong className="text-white">{currentStage.name}</strong></span>
          <span>·</span>
          <span>Piloto: <strong className="text-amber-400">{currentVehicle.driverName}</strong></span>
        </div>
      </div>
    </div>
  );
};
