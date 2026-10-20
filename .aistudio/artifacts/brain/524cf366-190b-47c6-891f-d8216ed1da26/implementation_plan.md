# Refinamento de Centro de Massa, Estabilidade Aérea e Controles de Torque

Ajuste cirúrgico na física veicular do Hill Climb Pro: rebaixamento e avanço do centro de massa para estabilidade aerodinâmica natural, calibração precisa dos torques de inclinação aérea (acelerador inclina para trás, freio embica para frente com limitação de velocidade angular) e introdução de um sistema inteligente de auto-alinhamento para aterrissagens seguras.

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas pelo usuário na fase de alinhamento:
> - **Controles de Rotação no Ar**: Acelerar inclina o bico do veículo para trás/cima e Frear embica para frente/baixo, com limitação de velocidade angular para impedir rotações descontroladas ou capotamentos acidentais.
> - **Assistência de Aterrissagem**: Sistema de auto-estabilização suave ativado na aproximação do solo que alinha o chassi paralelamente à inclinação da pista antes do contato das rodas.
> - **Centro de Massa Rebaixado e Avançado**: Centro de gravidade deslocado para baixo e ligeiramente para a frente, conferindo atitude de voo estável e eliminando a tendência de o veículo cair de cauda.

---

### 1. Overview & Core Concept

- **O que faz**: Proporciona controle aéreo responsivo, intuitivo e acrobático, garantindo que o jogador consiga manobrar o veículo durante grandes saltos, manter o equilíbrio em subidas e aterrissar com segurança sem capotar.
- **Problemas Resolvidos**:
  1. **Instabilidade e Rotações Descontroladas no Ar**: Anteriormente, a inércia e o torque aéreo podiam acumular velocidade angular excessiva, fazendo o carro rodopiar no ar.
  2. **Queda de Cauda (Traseira Pesada)**: Com o centro de massa centralizado no chassi, o veículo tendia a rotacionar para trás pela aerodinâmica. O novo centro de massa rebaixado e avançado cria um momento natural de proa para baixo.
  3. **Aterrissagens Traumáticas**: Implementação de amortecimento progressivo e torque de auto-alinhamento na descida, preparando as duas rodas para tocar a pista simultaneamente.

---

### 2. User Experience & Visual Design

- **Comportamento em Voo**:
  - Ao saltar de uma colina, o jogador tem feedback tátil e visual imediato:
    - **Pressionar Acelerar (`D` / `➡️`)**: Levanta a frente do carro com torque dosado para superar lombadas ou empinar para salto longo.
    - **Pressionar Freio (`A` / `⬅️`)**: Abaixa a frente do carro com precisão para encaixar na descida de morros.
    - **Sem Botões Pressionados**: O carro estabiliza sua atitude de voo com amortecimento angular aerodinâmico suave.
  - **Aproximação do Solo**: Ao chegar a menos de 130px da superfície com velocidade descendente (`vy > 0`), o assistente de solo calcula a inclinação da pista abaixo do veículo e aplica torque suave para colocar as duas rodas na mesma linha do terreno, garantindo um pouso liso.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Limitação de Velocidade Angular Máxima no Ar (Angular Velocity Clamping)**
  - *Abordagem*: Limitar a velocidade angular máxima no ar a `±2.5 rad/s` e aplicar amortecimento quando o jogador solta os pedais.
  - *Por quê*: Impede que segurar o botão de acelerar faça o carro girar como um ventilador ou capotar sem tempo de reação para o jogador.
- **Decisão 2: Deslocamento do Centro de Gravidade (CoG Offset)**
  - *Abordagem*: Mudar o centro de gravidade em relação ao ponto médio do chassi: 4px para frente (`+X`) e 8px para baixo (`+Y` em coordenadas canvas).
  - *Por quê*: Centros de gravidade baixos e dianteiros são a regra de ouro em carros off-road de rali (*Baja/Trophy Truck*) para evitar empinamento descontrolado e garantir estabilidade direcional.
- **Decisão 3: Assistência de Aterrissagem com Prioridade ao Piloto**
  - *Abordagem*: O torque de auto-alinhamento atua com intensidade moderada quando o piloto não estiver forçando ativamente uma manobra contrária, permitindo manobras intencionais enquanto previne capotamentos involuntários.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Simulador de Voo                     │
│               (Physics Engine - Air Phase)             │
├────────────────────────────────────────────────────────┤
│ 1. Checagem de Estado:                                 │
│    • if (!rearWheel.onGround && !frontWheel.onGround)  │
│                                                        │
│ 2. Controles do Piloto no Ar:                          │
│    • Gas:   totalTorque -= airPitchTorque (Levanta)    │
│    • Brake: totalTorque += airPitchTorque (Abaixa)     │
│    • Clamped angularVel: [-2.5, +2.5] rad/s            │
│                                                        │
│ 3. Assistente de Auto-Alinhamento:                     │
│    • groundDist = terrainY(car.x) - car.y              │
│    • if (groundDist < 130 && vy > 0)                   │
│      deltaAngle = car.angle - terrain.angle            │
│      totalTorque += -deltaAngle * alignFactor          │
│                                                        │
│ 4. Centro de Massa (CoM):                              │
│    • CoM_X = +4px | CoM_Y = +8px (baixo e frente)      │
│    • Braço de alavanca da suspensão corrigido          │
└────────────────────────────────────────────────────────┘
```
