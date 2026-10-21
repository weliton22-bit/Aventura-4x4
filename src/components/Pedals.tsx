import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { KeyControls } from '../physics/engine';
import { soundManager } from '../audio/soundManager';
import { getAssetUrl } from '../physics/assetLoader';

interface PedalsProps {
  controls: KeyControls;
  onSetControl: (key: keyof KeyControls, state: boolean) => void;
}

export const Pedals: React.FC<PedalsProps> = ({ controls, onSetControl }) => {
  // Estado local para resposta visual imediata (0ms de atraso nos neons e no afundamento 3D)
  const [localPressed, setLocalPressed] = useState<{ gas: boolean; brake: boolean; boost: boolean }>({
    gas: false,
    brake: false,
    boost: false
  });

  const isBrakeActive = controls.brake || localPressed.brake;
  const isBoostActive = controls.boost || localPressed.boost;
  const isGasActive = controls.gas || localPressed.gas;

  const createHandlers = (key: keyof KeyControls) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback para navegadores legados
      }
      setLocalPressed((prev) => ({ ...prev, [key]: true }));
      soundManager.startEngine();
      onSetControl(key, true);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignora erro
      }
      setLocalPressed((prev) => ({ ...prev, [key]: false }));
      onSetControl(key, false);
    },
    onPointerCancel: () => {
      setLocalPressed((prev) => ({ ...prev, [key]: false }));
      onSetControl(key, false);
    },
    onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.hasPointerCapture || !e.currentTarget.hasPointerCapture(e.pointerId)) {
        setLocalPressed((prev) => ({ ...prev, [key]: false }));
        onSetControl(key, false);
      }
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault()
  });

  const brakeImg = getAssetUrl('/assets/aistudio/gas-pedal_freio_9916b333.png');
  const gasImg = getAssetUrl('/assets/aistudio/pedal_acelera__o_ccedc7bf.png');

  return (
    <div className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] flex justify-between items-end pointer-events-none z-20 select-none pb-1">
      {/* ============================================================ */}
      {/* LADO ESQUERDO: PRIMEIRO O FREIO/RÉ, DEPOIS O TURBO AO LADO   */}
      {/* ============================================================ */}
      <div className="flex items-end gap-3 sm:gap-4 pointer-events-auto">
        {/* 1. PEDAL DE FREIO / RÉ (NEON VERMELHO ULTRA INSTANTÂNEO & AFUNDAMENTO) */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            {...createHandlers('brake')}
            style={{ touchAction: 'none' }}
            className="relative flex flex-col items-center justify-end p-0.5 select-none cursor-pointer focus:outline-none"
            aria-label="Pedal de Freio e Marcha Ré"
          >
            {/* Caixa cavidade do pedal (Well / Footwell) */}
            <div
              className={`w-20 h-22 sm:w-24 sm:h-26 rounded-2xl border-2 transition-all duration-75 ease-out flex flex-col items-center justify-center p-2 relative overflow-hidden ${
                isBrakeActive
                  ? 'bg-slate-950 border-rose-500 shadow-[inset_0_8px_16px_rgba(0,0,0,0.95),0_0_25px_rgba(244,63,94,0.7),0_0_45px_rgba(225,29,72,0.4)]'
                  : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-slate-700/80 shadow-[0_8px_20px_rgba(0,0,0,0.7)] hover:border-slate-600'
              }`}
              style={{ perspective: '400px' }}
            >
              {/* Luz vermelha do stop/hidráulico refletida no fundo - Resposta Imediata */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-rose-600/60 via-rose-900/35 to-transparent transition-opacity duration-75 pointer-events-none ${
                  isBrakeActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Placa metálica do Pedal com articulação 3D (Hinge) superior */}
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                  transformOrigin: 'top center',
                  transform: isBrakeActive
                    ? 'rotateX(38deg) translateY(16px) scale(0.78)'
                    : 'rotateX(0deg) translateY(0px) scale(1)'
                }}
              >
                <img
                  src={brakeImg}
                  alt="Pedal de Freio"
                  className={`w-16 h-18 sm:w-20 sm:h-22 object-contain pointer-events-none transition-all duration-75 ${
                    isBrakeActive
                      ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] brightness-125'
                      : 'drop-shadow-[0_8px_12px_rgba(0,0,0,0.7)]'
                  }`}
                  draggable={false}
                />
              </div>

              {/* Indicador luminoso de frenagem ativa (Neon Vermelho Laser contínuo e sem lag) */}
              {isBrakeActive && (
                <div className="absolute bottom-1 w-10 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e,0_0_20px_#f43f5e,0_0_35px_#e11d48]" />
              )}
            </div>
          </button>
          <span
            className={`font-racing font-extrabold text-[10px] sm:text-xs tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-1 transition-colors ${
              isBrakeActive ? 'text-rose-400 font-black drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-slate-300'
            }`}
          >
            Freio / Ré
          </span>
        </div>

        {/* 2. BOTÃO / PEDAL DE TURBO (NITRO) AO LADO DO FREIO */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            {...createHandlers('boost')}
            style={{ touchAction: 'none' }}
            className="relative flex flex-col items-center justify-end p-0.5 select-none cursor-pointer focus:outline-none"
            aria-label="Pedal de Turbo e Nitro"
          >
            {/* Caixa cavidade do pedal turbo */}
            <div
              className={`w-16 h-22 sm:w-19 sm:h-26 rounded-2xl border-2 transition-all duration-75 ease-out flex flex-col items-center justify-center p-2 relative overflow-hidden ${
                isBoostActive
                  ? 'bg-slate-950 border-cyan-400 shadow-[inset_0_8px_16px_rgba(0,0,0,0.95),0_0_25px_rgba(6,182,212,0.7),0_0_45px_rgba(14,165,233,0.4)]'
                  : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-cyan-500/70 shadow-[0_8px_20px_rgba(6,182,212,0.25)] hover:border-cyan-400'
              }`}
              style={{ perspective: '400px' }}
            >
              {/* Brilho neon de nitro */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-cyan-500/50 via-blue-600/30 to-transparent transition-opacity duration-75 pointer-events-none ${
                  isBoostActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Badge visual de Chama Turbo */}
              <div className="absolute top-1 right-1 bg-cyan-500/80 rounded-full p-0.5 shadow z-10">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-300 fill-yellow-300 animate-pulse" />
              </div>

              {/* Placa do pedal com rotação e afundamento */}
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                  transformOrigin: 'top center',
                  transform: isBoostActive
                    ? 'rotateX(36deg) translateY(14px) scale(0.80)'
                    : 'rotateX(0deg) translateY(0px) scale(1)'
                }}
              >
                <img
                  src={gasImg}
                  alt="Pedal de Turbo"
                  className={`w-12 h-16 sm:w-15 sm:h-20 object-contain pointer-events-none transition-all duration-75 hue-rotate-180 ${
                    isBoostActive
                      ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] brightness-140'
                      : 'drop-shadow-[0_8px_12px_rgba(6,182,212,0.5)] brightness-110'
                  }`}
                  draggable={false}
                />
              </div>

              {/* Indicador luminoso de nitro ativo */}
              {isBoostActive && (
                <div className="absolute bottom-1 w-8 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee,0_0_20px_#22d3ee,0_0_35px_#06b6d4]" />
              )}
            </div>
          </button>
          <span
            className={`font-racing font-extrabold text-[10px] sm:text-xs tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-1 flex items-center gap-0.5 transition-colors ${
              isBoostActive ? 'text-cyan-300 font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-slate-300'
            }`}
          >
            <Flame className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
            Turbo
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LADO DIREITO: PEDAL DE ACELERAÇÃO (AFUNDAMENTO PROFUNDO)     */}
      {/* ============================================================ */}
      <div className="flex flex-col items-center pointer-events-auto">
        <button
          type="button"
          {...createHandlers('gas')}
          style={{ touchAction: 'none' }}
          className="relative flex flex-col items-center justify-end p-0.5 select-none cursor-pointer focus:outline-none"
          aria-label="Pedal do Acelerador"
        >
          {/* Caixa cavidade do pedal acelerador */}
          <div
            className={`w-20 h-24 sm:w-24 sm:h-28 rounded-2xl border-2 transition-all duration-75 ease-out flex flex-col items-center justify-center p-2 relative overflow-hidden ${
              isGasActive
                ? 'bg-slate-950 border-emerald-400 shadow-[inset_0_8px_16px_rgba(0,0,0,0.95),0_0_25px_rgba(16,185,129,0.7),0_0_45px_rgba(5,150,105,0.4)]'
                : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-emerald-500/70 shadow-[0_8px_22px_rgba(16,185,129,0.3)] hover:border-emerald-400'
            }`}
            style={{ perspective: '400px' }}
          >
            {/* Brilho verde esmeralda de aceleração */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-emerald-500/45 via-emerald-800/25 to-transparent transition-opacity duration-75 pointer-events-none ${
                isGasActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Placa do acelerador com rotação e afundamento em direção ao fundo */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transformOrigin: 'bottom center',
                transform: isGasActive
                  ? 'rotateX(-34deg) translateY(16px) scale(0.82)'
                  : 'rotateX(0deg) translateY(0px) scale(1)'
              }}
            >
              <img
                src={gasImg}
                alt="Pedal do Acelerador"
                className={`w-15 h-20 sm:w-18 sm:h-24 object-contain pointer-events-none transition-all duration-75 ${
                  isGasActive
                    ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] brightness-125'
                    : 'drop-shadow-[0_8px_14px_rgba(0,0,0,0.7)]'
                }`}
                draggable={false}
              />
            </div>

            {/* Indicador luminoso de aceleração ativa */}
            {isGasActive && (
              <div className="absolute bottom-1 w-10 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399,0_0_20px_#34d399,0_0_35px_#059669]" />
            )}
          </div>
        </button>
        <span
          className={`font-racing font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-1 transition-colors ${
            isGasActive ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-slate-300'
          }`}
        >
          Acelerar
        </span>
      </div>
    </div>
  );
};
