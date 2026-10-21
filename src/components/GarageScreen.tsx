import React, { useState } from 'react';
import { ArrowLeft, Zap, Disc, Compass, Fuel, CheckCircle2, Car, Lock, Play, Wrench, ArrowUpDown, X, Sparkles } from 'lucide-react';
import { Upgrades, VehicleId, VehicleUpgrades, SuspensionConfig } from '../types/game';
import { VEHICLES } from '../config/vehicles';
import { soundManager } from '../audio/soundManager';
import { getAssetUrl } from '../physics/assetLoader';
import { SuspensionVisualizer } from './SuspensionVisualizer';

interface GarageScreenProps {
  vehicleUpgrades: VehicleUpgrades;
  totalCoins: number;
  selectedVehicleId: VehicleId;
  unlockedVehicles: VehicleId[];
  suspensionConfig: SuspensionConfig;
  onChangeSuspension: (newConfig: SuspensionConfig) => void;
  onSelectVehicle: (id: VehicleId) => void;
  onUnlockVehicle: (id: VehicleId, cost: number) => void;
  onUpgrade: (vehicleId: VehicleId, key: keyof Upgrades, cost: number) => void;
  onBackToMenu: () => void;
  onStartGame?: () => void;
}

interface UpgradeCardDef {
  key: keyof Upgrades;
  title: string;
  subtitle: string;
  tagline: string;
  icon: React.ReactNode;
  baseCost: number;
  commentHint: string;
  statLabel: (lvl: number) => string;
}

// 4 Cartas na ordem estrita solicitada:
// 1. Motor
// 2. Suspensão
// 3. Pneus e Tração
// 4. Combustível
const UPGRADE_CARDS: UpgradeCardDef[] = [
  {
    key: 'engine',
    title: 'Motor',
    subtitle: 'Potência & Torque',
    tagline: 'Mais arranque nas subidas',
    icon: <Zap className="w-10 h-10 text-amber-400" />,
    baseCost: 50,
    commentHint: 'inserir imagem da engrenagem aqui',
    statLabel: (lvl) => `${1500 + lvl * 260} Nm Torque`
  },
  {
    key: 'suspension',
    title: 'Suspensão',
    subtitle: 'Molas & Cursos',
    tagline: 'Absorção contra impacto',
    icon: <Compass className="w-10 h-10 text-emerald-400" />,
    baseCost: 40,
    commentHint: 'inserir imagem da mola aqui',
    statLabel: (lvl) => `Estabilidade +${lvl * 10}%`
  },
  {
    key: 'tires',
    title: 'Pneus e Tração',
    subtitle: 'Grip 4x4 Integral',
    tagline: 'Aderência em aclives',
    icon: <Disc className="w-10 h-10 text-cyan-400" />,
    baseCost: 45,
    commentHint: 'inserir imagem do pneu aqui',
    statLabel: (lvl) => `Grip 4WD +${lvl * 12}%`
  },
  {
    key: 'fuelTank',
    title: 'Combustível',
    subtitle: 'Capacidade do Tanque',
    tagline: 'Mais autonomia na pista',
    icon: <Fuel className="w-10 h-10 text-rose-400" />,
    baseCost: 60,
    commentHint: 'inserir imagem do galão aqui',
    statLabel: (lvl) => `${100 + (lvl - 1) * 15} Litros`
  }
];

