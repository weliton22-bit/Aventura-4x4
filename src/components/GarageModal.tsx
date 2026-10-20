import React, { useState } from 'react';
import { X, Zap, Disc, Compass, Fuel, CheckCircle2, Car, MapPin, Lock } from 'lucide-react';
import { Upgrades, VehicleId, StageId, VehicleUpgrades } from '../types/game';
import { VEHICLES } from '../config/vehicles';
import { STAGES, STAGE_LIST } from '../config/stages';
import { soundManager } from '../audio/soundManager';
import { getAssetUrl } from '../physics/assetLoader';

interface GarageModalProps {
  isOpen: boolean;
  vehicleUpgrades: VehicleUpgrades;
  totalCoins: number;
  selectedVehicleId: VehicleId;
  unlockedVehicles: VehicleId[];
  selectedStageId: StageId;
  unlockedStages: StageId[];
  onSelectVehicle: (id: VehicleId) => void;
  onUnlockVehicle: (id: VehicleId, cost: number) => void;
  onSelectStage: (id: StageId) => void;
  onUnlockStage: (id: StageId, cost: number) => void;
  onUpgrade: (vehicleId: VehicleId, key: keyof Upgrades, cost: number) => void;
  onClose: () => void;
}

interface UpgradeItemDef {
  key: keyof Upgrades;
  title: string;
  description: string;
  icon: React.ReactNode;
  baseCost: number;
  statLabel: (lvl: number) => string;
}

