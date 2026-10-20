import React from 'react';
import { RotateCcw, Wrench, Trophy, Coins, AlertTriangle } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  reason: string;
  distance: number;
  bestDistance: number;
  runCoins: number;
  totalCoins: number;
  onRestart: () => void;
  onOpenGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  reason,
  distance,
  bestDistance,
  runCoins,
  totalCoins,
  onRestart,
  onOpenGarage
}) => {
  if (!isOpen) return null;

  const isNewRecord = distance >= bestDistance && distance > 0;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-6 text-center text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Ícone */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="font-racing font-bold text-2xl sm:text-3xl text-amber-400 uppercase tracking-wide mb-1">
          Fim da Subida!
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm mb-4 leading-relaxed max-w-sm mx-auto">
          {reason || 'O veículo não conseguiu prosseguir na trilha.'}
        </p>

        {/* Estatísticas da Corrida */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 mb-4 text-center">
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Distância</div>
            <div className="font-racing font-bold text-xl sm:text-2xl text-white tabular-nums">
              {distance} m
            </div>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span>Recorde</span>
            </div>
            <div className={`font-racing font-bold text-xl sm:text-2xl tabular-nums ${isNewRecord ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {bestDistance} m
            </div>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>Ganhos</span>
            </div>
            <div className="font-racing font-bold text-lg text-amber-400 tabular-nums">
              +{runCoins}
            </div>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Total</div>
            <div className="font-racing font-bold text-lg text-slate-200 tabular-nums">
              ${totalCoins}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-racing font-bold text-base sm:text-lg uppercase rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Tentar Novamente</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-racing font-bold text-sm uppercase rounded-xl transition flex items-center justify-center gap-2"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Oficina de Upgrades</span>
          </button>
        </div>

        <span className="text-[10px] text-slate-500 mt-3 block">
          Pressione [Enter] ou [Espaço] para reiniciar a corrida
        </span>
      </div>
    </div>
  );
};
