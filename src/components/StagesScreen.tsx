import React from 'react';
import { ArrowLeft, Check, Lock, MapPin, Sparkles } from 'lucide-react';
import { StageId } from '../types/game';
import { STAGE_LIST } from '../config/stages';
import { soundManager } from '../audio/soundManager';

interface StagesScreenProps {
  totalCoins: number;
  selectedStageId: StageId;
  unlockedStages: StageId[];
  onSelectStage: (id: StageId) => void;
  onUnlockStage: (id: StageId, cost: number) => void;
  onBackToMenu: () => void;
}

export const StagesScreen: React.FC<StagesScreenProps> = ({
  totalCoins,
  selectedStageId,
  unlockedStages,
  onSelectStage,
  onUnlockStage,
  onBackToMenu
}) => {
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-3 sm:p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white select-none overflow-y-auto">
      {/* Topo com botão de Voltar e Moedas */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full mb-3">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-racing font-bold text-xs uppercase transition shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Voltar ao Menu</span>
        </button>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 text-white">
          <span className="text-xs">🪙</span>
          <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Saldo:</span>
          <span className="font-racing font-bold text-xs sm:text-sm text-amber-400 tabular-nums">
            {totalCoins}
          </span>
        </div>
      </div>

      {/* Título Central */}
      <div className="text-center max-w-2xl mx-auto mb-4">
        <h1 className="font-racing font-extrabold text-2xl sm:text-4xl text-amber-400 uppercase tracking-wide flex items-center justify-center gap-2">
          <MapPin className="w-7 h-7 text-amber-400" />
          Cenários & Pistas
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Escolha onde pilotar ou use suas moedas para desbloquear novas regiões com desafios únicos!
        </p>
      </div>

      {/* Grid de Cenários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-4xl mx-auto w-full my-auto">
        {STAGE_LIST.map((stage) => {
          const isUnlocked = unlockedStages.includes(stage.id);
          const isSelected = selectedStageId === stage.id;
          const canAfford = totalCoins >= stage.price;

          return (
            <div
              key={stage.id}
              className={`relative rounded-3xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                  : isUnlocked
                  ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-80'
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start gap-3 mb-2.5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shrink-0 relative">
                  <img
                    src={stage.thumbnail}
                    alt={stage.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1 right-1 text-base">{stage.icon}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-racing font-bold text-sm sm:text-base text-white">
                      {stage.name}
                    </h3>
                    {isSelected && (
                      <span className="text-[10px] font-racing font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
                        Ativa
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-300 font-medium block">
                    {stage.subtitle}
                  </span>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {stage.description}
                  </p>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-mono">
                  Ondulação: <strong className="text-slate-200">{stage.roughnessMultiplier}x</strong>
                </div>

                {isSelected ? (
                  <span className="flex items-center gap-1 text-xs font-racing font-extrabold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <Check className="w-3.5 h-3.5" />
                    Selecionada
                  </span>
                ) : isUnlocked ? (
                  <button
                    onClick={() => {
                      onSelectStage(stage.id);
                      soundManager.playCoin();
                    }}
                    className="flex items-center gap-1.5 text-xs font-racing font-extrabold uppercase px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 active:scale-95 transition"
                  >
                    Selecionar
                  </button>
                ) : (
                  <button
                    onClick={() => onUnlockStage(stage.id, stage.price)}
                    disabled={!canAfford}
                    className={`flex items-center gap-1.5 text-xs font-racing font-extrabold uppercase px-3.5 py-1.5 rounded-xl shadow transition active:scale-95 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110'
                        : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Desbloquear ({stage.price}🪙)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé com botão de voltar */}
      <div className="max-w-5xl mx-auto w-full flex justify-center mt-3 pt-2">
        <button
          onClick={onBackToMenu}
          className="px-6 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-racing font-bold text-xs uppercase transition shadow active:scale-95"
        >
          Retornar ao Menu Principal
        </button>
      </div>
    </div>
  );
};
