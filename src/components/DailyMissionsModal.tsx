import React, { useState, useEffect } from 'react';
import { X, Target, Clock, CheckCircle2, Gift, Sparkles, Flag, Coins, Fuel, Gauge, Award, Mountain, Wind } from 'lucide-react';
import { DailyMission, DailyMissionsState } from '../types/missions';
import { loadDailyMissions, claimReward, countUnclaimedMissions, getTimeUntilReset } from '../utils/missionsManager';
import { soundManager } from '../audio/soundManager';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (coins: number) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed
}) => {
  const [missionsState, setMissionsState] = useState<DailyMissionsState>(loadDailyMissions);
  const [timeLeft, setTimeLeft] = useState<string>(getTimeUntilReset);
  const [claimedAnimationId, setClaimedAnimationId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMissionsState(loadDailyMissions());
      setTimeLeft(getTimeUntilReset());
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilReset());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const handleClaim = (mission: DailyMission) => {
    const reward = claimReward(mission.id);
    if (reward > 0) {
      soundManager.playCoin();
      setClaimedAnimationId(mission.id);
      setTimeout(() => setClaimedAnimationId(null), 1000);
      setMissionsState(loadDailyMissions());
      onRewardClaimed(reward);
    }
  };

  const completedCount = missionsState.missions.filter((m) => m.completed).length;
  const unclaimedCount = countUnclaimedMissions(missionsState);

  const getMissionIcon = (iconName: string) => {
    switch (iconName) {
      case 'flag':
        return <Flag className="w-5 h-5 text-cyan-400" />;
      case 'coins':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'fuel':
        return <Fuel className="w-5 h-5 text-rose-400" />;
      case 'terrain':
        return <Mountain className="w-5 h-5 text-emerald-400" />;
      case 'wing':
        return <Wind className="w-5 h-5 text-cyan-300" />;
      case 'gauge':
        return <Gauge className="w-5 h-5 text-emerald-400" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-yellow-300" />;
      default:
        return <Award className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-400/80 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow">
              <Target className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="font-racing font-extrabold text-base sm:text-lg text-white uppercase tracking-wider flex items-center gap-2">
                Missões Diárias
                {unclaimedCount > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full animate-bounce">
                    {unclaimedCount} para resgatar!
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-mono">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Atualiza em: <strong className="text-cyan-300">{timeLeft}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Fechar Missões Diárias"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso Geral do Dia */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-racing text-slate-300">
            Progresso de Hoje: <strong className="text-amber-400">{completedCount} / {missionsState.missions.length} Concluídas</strong>
          </span>
          <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / missionsState.missions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Lista de Missões */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {missionsState.missions.map((mission) => {
            const progressPct = Math.min(100, Math.round((mission.current / mission.target) * 100));
            const isAnimating = claimedAnimationId === mission.id;

            return (
              <div
                key={mission.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  mission.claimed
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                    : mission.completed
                    ? 'bg-gradient-to-r from-amber-950/30 to-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                } ${isAnimating ? 'scale-105 transition-transform' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      {getMissionIcon(mission.iconName)}
                    </div>
                    <div>
                      <h3 className="font-racing font-bold text-xs sm:text-sm text-white tracking-wide">
                        {mission.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                        {mission.description}
                      </p>
                    </div>
                  </div>

                  {/* Recompensa */}
                  <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-400/40 px-2.5 py-1 rounded-xl shrink-0">
                    <span className="text-xs">🪙</span>
                    <span className="font-racing font-black text-xs text-amber-300">
                      +{mission.rewardCoins}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso e Ação */}
                <div className="mt-3 flex items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Progresso:</span>
                      <span className="font-bold text-slate-200">
                        {mission.current} / {mission.target} {mission.unit} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          mission.completed
                            ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Botão de Resgate */}
                  <div className="shrink-0">
                    {mission.claimed ? (
                      <span className="flex items-center gap-1 text-[10px] font-racing font-bold text-slate-500 bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-700/40">
                        <CheckCircle2 className="w-3 h-3 text-slate-500" />
                        Resgatado
                      </span>
                    ) : mission.completed ? (
                      <button
                        onClick={() => handleClaim(mission)}
                        className="flex items-center gap-1.5 text-xs font-racing font-extrabold uppercase px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition animate-pulse"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        Resgatar!
                      </button>
                    ) : (
                      <span className="text-[10px] font-racing font-semibold text-slate-400 bg-slate-800/40 px-2.5 py-1.5 rounded-xl border border-slate-700/30">
                        Em andamento
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé Informativo */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 font-racing">
            Volte todos os dias para completar novos desafios e ganhar moedas extras para turbinar seus carros!
          </p>
        </div>
      </div>
    </div>
  );
};
