import React from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';

export interface LevelCelebrationData {
  completedLevel: number;
  newLevel: number;
  nextTargetMeters: number;
  rewardCoins: number;
}

interface LevelCelebrationProps {
  data: LevelCelebrationData;
}

export const LevelCelebration: React.FC<LevelCelebrationProps> = ({ data }) => {
  const confettiPieces = Array.from({ length: 20 }, (_, i) => {
    const left = `${Math.floor(Math.random() * 80 + 10)}%`;
    const delay = `${(Math.random() * 0.3).toFixed(2)}s`;
    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#fbbf24'];
    const color = colors[i % colors.length];
    const size = `${Math.floor(Math.random() * 6 + 4)}px`;
    return { left, delay, color, size, id: i };
  });

  return (
    <div className="fixed top-12 sm:top-14 left-1/2 -translate-x-1/2 pointer-events-none z-40 flex flex-col items-center select-none w-auto max-w-[90vw]">
      {/* Chuva suave de Confetes no topo */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-80 h-32 overflow-hidden pointer-events-none">
        {confettiPieces.map((c) => (
          <div
            key={c.id}
            className="absolute top-0 animate-confetti rounded-sm"
            style={{
              left: c.left,
              animationDelay: c.delay,
              backgroundColor: c.color,
              width: c.size,
              height: c.size
            }}
          />
        ))}
      </div>

      {/* Alerta Compacto Estilo Banner Pill (Não obstrui a pista nem o carro) */}
      <div className="animate-level-celebrate flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-slate-900/95 border border-amber-400/90 backdrop-blur-md shadow-[0_8px_24px_rgba(245,158,11,0.35)]">
        {/* Ícone de Troféu Compacto */}
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center shadow shrink-0">
          <Trophy className="w-4 h-4 text-slate-950 fill-slate-950" />
        </div>

        {/* Informações em Linha Compacta */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-racing font-extrabold text-[11px] sm:text-xs uppercase tracking-wide text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
              Nível {data.completedLevel} Concluído!
            </span>
            <span className="font-racing font-black text-xs sm:text-sm text-yellow-300 bg-amber-500/25 px-1.5 py-0.5 rounded-md border border-amber-400/40">
              +{data.rewardCoins} 🪙
            </span>
          </div>

          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-300 font-racing mt-0.5">
            <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            <span>Próxima Meta:</span>
            <span className="text-emerald-400 font-bold font-mono">
              Nível {data.newLevel} ({data.nextTargetMeters}m)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
