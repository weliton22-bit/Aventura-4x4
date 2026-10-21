import React, { useEffect, useRef, useState } from 'react';
import { VehicleDef } from '../config/vehicles';
import { SuspensionConfig } from '../types/game';
import { getAssetUrl } from '../physics/assetLoader';

interface SuspensionVisualizerProps {
  vehicle: VehicleDef;
  suspension: SuspensionConfig;
  isBouncing: boolean;
  onBounceComplete?: () => void;
}

export const SuspensionVisualizer: React.FC<SuspensionVisualizerProps> = ({
  vehicle,
  suspension,
  isBouncing,
  onBounceComplete
}) => {
  const [bounceOffset, setBounceOffset] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Efeito de oscilação harmônica amortecida ao testar o salto
  useEffect(() => {
    if (!isBouncing) {
      setBounceOffset(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    // Parâmetros físicos do salto baseados nas variáveis K e C
    const kFactor = Math.sqrt(suspension.stiffness / 200) * 16; // Frequência angular
    const cFactor = (suspension.damping / 13) * 3.8;          // Taxa de amortecimento (decaimento)
    const initialDrop = -34; // Salto inicial para cima

    const animate = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;

      if (elapsed > 1.2) {
        setBounceOffset(0);
        if (onBounceComplete) onBounceComplete();
        return;
      }

      // Equação clássica de vibração amortecida: x(t) = A * e^(-γt) * cos(ωt)
      const envelope = Math.exp(-cFactor * elapsed);
      const oscillation = Math.cos(kFactor * elapsed);
      const offset = initialDrop * envelope * oscillation;

      setBounceOffset(offset);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isBouncing, suspension.stiffness, suspension.damping, onBounceComplete]);

  // Escalas e coordenadas visuais do veículo
  const viewWidth = 420;
  const viewHeight = 175;
  const groundY = 150; // Linha de solo constante onde as rodas descansam

  // Posições das rodas no solo
  const centerX = viewWidth / 2;
  const wheelR = vehicle.wheelRadius;
  const wheelY = groundY - wheelR;
  const rearWheelX = centerX + vehicle.rearWheelOffsetX;
  const frontWheelX = centerX + vehicle.frontWheelOffsetX;

  // Altura livre dinâmica do chassi (Curso da mola: 36 a 70 mm)
  // Escala visual calibrada: 1 mm no slider corresponde a ~0.85px de altura real na visualização
  const restLengthPx = (suspension.restLength - 36) * 0.95 + 32;
  const totalChassisHeight = restLengthPx + bounceOffset;
  const chassisY = wheelY - totalChassisHeight;

  // Cor dinâmica da mola baseada na Rigidez (K)
  const springColor =
    suspension.stiffness < 190
      ? '#22d3ee' // Ciano (Macia)
      : suspension.stiffness > 310
      ? '#f43f5e' // Vermelho/Rosa (Dura)
      : '#f59e0b'; // Âmbar (Média / Trilha)

  // Espessura do traço da mola refletindo a rigidez K
  const springStrokeWidth = 2.2 + (suspension.stiffness - 120) * 0.007;

  // Função auxiliar para desenhar a mola helicoidal em SVG entre dois pontos verticais
  const generateSpringPath = (startX: number, topY: number, bottomY: number) => {
    const height = bottomY - topY;
    const coils = 5;
    const coilW = 7;
    let path = `M ${startX} ${topY}`;
    const step = height / (coils * 2);

    for (let i = 0; i < coils * 2; i++) {
      const curY = topY + (i + 0.5) * step;
      const curX = i % 2 === 0 ? startX + coilW : startX - coilW;
      path += ` L ${curX} ${curY}`;
    }
    path += ` L ${startX} ${bottomY}`;
    return path;
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-950/90 via-slate-900 to-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-inner p-2 flex flex-col items-center">
      {/* Indicador de Altura Livre (Vão Livre do Solo) */}
      <div className="w-full flex items-center justify-between px-3 pt-1 text-[11px] font-mono select-none">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Vão Livre do Chassi:</span>
          <strong className="text-emerald-400 font-racing text-xs">
            {suspension.restLength} mm
          </strong>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
          <span>Mola: <strong style={{ color: springColor }}>{suspension.stiffness} N/m</strong></span>
          <span>•</span>
          <span>Amortecedor: <strong className="text-cyan-300">{suspension.damping} C</strong></span>
        </div>
      </div>

      {/* Palco do Veículo com Visualização em Tempo Real */}
      <div className="relative w-full max-w-[420px] h-[175px] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="w-full h-full select-none pointer-events-none drop-shadow-md"
        >
          {/* 1. Solo da Oficina com Faixas Amarelas e Asfalto */}
          <line
            x1="10"
            y1={groundY}
            x2={viewWidth - 10}
            y2={groundY}
            stroke="#334155"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
          <rect
            x="10"
            y={groundY + 1}
            width={viewWidth - 20}
            height="18"
            fill="url(#groundPattern)"
            opacity="0.25"
          />

          <defs>
            <pattern id="groundPattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <line x1="0" y1="16" x2="16" y2="0" stroke="#f59e0b" strokeWidth="2" />
            </pattern>
          </defs>

          {/* 2. Régua de Altura Dinâmica (Vão Livre) */}
          <g opacity="0.85">
            {/* Linha vertical de cota */}
            <line
              x1={centerX - 95}
              y1={chassisY + 36}
              x2={centerX - 95}
              y2={groundY}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            {/* Setas superior e inferior */}
            <polygon points={`${centerX - 98},${chassisY + 41} ${centerX - 92},${chassisY + 41} ${centerX - 95},${chassisY + 36}`} fill="#10b981" />
            <polygon points={`${centerX - 98},${groundY - 5} ${centerX - 92},${groundY - 5} ${centerX - 95},${groundY}`} fill="#10b981" />
            {/* Texto de cota */}
            <text
              x={centerX - 100}
              y={(chassisY + 36 + groundY) / 2 + 3}
              fill="#10b981"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="end"
            >
              {suspension.restLength}mm
            </text>
          </g>

          {/* 3. Molas Helicoidais e Amortecedores Conectando o Chassi às Rodas */}
          {/* Mola Traseira */}
          <g>
            <path
              d={generateSpringPath(rearWheelX, chassisY + 28, wheelY)}
              fill="none"
              stroke={springColor}
              strokeWidth={springStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Cilindro hidráulico do amortecedor traseiro */}
            <line
              x1={rearWheelX + 6}
              y1={chassisY + 26}
              x2={rearWheelX + 6}
              y2={wheelY - 2}
              stroke="#64748b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1={rearWheelX + 6}
              y1={wheelY - 14}
              x2={rearWheelX + 6}
              y2={wheelY - 2}
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>

          {/* Mola Dianteira */}
          <g>
            <path
              d={generateSpringPath(frontWheelX, chassisY + 28, wheelY)}
              fill="none"
              stroke={springColor}
              strokeWidth={springStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Cilindro hidráulico do amortecedor dianteiro */}
            <line
              x1={frontWheelX - 6}
              y1={chassisY + 26}
              x2={frontWheelX - 6}
              y2={wheelY - 2}
              stroke="#64748b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1={frontWheelX - 6}
              y1={wheelY - 14}
              x2={frontWheelX - 6}
              y2={wheelY - 2}
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>

          {/* 4. Rodas Firmes no Solo */}
          {/* Roda Traseira */}
          <g transform={`translate(${rearWheelX}, ${wheelY})`}>
            <image
              href={getAssetUrl(vehicle.wheelRearImage)}
              x={-wheelR}
              y={-wheelR}
              width={wheelR * 2}
              height={wheelR * 2}
            />
            <circle cx="0" cy="0" r="3.5" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>

          {/* Roda Dianteira */}
          <g transform={`translate(${frontWheelX}, ${wheelY})`}>
            <image
              href={getAssetUrl(vehicle.wheelFrontImage)}
              x={-wheelR}
              y={-wheelR}
              width={wheelR * 2}
              height={wheelR * 2}
            />
            <circle cx="0" cy="0" r="3.5" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>

          {/* 5. Chassi e Piloto que Sobem e Descem Conforme a Altura Livre */}
          <g transform={`translate(${centerX}, ${chassisY})`}>
            {/* Cabeça do Piloto */}
            <image
              href={getAssetUrl(vehicle.headImage)}
              x={vehicle.headOffsetX - vehicle.headWidth / 2}
              y={vehicle.headOffsetY - vehicle.headHeight / 2}
              width={vehicle.headWidth}
              height={vehicle.headHeight}
            />

            {/* Carroceria do Veículo */}
            <image
              href={getAssetUrl(vehicle.bodyImage)}
              x={-vehicle.bodyWidth / 2}
              y={vehicle.bodyOffsetY - vehicle.bodyHeight / 2}
              width={vehicle.bodyWidth}
              height={vehicle.bodyHeight}
            />
          </g>
        </svg>
      </div>

      <div className="text-[10px] text-slate-500 font-racing flex items-center gap-1.5 mt-0.5">
        <span>Arraste os controles abaixo para ver o carro elevar ou abaixar suas molas em tempo real.</span>
      </div>
    </div>
  );
};