export const GarageScreen: React.FC<GarageScreenProps> = ({
  vehicleUpgrades,
  totalCoins,
  selectedVehicleId,
  unlockedVehicles,
  suspensionConfig,
  onChangeSuspension,
  onSelectVehicle,
  onUnlockVehicle,
  onUpgrade,
  onBackToMenu,
  onStartGame
}) => {
  // Controle dos Menus Secundários (Painéis Flutuantes)
  const [isCarSelectOpen, setIsCarSelectOpen] = useState<boolean>(false);
  const [isTuningOpen, setIsTuningOpen] = useState<boolean>(false);
  const [isBouncing, setIsBouncing] = useState<boolean>(false);

  const currentUpgrades = vehicleUpgrades[selectedVehicleId] || { engine: 1, tires: 1, suspension: 1, fuelTank: 1 };
  const currentVehicleDef = VEHICLES[selectedVehicleId] || VEHICLES.red_speedster;

  const calculateCost = (baseCost: number, level: number) => {
    return Math.round(baseCost * Math.pow(1.42, level - 1));
  };

  const handleUpgradeClick = (item: UpgradeCardDef) => {
    const currentLevel = currentUpgrades[item.key] || 1;
    if (currentLevel >= 10) return;
    const cost = calculateCost(item.baseCost, currentLevel);
    if (totalCoins < cost) return;

    soundManager.playUpgrade();
    onUpgrade(selectedVehicleId, item.key, cost);
  };

  // Presets rápidos de suspensão
  const handlePreset = (type: 'soft' | 'trail' | 'stiff') => {
    soundManager.playUpgrade();
    if (type === 'soft') {
      onChangeSuspension({ ...suspensionConfig, stiffness: 160, damping: 8, restLength: 56 });
    } else if (type === 'trail') {
      onChangeSuspension({ ...suspensionConfig, stiffness: 240, damping: 13, restLength: 52 });
    } else if (type === 'stiff') {
      onChangeSuspension({ ...suspensionConfig, stiffness: 360, damping: 22, restLength: 44 });
    }
  };

  // Testar salto da suspensão
  const handleBounceTest = () => {
    soundManager.playUpgrade();
    setIsBouncing(true);
  };

  const stiffnessDesc = suspensionConfig.stiffness < 190 ? 'Macia' : suspensionConfig.stiffness > 310 ? 'Dura' : 'Média';
  const dampingDesc = suspensionConfig.damping < 10 ? 'Oscilante' : suspensionConfig.damping > 19 ? 'Firme' : 'Equilibrado';

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 md:p-6 bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 text-white select-none overflow-hidden">
      {/* ============================================================ */}
      {/* TOPO: RESUMO DO VEÍCULO SELECIONADO, SALDO E BOTÃO JOGAR     */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full gap-2 sm:gap-4 shrink-0 pb-1">
        {/* Veículo Ativo */}
        <div
          onClick={() => setIsCarSelectOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 shadow-md cursor-pointer transition active:scale-95 group"
          title="Clique para trocar de veículo"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden">
            <img
              src={getAssetUrl(currentVehicleDef.bodyImage)}
              alt={currentVehicleDef.name}
              className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-racing font-bold text-xs sm:text-sm text-white truncate">
                {currentVehicleDef.name}
              </span>
              <span className="text-[9px] font-racing uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Ativo
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Toque para trocar de carro
            </span>
          </div>
        </div>

        {/* Título Central Limpo */}
        <div className="text-center hidden md:block">
          <h1 className="font-racing font-black text-xl tracking-wider text-amber-400 uppercase drop-shadow">
            Oficina de Upgrades
          </h1>
          <p className="text-[10px] text-slate-400 tracking-wide">
            Evolua as 4 peças fundamentais do seu 4x4
          </p>
        </div>

        {/* Lado Direito: Saldo de Moedas & Ação Iniciar Corrida */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 text-white shadow shrink-0">
            <span className="text-sm">🪙</span>
            <span className="font-racing font-black text-xs sm:text-sm text-amber-400 tabular-nums">
              {totalCoins}
            </span>
          </div>

          {onStartGame && (
            <button
              onClick={onStartGame}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-racing font-extrabold text-xs uppercase shadow-lg shadow-emerald-500/25 active:scale-95 transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Correr</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CENTRO: 4 CARTAS RETANGULARES DE MELHORIAS LADO A LADO       */}
      {/* ============================================================ */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex items-center justify-center my-auto py-2">
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5 md:gap-4 w-full h-[330px] sm:h-[380px] md:h-[400px]">
          {UPGRADE_CARDS.map((item) => {
            const currentLevel = currentUpgrades[item.key] || 1;
            const isMax = currentLevel >= 10;
            const cost = isMax ? 0 : calculateCost(item.baseCost, currentLevel);
            const canAfford = !isMax && totalCoins >= cost;

            return (
              <div
                key={item.key}
                className="h-full flex flex-col justify-between p-2.5 sm:p-3.5 md:p-4 rounded-2xl sm:rounded-3xl bg-slate-900/75 backdrop-blur-md border border-slate-700/70 shadow-2xl hover:border-amber-400/60 hover:bg-slate-900/85 transition-all duration-200 group relative overflow-hidden"
              >
                {/* -------------------------------------------------------- */}
                {/* TOPO DA CARTA: PREÇO EM MOEDAS E NOME DA PEÇA            */}
                {/* -------------------------------------------------------- */}
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pb-2 border-b border-slate-800/80 shrink-0">
                  <div className="min-w-0">
                    <h3 className="font-racing font-extrabold text-xs sm:text-sm md:text-base text-white tracking-wide truncate">
                      {item.title}
                    </h3>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block truncate">
                      {item.subtitle}
                    </span>
                  </div>

                  {/* Preço em Moedas no Topo */}
                  {isMax ? (
                    <div className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-racing font-black text-[10px] sm:text-xs uppercase tracking-wider shrink-0">
                      MAX
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 font-racing font-extrabold text-[10px] sm:text-xs md:text-sm tabular-nums shrink-0 shadow-inner">
                      <span>🪙</span>
                      <span>{cost}</span>
                    </div>
                  )}
                </div>

                {/* -------------------------------------------------------- */}
                {/* CENTRO DA CARTA: TAG DE IMAGEM PREPARADA PARA ARQUIVOS   */}
                {/* -------------------------------------------------------- */}
                <div className="flex-1 w-full my-2 sm:my-3 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center p-2 sm:p-3 relative overflow-hidden group-hover:border-slate-700/90 transition-all">
                  {/* Tag de imagem configurada por carta com os assets enviados pelo usuário */}
                  {item.key === 'engine' && (
                    <img
                      src={getAssetUrl('/assets/aistudio/engrenagem_242918f7.png')} /* inserir imagem da engrenagem aqui */
                      alt="Motor"
                      className="max-h-24 sm:max-h-32 md:max-h-36 max-w-[90%] object-contain drop-shadow-[0_10px_20px_rgba(56,189,248,0.35)] z-10 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}

                  {item.key === 'suspension' && (
                    <img
                      src={getAssetUrl('/assets/aistudio/amortecedor_df4a2a09.jpg')} /* inserir imagem da mola aqui */
                      alt="Suspensão"
                      className="max-h-24 sm:max-h-32 md:max-h-36 max-w-[95%] object-contain rounded-xl p-1 bg-white/95 shadow-md drop-shadow-[0_10px_20px_rgba(244,63,94,0.3)] z-10 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}

                  {item.key === 'tires' && (
                    <img
                      src={getAssetUrl('/assets/aistudio/pneu_6805bc09.png')} /* inserir imagem do pneu aqui */
                      alt="Pneus e Tração"
                      className="max-h-24 sm:max-h-32 md:max-h-36 max-w-[90%] object-contain drop-shadow-[0_10px_20px_rgba(234,179,8,0.35)] z-10 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}

                  {item.key === 'fuelTank' && (
                    <img
                      src={getAssetUrl('/assets/aistudio/gasolina_58e7b239.png')} /* inserir imagem do galão aqui */
                      alt="Combustível"
                      className="max-h-24 sm:max-h-32 md:max-h-36 max-w-[90%] object-contain invert brightness-125 drop-shadow-[0_10px_20px_rgba(244,63,94,0.45)] z-10 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>

                {/* -------------------------------------------------------- */}
                {/* BASE DA CARTA: NÍVEL DA PEÇA E BOTÃO DE MELHORIA         */}
                {/* -------------------------------------------------------- */}
                <div className="w-full shrink-0 pt-1.5 sm:pt-2 border-t border-slate-800/80 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-slate-400 font-racing uppercase tracking-wider">
                      Nível
                    </span>
                    <span className="font-racing font-black text-amber-400 tabular-nums text-[11px] sm:text-xs">
                      NV {currentLevel} <span className="text-slate-600 font-normal">/ 10</span>
                    </span>
                  </div>

                  {/* Barra de 10 blocos de nível */}
                  <div className="grid grid-cols-10 gap-0.5 sm:gap-1 h-1.5 sm:h-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
                      <div
                        key={lvl}
                        className={`rounded-xs sm:rounded-sm transition-all duration-200 ${
                          lvl <= currentLevel
                            ? 'bg-gradient-to-t from-amber-500 to-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Botão de Upgrade Interativo */}
                  <button
                    onClick={() => handleUpgradeClick(item)}
                    disabled={isMax || !canAfford}
                    className={`w-full py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl font-racing font-extrabold text-[10px] sm:text-xs uppercase transition shadow active:scale-95 flex items-center justify-center gap-1 ${
                      isMax
                        ? 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-default'
                        : canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-800/70 text-slate-400 border border-slate-700/70 cursor-not-allowed opacity-75'
                    }`}
                  >
                    {isMax ? (
                      <span>Máximo</span>
                    ) : canAfford ? (
                      <span>Melhorar</span>
                    ) : (
                      <span>Sem 🪙</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* BARRA INFERIOR: AJUSTE AMORTECIMENTO E VOLTAR               */}
      {/* ============================================================ */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3 sm:gap-4 pt-2 pb-1 border-t border-slate-800/90 shrink-0 z-20">
        {/* 1. Ajuste de Amortecimento */}
        <button
          onClick={() => setIsTuningOpen(true)}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 hover:from-slate-800 hover:to-slate-750 border-2 border-slate-700 hover:border-cyan-400/80 text-slate-200 hover:text-white font-racing font-extrabold text-xs sm:text-sm uppercase tracking-wider transition shadow-xl active:scale-95 group"
        >
          <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
          <span>Ajuste de Amortecimento</span>
        </button>

        {/* 2. Voltar */}
        <button
          onClick={onBackToMenu}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-rose-500/70 text-slate-300 hover:text-white font-racing font-extrabold text-xs sm:text-sm uppercase tracking-wider transition shadow-xl active:scale-95 group"
        >
          <ArrowLeft className="w-4 h-4 text-rose-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span>Voltar</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* PAINEL FLUTUANTE 1: AJUSTE DE AMORTECIMENTO (SUSPENSÃO)      */}
      {/* ============================================================ */}
      {isTuningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.25)] flex flex-col gap-3 relative max-h-[95vh] overflow-y-auto">
            {/* Cabeçalho do Painel Flutuante */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-racing font-extrabold text-sm sm:text-base text-white uppercase tracking-wide">
                    Ajuste de Amortecimento
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Regulagem física em tempo real para {currentVehicleDef.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTuningOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition"
                aria-label="Fechar Painel de Amortecimento"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visualizador Dinâmico de Suspensão com Molas e Altura Real */}
            <div className="w-full">
              <SuspensionVisualizer
                vehicle={currentVehicleDef}
                suspension={suspensionConfig}
                isBouncing={isBouncing}
                onBounceComplete={() => setIsBouncing(false)}
              />
            </div>

            {/* Os 3 Controles Deslizantes Compactos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Rigidez da Mola (K) */}
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-racing font-bold text-slate-300">Rigidez Mola (K)</span>
                  <span className="text-amber-400 font-extrabold font-mono">
                    {stiffnessDesc} ({suspensionConfig.stiffness})
                  </span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="420"
                  step="5"
                  value={suspensionConfig.stiffness}
                  onChange={(e) => onChangeSuspension({ ...suspensionConfig, stiffness: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* 2. Amortecimento Hidráulico (C) */}
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-racing font-bold text-slate-300">Amortecedor (C)</span>
                  <span className="text-cyan-400 font-extrabold font-mono">
                    {dampingDesc} ({suspensionConfig.damping})
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="28"
                  step="1"
                  value={suspensionConfig.damping}
                  onChange={(e) => onChangeSuspension({ ...suspensionConfig, damping: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* 3. Altura Livre (Curso) */}
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-racing font-bold text-slate-300">Altura Livre (Curso)</span>
                  <span className="text-emerald-400 font-extrabold font-mono">
                    {suspensionConfig.restLength} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="36"
                  max="70"
                  step="1"
                  value={suspensionConfig.restLength}
                  onChange={(e) => onChangeSuspension({ ...suspensionConfig, restLength: Number(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Presets Rápidos e Botão de Testar Salto */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-racing text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
                  Presets:
                </span>
                <button
                  onClick={() => handlePreset('soft')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border font-racing font-bold text-[10px] uppercase transition ${
                    stiffnessDesc === 'Macia'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Macia
                </button>
                <button
                  onClick={() => handlePreset('trail')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border font-racing font-bold text-[10px] uppercase transition ${
                    stiffnessDesc === 'Média'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Trilha
                </button>
                <button
                  onClick={() => handlePreset('stiff')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border font-racing font-bold text-[10px] uppercase transition ${
                    stiffnessDesc === 'Dura'
                      ? 'bg-rose-500 text-slate-950 border-rose-400 shadow'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Firme
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleBounceTest}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-racing font-extrabold text-xs uppercase shadow-lg shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Testar Salto</span>
                </button>

                <button
                  onClick={() => setIsTuningOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-racing font-bold text-xs uppercase border border-slate-700 transition"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PAINEL FLUTUANTE 2: MENU DE SELEÇÃO DE VEÍCULOS             */}
      {/* ============================================================ */}
      {isCarSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.25)] flex flex-col gap-3 relative max-h-[95vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-racing font-extrabold text-sm sm:text-base text-white uppercase tracking-wide">
                    Selecionar Veículo Off-Road
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Escolha ou desbloqueie novos carros para sua aventura
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCarSelectOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition"
                aria-label="Fechar Seleção de Carro"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid dos Veículos Disponíveis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-1">
              {Object.values(VEHICLES).map((v) => {
                const isUnlocked = unlockedVehicles.includes(v.id);
                const isSelected = selectedVehicleId === v.id;
                const unlockPrice = v.unlockCost || 0;
                const canAfford = totalCoins >= unlockPrice;

                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      if (isUnlocked && !isSelected) {
                        onSelectVehicle(v.id);
                        soundManager.playCoin();
                      }
                    }}
                    className={`relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/15 to-slate-950 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                        : isUnlocked
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="w-full h-24 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 mb-2 overflow-hidden">
                        <img
                          src={getAssetUrl(v.bodyImage)}
                          alt={v.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="font-racing font-bold text-sm text-white truncate">
                          {v.name}
                        </h3>
                        {isSelected && (
                          <span className="text-[9px] font-racing font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                            Equipado
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                        {v.tagline}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Peso: <strong className="text-slate-200">{v.mass}kg</strong></span>
                        <span>Tanque: <strong className="text-slate-200">{v.fuelCapacity}L</strong></span>
                      </div>

                      {!isUnlocked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlockVehicle(v.id, unlockPrice);
                          }}
                          disabled={!canAfford}
                          className={`w-full flex items-center justify-center gap-1 font-racing font-extrabold uppercase py-2 rounded-xl text-xs transition ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Desbloquear ({unlockPrice}🪙)</span>
                        </button>
                      ) : isSelected ? (
                        <div className="w-full py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-racing font-bold text-xs flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Em Uso
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVehicle(v.id);
                            soundManager.playCoin();
                          }}
                          className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-racing font-bold text-xs uppercase border border-slate-700 transition"
                        >
                          Equipar Carro
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé da Janela de Seleção */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsCarSelectOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-racing font-bold text-xs uppercase border border-slate-700 transition"
              >
                Pronto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