const UPGRADE_ITEMS: UpgradeItemDef[] = [
  {
    key: 'engine',
    title: 'Motor & Torque',
    description: 'Aumenta a força motriz e o torque em subidas íngremes para não travar nas rampas.',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    baseCost: 50,
    statLabel: (lvl) => `${1500 + lvl * 260} Nm de Torque`
  },
  {
    key: 'tires',
    title: 'Pneus & Tração 4x4',
    description: 'Aumenta o atrito e aderência nas rampas e distribui tração integral nas 4 rodas.',
    icon: <Disc className="w-5 h-5 text-cyan-400" />,
    baseCost: 45,
    statLabel: (lvl) => `Grip 4WD: +${lvl * 12}%`
  },
  {
    key: 'suspension',
    title: 'Suspensão Reforçada',
    description: 'Melhora o amortecimento, absorção de quedas duras e estabilidade contra capotamento.',
    icon: <Compass className="w-5 h-5 text-emerald-400" />,
    baseCost: 40,
    statLabel: (lvl) => `Estabilidade: +${lvl * 10}%`
  },
  {
    key: 'fuelTank',
    title: 'Tanque de Combustível',
    description: 'Expande a capacidade máxima do tanque e otimiza o consumo na subida da serra.',
    icon: <Fuel className="w-5 h-5 text-rose-400" />,
    baseCost: 35,
    statLabel: (lvl) => `${100 + (lvl - 1) * 15}L (+${(lvl - 1) * 15}%)`
  }
];

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  vehicleUpgrades,
  totalCoins,
  selectedVehicleId,
  unlockedVehicles,
  selectedStageId,
  unlockedStages,
  onSelectVehicle,
  onUnlockVehicle,
  onSelectStage,
  onUnlockStage,
  onUpgrade,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'stages' | 'upgrades'>('stages');
  const [upgradeTargetVehicle, setUpgradeTargetVehicle] = useState<VehicleId>(selectedVehicleId);

  if (!isOpen) return null;

  // Garante que o carro em foco para upgrades é válido
  const currentTargetCar = VEHICLES[upgradeTargetVehicle] || VEHICLES.red_speedster;
  const currentCarUpgrades = vehicleUpgrades[upgradeTargetVehicle] || {
    engine: 1,
    tires: 1,
    suspension: 1,
    fuelTank: 1
  };

  const getCost = (key: keyof Upgrades, level: number): number => {
    if (level >= 10) return 0;
    const def = UPGRADE_ITEMS.find((item) => item.key === key);
    const base = def ? def.baseCost : 50;
    return Math.floor(base * Math.pow(1.35, level - 1));
  };

  const handleBuy = (key: keyof Upgrades) => {
    const currentLevel = currentCarUpgrades[key];
    if (currentLevel >= 10) return;
    const cost = getCost(key, currentLevel);
    if (totalCoins >= cost) {
      soundManager.playUpgrade();
      onUpgrade(upgradeTargetVehicle, key, cost);
    }
  };

  const vehicleList = Object.values(VEHICLES);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs text-amber-400 uppercase font-bold tracking-wider">Garagem & Preparação</span>
            <h2 className="font-racing font-bold text-xl sm:text-2xl text-white uppercase">
              Cenários, Carros & Oficina
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-xs text-amber-300 font-bold uppercase">Moedas:</span>
              <span className="font-racing font-bold text-lg text-amber-400 tabular-nums">{totalCoins}🪙</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              aria-label="Fechar Oficina"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas: Cenários vs Veículos vs Melhorias */}
        <div className="flex gap-2 pt-3 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab('stages')}
            className={`px-4 py-2 rounded-xl font-racing font-bold text-xs uppercase transition flex items-center gap-2 ${
              activeTab === 'stages'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Cenários ({unlockedStages.length}/4)</span>
          </button>

          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-2 rounded-xl font-racing font-bold text-xs uppercase transition flex items-center gap-2 ${
              activeTab === 'vehicles'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Carros 2D ({unlockedVehicles.length}/3)</span>
          </button>

          <button
            onClick={() => setActiveTab('upgrades')}
            className={`px-4 py-2 rounded-xl font-racing font-bold text-xs uppercase transition flex items-center gap-2 ${
              activeTab === 'upgrades'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Oficina Individual por Carro</span>
          </button>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* ========================================================= */}
          {/* ABA 1: SELEÇÃO E DESBLOQUEIO DE CENÁRIOS                   */}
          {/* ========================================================= */}
          {activeTab === 'stages' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STAGE_LIST.map((stage) => {
                const isSelected = selectedStageId === stage.id;
                const isUnlocked = unlockedStages.includes(stage.id);
                const canAfford = totalCoins >= stage.price;

                return (
                  <div
                    key={stage.id}
                    className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                        : isUnlocked
                        ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-950/70 border-slate-800/90'
                    }`}
                  >
                    {/* Imagem de Fundo / Miniatura do Cenário */}
                    <div className="h-28 rounded-xl overflow-hidden relative mb-3 bg-slate-950/80 border border-slate-800">
                      <img
                        src={getAssetUrl(stage.thumbnail)}
                        alt={stage.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          !isUnlocked ? 'filter grayscale brightness-50' : 'hover:scale-105'
                        }`}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-900/85 backdrop-blur-md text-[11px] font-mono font-bold text-amber-300 border border-slate-700 flex items-center gap-1">
                        <span>{stage.icon}</span>
                        <span>{stage.name}</span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-racing font-bold uppercase shadow">
                          Ativo
                        </div>
                      )}

                      {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px]">
                          <Lock className="w-7 h-7 text-amber-400 mb-1 drop-shadow" />
                          <span className="font-racing font-bold text-sm text-amber-300 drop-shadow">
                            {stage.price} Moedas
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Descrição e Detalhes */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-racing font-bold text-base text-white">{stage.name}</h3>
                        <span className="text-[11px] text-slate-400 font-medium">{stage.subtitle}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                        {stage.description}
                      </p>
                    </div>

                    {/* Ação: Selecionar ou Desbloquear */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Liberado
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold font-mono">
                            Preço: {stage.price}🪙
                          </span>
                        )}
                      </div>

                      {isSelected ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-racing font-bold text-xs uppercase opacity-90 cursor-default"
                        >
                          Cenário Atual
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            soundManager.playCoin();
                            onSelectStage(stage.id);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-racing font-bold text-xs uppercase transition active:scale-95"
                        >
                          Selecionar
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => onUnlockStage(stage.id, stage.price)}
                          className={`px-4 py-2 rounded-xl font-racing font-bold text-xs uppercase flex items-center gap-1.5 transition ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow active:scale-95'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
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
          )}

          {/* ========================================================= */}
          {/* ABA 2: MODELOS DE CARROS 2D COM CARACTERÍSTICAS NATIVAS    */}
          {/* ========================================================= */}
          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {vehicleList.map((v) => {
                const isSelected = selectedVehicleId === v.id;
                const isUnlocked = unlockedVehicles.includes(v.id);
                const canAfford = totalCoins >= v.unlockCost;

                return (
                  <div
                    key={v.id}
                    className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                        : isUnlocked
                        ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-950/70 border-slate-800/90'
                    }`}
                  >
                    {/* Visualização de Sprite Real do Veículo */}
                    <div className="h-32 flex items-center justify-center relative w-full mb-3 bg-slate-950/50 rounded-xl p-2 border border-slate-800/70">
                      <img
                        src={getAssetUrl(v.bodyImage)}
                        alt={v.name}
                        className={`max-h-24 max-w-[88%] object-contain drop-shadow-md ${
                          !isUnlocked ? 'filter grayscale brightness-50' : ''
                        }`}
                      />
                      <img
                        src={getAssetUrl(v.headImage)}
                        alt={v.driverName}
                        className={`absolute w-10 h-10 object-contain top-2 left-[28%] ${
                          !isUnlocked ? 'filter grayscale brightness-50' : ''
                        }`}
                      />

                      {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 backdrop-blur-[2px] rounded-xl">
                          <Lock className="w-7 h-7 text-amber-400 mb-1 drop-shadow" />
                          <span className="font-racing font-bold text-xs text-amber-300">
                            {v.unlockCost} Moedas
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-racing font-bold text-sm text-white uppercase">{v.name}</h3>
                        <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                          {v.driverName}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {v.tagline}
                      </p>
                    </div>

                    {/* Características Nativas do Veículo */}
                    <div className="space-y-1.5 mb-3 text-[11px] bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Potência Nativa</span>
                        <span className="font-mono text-amber-400 font-bold">{Math.round(v.engineBonus * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                          style={{ width: `${Math.min(100, (v.engineBonus / 2.2) * 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-slate-300">
                        <span>Tração 4WD Nativa</span>
                        <span className="font-mono text-cyan-400 font-bold">{Math.round(v.gripBonus * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-400"
                          style={{ width: `${Math.min(100, (v.gripBonus / 2.0) * 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-slate-300">
                        <span>Tanque Base</span>
                        <span className="font-mono text-rose-400 font-bold">{v.fuelCapacity}L</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-red-400"
                          style={{ width: `${Math.min(100, (v.fuelCapacity / 175) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-2 border-t border-slate-800">
                      {isSelected ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-amber-400 text-slate-950 font-racing font-bold text-xs uppercase"
                        >
                          Veículo Ativo
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            soundManager.playCoin();
                            onSelectVehicle(v.id);
                            setUpgradeTargetVehicle(v.id);
                          }}
                          className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-racing font-bold text-xs uppercase transition active:scale-95"
                        >
                          Selecionar
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            onUnlockVehicle(v.id, v.unlockCost);
                            setUpgradeTargetVehicle(v.id);
                          }}
                          className={`w-full py-2 rounded-xl font-racing font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow active:scale-95'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Desbloquear ({v.unlockCost}🪙)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3: OFICINA DE UPGRADES INDIVIDUAL POR CARRO            */}
          {/* ========================================================= */}
          {activeTab === 'upgrades' && (
            <div className="space-y-4">
              {/* Barra de Seleção de Carro para Upgrades */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Oficina do Carro:</span>
                  <span className="font-racing font-bold text-sm text-amber-400 uppercase">
                    {currentTargetCar.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    (Os melhoramentos comprados são exclusivos para este veículo)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {vehicleList.map((v) => {
                    const isFocus = upgradeTargetVehicle === v.id;
                    const isUnlocked = unlockedVehicles.includes(v.id);

                    return (
                      <button
                        key={v.id}
                        disabled={!isUnlocked}
                        onClick={() => setUpgradeTargetVehicle(v.id)}
                        className={`px-3 py-1.5 rounded-xl font-racing text-xs uppercase flex items-center gap-1.5 transition ${
                          isFocus
                            ? 'bg-amber-400 text-slate-950 font-bold shadow'
                            : isUnlocked
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                        }`}
                      >
                        {!isUnlocked && <Lock className="w-3 h-3 text-slate-600" />}
                        <span>{v.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid dos 4 Upgrades do Veículo Focado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {UPGRADE_ITEMS.map((item) => {
                  const currentLevel = currentCarUpgrades[item.key] || 1;
                  const isMax = currentLevel >= 10;
                  const cost = getCost(item.key, currentLevel);
                  const canAfford = totalCoins >= cost && !isMax;

                  return (
                    <div
                      key={item.key}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-600 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-slate-900 rounded-xl border border-slate-700/80">
                              {item.icon}
                            </div>
                            <div>
                              <h3 className="font-racing font-bold text-base text-white">{item.title}</h3>
                              <span className="text-[11px] text-cyan-300 font-mono font-semibold">
                                {item.statLabel(currentLevel)}
                              </span>
                            </div>
                          </div>

                          <span className="font-racing font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                            Nív. {currentLevel}/10
                          </span>
                        </div>

                        <p className="text-slate-400 text-xs mb-3 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Medidor visual de 10 níveis */}
                        <div className="grid grid-cols-10 gap-1 mb-4">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 rounded-full transition-all duration-200 ${
                                i < currentLevel
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                  : 'bg-slate-900/80 border border-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={!canAfford || isMax}
                        onClick={() => handleBuy(item.key)}
                        className={`w-full py-2.5 rounded-xl font-racing font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition ${
                          isMax
                            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                            : canAfford
                            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 text-slate-950 shadow-lg active:scale-95'
                            : 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Nível Máximo ({currentTargetCar.name})</span>
                          </>
                        ) : (
                          <>
                            <span>Melhorar {currentTargetCar.name} para Nív. {currentLevel + 1}</span>
                            <span className="font-mono bg-black/30 px-2 py-0.5 rounded-lg text-amber-300">
                              ${cost}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
