import React from 'react';
import { Flame, Gauge, StepBack } from 'lucide-react';
import { KeyControls } from '../physics/engine';
import { soundManager } from '../audio/soundManager';

interface PedalsProps {
  controls: KeyControls;
  onSetControl: (key: keyof KeyControls, state: boolean) => void;
}

export const Pedals: React.FC<PedalsProps> = ({ controls, onSetControl }) => {
  const createHandlers = (key: keyof KeyControls) => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      soundManager.startEngine();
      onSetControl(key, true);
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.preventDefault();
      onSetControl(key, false);
    },
    onMouseLeave: () => {
      onSetControl(key, false);
    },
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      soundManager.startEngine();
      onSetControl(key, true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      onSetControl(key, false);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      onSetControl(key, false);
    }
  });

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-6 sm:right-6 flex justify-between items-end pointer-events-none z-20 select-none">
      {/* Pedal Esquerdo: Freio / Ré (Compacto e limpo, sem letras A/D) */}
      <button
        {...createHandlers('brake')}
        className={`pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-rose-500 to-rose-700 border-2 sm:border-3 border-rose-300/80 shadow-[0_4px_0_#881337,0_10px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-white transition-transform active:translate-y-1 active:brightness-110 active:shadow-[0_1px_0_#881337] ${
          controls.brake ? 'translate-y-1 brightness-110 shadow-[0_1px_0_#881337]' : ''
        }`}
        aria-label="Pedal de Freio e Marcha Ré"
      >
        <StepBack className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
        <span className="font-racing font-bold text-[10px] sm:text-xs tracking-wider uppercase">Freio / Ré</span>
      </button>

      {/* Grupo Direito: Turbo + Acelerador (Compactos e limpos) */}
      <div className="flex items-end gap-2 sm:gap-3 pointer-events-auto">
        {/* Botão de Turbo / Nitro */}
        <button
          {...createHandlers('boost')}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-b from-cyan-400 to-blue-600 border-2 border-cyan-200/80 shadow-[0_3px_0_#1e3a8a,0_8px_16px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center text-white transition-transform active:translate-y-1 active:brightness-110 active:shadow-[0_1px_0_#1e3a8a] ${
            controls.boost ? 'translate-y-1 brightness-110 shadow-[0_1px_0_#1e3a8a]' : ''
          }`}
          aria-label="Botão de Nitro e Turbo"
        >
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 mb-0.5" />
          <span className="font-racing font-bold text-[9px] sm:text-[10px] uppercase">Turbo</span>
        </button>

        {/* Pedal de Aceleração */}
        <button
          {...createHandlers('gas')}
          className={`w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 border-2 sm:border-3 border-emerald-200/90 shadow-[0_5px_0_#065f46,0_12px_22px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-white transition-transform active:translate-y-1 active:brightness-110 active:shadow-[0_1px_0_#065f46] ${
            controls.gas ? 'translate-y-1 brightness-110 shadow-[0_1px_0_#065f46]' : ''
          }`}
          aria-label="Pedal do Acelerador"
        >
          <Gauge className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" />
          <span className="font-racing font-bold text-xs sm:text-sm tracking-wider uppercase">Acelerar</span>
        </button>
      </div>
    </div>
  );
};
