import React from 'react';
import { Play, Wrench, MapPin, Award, Maximize, Volume2, VolumeX } from 'lucide-react';
import { GameState } from '../types/game';
import menuBgImg from '../assets/menu-bg.jpg';

interface TitleScreenProps {
  totalCoins: number;
  bestDistance: number;
  isMuted?: boolean;
  onStartGame: () => void;
  onNavigate: (screen: GameState) => void;
  onToggleMute?: () => void;
  onToggleFullScreen?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  totalCoins,
  bestDistance,
  isMuted,
  onStartGame,
  onNavigate,
  onToggleMute,
  onToggleFullScreen
}) => {
  const safeCoins = Number.isFinite(totalCoins) ? Math.max(0, Math.floor(totalCoins)) : 0;
  const safeBest = Number.isFinite(bestDistance) ? Math.max(0, Math.floor(bestDistance)) : 0;

  return (
    <div
      className="title-screen-container fixed inset-0 z-30 flex flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] p-4 sm:p-8 pointer-events-auto select-none overflow-y-auto max-h-[100dvh] touch-pan-y"
      style={{
        backgroundImage: `url(${menuBgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Topo Discreto: Saldo de Moedas e Ações */}
      <div className="title-header-wrapper flex justify-between items-center max-w-4xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 text-white shadow">
            <span className="text-xs">🪙</span>
            <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Moedas:</span>
            <span className="font-racing font-bold text-xs sm:text-sm text-amber-400 tabular-nums">
              {safeCoins}
            </span>
          </div>

          {safeBest > 0 && (
            <div className="hidden sm:flex bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 items-center gap-1.5 text-slate-300 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Recorde:</span>
              <span className="font-racing font-bold text-emerald-400">{safeBest}m</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow active:scale-95"
              title={isMuted ? 'Ativar Som' : 'Desativar Som'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}

          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-white transition shadow active:scale-95"
              title="Tela Cheia"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Centro: Título "Aventura 4x4" e os 4 Botões Principais sobrepostos à arte */}
      <div className="my-auto max-w-md mx-auto w-full text-center flex flex-col items-center">
        {/* Título Principal */}
        <div className="title-heading-wrapper mb-5 sm:mb-7 shrink-0">
          <h1 className="title-screen-heading font-racing font-black text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 tracking-wider uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            Aventura 4x4
          </h1>
          <p className="title-screen-subheading text-amber-100 font-racing font-bold text-xs sm:text-sm tracking-widest uppercase mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            Desafio Off-Road de Física 2D
          </p>
        </div>

        {/* Fundo escuro semi-transparente e os 4 Botões Principais */}
        <div className="title-buttons-panel w-full">
          <div className="title-screen-buttons-grid w-full space-y-3 sm:space-y-3.5">
            {/* 1. Botão Iniciar */}
            <button
              onClick={onStartGame}
              className="title-btn-primary w-full py-4 sm:py-4.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-racing font-black text-lg sm:text-xl uppercase tracking-wider shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-emerald-300/40 hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              <Play className="w-6 h-6 fill-white drop-shadow" />
              <span>Iniciar</span>
            </button>

            {/* 2. Botão Garagem */}
            <button
              onClick={() => onNavigate('GARAGE')}
              className="title-btn-secondary w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-racing font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-[0_8px_20px_rgba(0,0,0,0.55)] border border-amber-300/50 hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            >
              <Wrench className="w-5 h-5 text-slate-950" />
              <span>Garagem</span>
            </button>

            {/* 3. Botão Cenários */}
            <button
              onClick={() => onNavigate('STAGES')}
              className="title-btn-secondary w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-racing font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-[0_8px_20px_rgba(0,0,0,0.55)] border border-cyan-400/50 hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              <MapPin className="w-5 h-5 text-cyan-200" />
              <span>Cenários</span>
            </button>

            {/* 4. Botão Créditos */}
            <button
              onClick={() => onNavigate('CREDITS')}
              className="title-btn-secondary w-full py-2.5 sm:py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 font-racing font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(0,0,0,0.55)] active:scale-98 transition flex items-center justify-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Créditos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
