# Otimização de Performance e Tempo Real: Contador de Distância com useRef

## Diagnóstico
Em builds de produção minificadas (como as implantadas no GitHub Pages), fechamentos de função estagnados (*stale closures*) e re-renderizações do React podiam congelar a contagem de metros ou depender de acessos frágeis por ID no DOM.

## Modificações Realizadas

1. **Armazenamento da Distância em `useRef` Contínuo (`App.tsx`)**:
   - Criada a referência `distanceRef = useRef<number>(0)`.
   - A cada quadro (60 FPS) dentro do loop de física (`stepPhysics`), o valor da distância percorrida é atualizado de forma síncrona: `distanceRef.current = dist`.
   - Ao iniciar nova corrida ou trocar de veículo/cenário, `distanceRef.current` é resetado pontualmente para 0.
   - Ao disparar o fim de jogo (`handleGameOver`), o valor final é recuperado diretamente de `distanceRef.current`.

2. **Leitura e Atualização Suave no HUD (`HUD.tsx`)**:
   - Criada a referência interna `distanceSpanRef = useRef<HTMLSpanElement>(null)`.
   - Adicionado um ciclo contínuo via `requestAnimationFrame` que sincroniza o texto do elemento (`distanceSpanRef.current.textContent = `${safeDist}m``) lendo diretamente de `distanceRef.current`.
   - Não depende de `document.getElementById`, respeita o ciclo de vida do React e elimina atrasos e travamentos em ambientes de produção.
