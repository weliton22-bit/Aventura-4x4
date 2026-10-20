import React from 'react';
import { Wrench, ArrowUpDown, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { SuspensionConfig } from '../types/game';

interface SuspensionTuningPanelProps {
  isOpen: boolean;
  config: SuspensionConfig;
  onChangeConfig: (newConfig: SuspensionConfig) => void;
  onBounceTest: () => void;
  onResetCar: () => void;
  onToggleOpen: () => void;
}

export const SuspensionTuningPanel: React.FC<SuspensionTuningPanelProps> = ({
  isOpen,
  config,
  onChangeConfig,
  onBounceTest,
  onResetCar,
  onToggleOpen
}) => {
  if (!isOpen) return null;

  const handlePreset = (type: 'soft' | 'trail' | 'stiff') => {
    if (type === 'soft') {
      onChangeConfig({ ...config, stiffness: 160, damping: 8, restLength: 56 });
    } else if (type === 'trail') {
      onChangeConfig({ ...config, stiffness: 240, damping: 13, restLength: 52 });
    } else if (type === 'stiff') {
      onChangeConfig({ ...config, stiffness: 360, damping: 22, restLength: 44 });
    }
  };

  const stiffnessDesc = config.stiffness < 190 ? 'Macia' : config.stiffness > 310 ? 'Dura' : 'Média';
  const dampingDesc = config.damping < 10 ? 'Oscilante' : config.damping > 19 ? 'Firme' : 'Equilibrado';

  return (
    <div className="fixed top-20 right-3 sm:right-5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 sm:p-4 text-white shadow-2xl pointer-events-auto w-64 sm:w-72 z-20">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-racing font-bold uppercase tracking-wider text-cyan-400">
          <Wrench className="w-3.5 h-3.5" />
          <span>Ajuste de Amortecimento</span>
        </div>
        <button
          onClick={onToggleOpen}
          className="text-xs text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Fechar Painel de Suspensão"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 pt-2 text-xs">
        {/* Rigidez da Mola */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Rigidez da Mola (K)</span>
            <span className="text-amber-400 font-bold font-mono">{stiffnessDesc}</span>
          </div>
          <input
            type="range"
            min="120"
            max="420"
            value={config.stiffness}
            onChange={(e) => onChangeConfig({ ...config, stiffness: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Amortecimento */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Amortecimento Hidráulico (C)</span>
            <span className="text-amber-400 font-bold font-mono">{dampingDesc}</span>
          </div>
          <input
            type="range"
            min="4"
            max="28"
            value={config.damping}
            onChange={(e) => onChangeConfig({ ...config, damping: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Altura da Suspensão */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Altura Livre (Curso)</span>
            <span className="text-amber-400 font-bold font-mono">{config.restLength} mm</span>
          </div>
          <input
            type="range"
            min="36"
            max="70"
            value={config.restLength}
            onChange={(e) => onChangeConfig({ ...config, restLength: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Presets Rápidos */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={() => handlePreset('soft')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg border border-slate-700 font-semibold text-[11px] transition text-center"
          >
            Macia
          </button>
          <button
            onClick={() => handlePreset('trail')}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 py-1.5 rounded-lg border border-amber-500/40 font-semibold text-[11px] transition text-center"
          >
            Trilha
          </button>
          <button
            onClick={() => handlePreset('stiff')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg border border-slate-700 font-semibold text-[11px] transition text-center"
          >
            Firme
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="pt-2 flex gap-2 border-t border-slate-800">
          <button
            onClick={onBounceTest}
            className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 py-1.5 rounded-xl border border-cyan-500/40 font-semibold text-xs transition flex items-center justify-center gap-1"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Testar Salto</span>
          </button>
          <button
            onClick={onResetCar}
            className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 py-1.5 rounded-xl border border-rose-500/40 font-semibold text-xs transition flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
