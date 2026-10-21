# Plano de Correção: Descongelamento da Telemetria (Metros, Moedas e Inclinação) no GitHub e APK

Garantir que o contador de metros, a inclinação e a contagem de moedas atualizem em tempo real a 60 FPS sem congelamentos em navegadores móveis, WebViews de APKs do PWABuilder e no GitHub Pages.

### Decisões Confirmadas com o Usuário
> [!IMPORTANT]
> - **Método de Build**: Publicação no GitHub Pages e geração do pacote APK via PWABuilder (TWA / WebView).
> - **Sintoma Crítico**: O carrinho se move e anda pela pista, mas o placar superior permanece estático em zero metros, sem registrar moedas nem inclinação.

---

## 1. Diagnóstico do Problema no APK e GitHub Pages

No Android WebView / TWA (utilizado pelo PWABuilder no APK):
1. **Inanição do Scheduler do React (React 18/19 Concurrency)**: Quando `setHudData` é chamado dentro de um loop de `requestAnimationFrame` que roda a 60 FPS no Canvas, o WebView do Android prioriza o thread do Canvas/WebGL e adia ou descarta as re-renderizações do React DOM para economizar bateria e ciclos de CPU. Por isso, no Android Studio (ou PC desktop) com alta potência o React consegue renderizar, mas no APK móvel o painel do React congela nos valores iniciais (0m, 0 moedas, 0°).
2. **Atualização Direta no DOM / Canvas**: A arquitetura padrão dos jogos em HTML5 Canvas de alta performance não delega telemetria frame a frame para o React State. Em vez disso, a telemetria é renderizada com atualização direta nos nós do DOM via `ref` (ou diretamente no Canvas), garantindo taxa de atualização instantânea a 60 FPS sem acionar o ciclo pesado de reconciliação do React.
3. **Sincronização de Build no GitHub Pages**: O APK do PWABuilder consome diretamente o link publicado do GitHub Pages. Se o build ou os assets do GitHub Actions estiverem desalinhados, o APK roda um cache antigo.

---

## 2. Experiência do Usuário & Fluxo Visual

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TELA DA CORRIDA (60 FPS)                        │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐         │
│ │ [PAINEL SUPERIOR ESQUERDO DE ALTA PERFORMANCE]             │         │
│ │  🌱 Colinas Verdes                                        │         │
│ │  124m  38km/h   🪙 +14 moedas                              │         │
│ │  GASOLINA [██████████████████░░░░] 78%                     │         │
│ │  🧭 Inclinação: 12°  ·  Saldo: 140🪙                      │         │
│ └────────────────────────────────────────────────────────────┘         │
│                                                                        │
│                    [CANVAS DO MUNDO 2D]                                │
│                     (Veículo, Física 4x4,                              │
│                    Pista, Moedas Coletáveis)                           │
│                                                                        │
│ ┌──────────────────────┐              ┌──────────────────────┐         │
│ │  [FREIO / RÉ]        │              │  [TURBO] [ACELERAR]  │         │
│ └──────────────────────┘              └──────────────────────┘         │
└────────────────────────────────────────────────────────────────────────┘
```

- **Placar Ultra-Responsivo**: O número de metros percorridos (`1m`, `2m`, `3m`...) corre suavemente a cada frame em que o carro avança.
- **Feedback Imediato de Moedas**: Ao colidir com uma moeda na pista, o placar `+X` incrementa no mesmo milissegundo, acompanhado de partículas douradas e tilintar sonoro.
- **Indicador de Inclinação Dinâmico**: O ponteiro e ângulo de inclinação acompanham cada rampa, aclive ou salto aéreo.

---

## 3. Decisões Técnicas & Arquitetura

### Decisão 1: Telemetria Direta por Refs de DOM (Desacoplamento do React Scheduler)
- **Abordagem**: Utilizar referências diretas de elementos DOM (`distanceElRef`, `coinsElRef`, `speedElRef`, `slopeElRef`, `fuelBarRef`) no componente HUD. O loop físico a 60 FPS atualiza o `textContent` e estilos CSS dos elementos diretamente.
- **Vantagem**: 100% imune a throttling do React, zero lag em WebViews do Android e zero alocação de lixo de memória (GC).
- **Fallback**: Manter o estado do React apenas para transições de tela principais (Menu -> Jogo -> Game Over / Oficina).

### Decisão 2: Atualização do Pacote PWA / Manifest para PWABuilder
- **Abordagem**: Garantir que o `public/manifest.json` e as meta tags no `index.html` tenham conformidade total com o PWABuilder (`standalone`/`fullscreen`, `start_url: "./"`, `scope: "./"`, ícones 192x192 e 512x512 maskable).
- **Vantagem**: O APK gerado abre em tela cheia nativa sem barra do navegador e sem restrições de sandbox.

### Decisão 3: Robustez de Física e Detecção de Coleta
- **Abordagem**: Garantir que `car.x`, `car.vx` e a detecção de varredura (swept bounding box) das moedas registrem com precisão absoluta mesmo quando a taxa de quadros oscilar no dispositivo móvel.

---

## 4. Plano de Execução por Etapas

1. **Refatorar o HUD para Atualização Direta de Alta Performance**:
   - Criar refs diretas nos spans de telemetria (`distanceElRef`, `coinsElRef`, `speedElRef`, `slopeElRef`, `fuelElRef`).
   - Expor função imperativa de sincronização rápida (`updateTelemetry(dist, speed, slope, coins, fuel)`) acionada diretamente no game loop do Canvas.
2. **Atualizar o Game Loop (`App.tsx`)**:
   - Chamar a atualização de telemetria direta a cada frame em que a física rodar.
   - Sincronizar o saldo de moedas total no `localStorage` sem travar a thread de animação.
3. **Verificação de Build & Conformidade PWABuilder**:
   - Rodar testes de compilação TypeScript (`npm run build` e `lint`).
   - Validar manifest.json para geração de APK no PWABuilder sem avisos.
