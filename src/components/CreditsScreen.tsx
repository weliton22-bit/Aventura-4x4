import React from 'react';
import { ArrowLeft, Sparkles, Award, MapPin, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface CreditsScreenProps {
  onBackToMenu: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onBackToMenu }) => {
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 text-white select-none overflow-y-auto">
      {/* Topo com botão de Voltar */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full pb-2">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-racing font-bold text-xs uppercase transition shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Voltar ao Menu</span>
        </button>

        <span className="text-xs font-racing font-bold text-slate-500 uppercase tracking-widest">
          Aventura 4x4
        </span>
      </div>

      {/* Conteúdo Central */}
      <div className="my-auto max-w-2xl mx-auto w-full py-4 space-y-4">
        {/* Cabeçalho */}
        <div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center mx-auto mb-3 shadow-[0_10px_30px_rgba(245,158,11,0.3)] border border-yellow-200">
            <Award className="w-7 h-7 sm:w-8 sm:h-8 text-slate-950" />
          </div>

          <h1 className="font-racing font-extrabold text-2xl sm:text-3xl md:text-4xl text-amber-400 uppercase tracking-wider mb-1 drop-shadow">
            Créditos
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-racing font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aventura 4x4 Off-Road</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card Principal de Informações */}
        <div className="bg-slate-900/85 border border-slate-700/80 rounded-3xl p-5 sm:p-7 backdrop-blur-md shadow-2xl space-y-5">
          {/* Descrição Oficial do Aplicativo */}
          <div>
            <h2 className="text-[11px] font-racing font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Sobre o Jogo
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed text-justify sm:text-left bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800/80">
              Aventura 4x4 é um jogo de corrida off road baseado em física. O jogador precisa pilotar por montanhas e terrenos acidentados, gerenciar o consumo de combustível, realizar manobras no ar e coletar moedas para desbloquear novos cenários e aprimorar a suspensão e o motor dos veículos na garagem.
            </p>
          </div>

          {/* Autoria */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-slate-950 border border-amber-500/30 gap-2">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-racing text-slate-400 block">Autoria & Criação</span>
                <span className="font-racing font-extrabold text-xs sm:text-sm text-white tracking-wide">
                  Desenvolvido no Maranhão por: Weliton Morais Soares
                </span>
              </div>
            </div>
            <span className="text-[10px] font-racing font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
              Brasil 🇧🇷
            </span>
          </div>

          {/* Atribuições de Imagens */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs sm:text-sm font-racing font-bold uppercase tracking-wider text-cyan-300">
                Atribuições de Imagens
              </h2>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Agradecimento especial aos autores dos ícones e elementos visuais utilizados na interface e peças:
            </p>

            <ul className="grid grid-cols-1 gap-2 text-xs text-slate-300">
              {/* 1. Gas pedal icons created by Pop Vectors - Flaticon */}
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition">
                <span className="truncate pr-2">
                  <a
                    href="https://www.flaticon.com/free-icons/gas-pedal"
                    title="gas pedal icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                  >
                    Gas pedal icons
                  </a>{' '}
                  created by{' '}
                  <a
                    href="https://www.flaticon.com/authors/pop-vectors"
                    title="Pop Vectors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                  >
                    Pop Vectors
                  </a>{' '}
                  - Flaticon
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </li>

              {/* 2. Pedal icons created by Ehtisham Abid - Flaticon */}
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition">
                <span className="truncate pr-2">
                  <a
                    href="https://www.flaticon.com/free-icons/pedal"
                    title="pedal icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                  >
                    Pedal icons
                  </a>{' '}
                  created by{' '}
                  <a
                    href="https://www.flaticon.com/authors/ehtisham-abid"
                    title="Ehtisham Abid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                  >
                    Ehtisham Abid
                  </a>{' '}
                  - Flaticon
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </li>

              {/* 3. Settings icons created by Magnific - Flaticon */}
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition">
                <span className="truncate pr-2">
                  <a
                    href="https://www.flaticon.com/free-icons/settings"
                    title="settings icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                  >
                    Settings icons
                  </a>{' '}
                  created by{' '}
                  <a
                    href="https://www.flaticon.com/authors/magnific"
                    title="Magnific"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                  >
                    Magnific
                  </a>{' '}
                  - Flaticon
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </li>

              {/* 4. Tire icons created by Magnific - Flaticon */}
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition">
                <span className="truncate pr-2">
                  <a
                    href="https://www.flaticon.com/free-icons/tire"
                    title="tire icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                  >
                    Tire icons
                  </a>{' '}
                  created by{' '}
                  <a
                    href="https://www.flaticon.com/authors/magnific"
                    title="Magnific"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                  >
                    Magnific
                  </a>{' '}
                  - Flaticon
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </li>

              {/* 5. Gasolina icons created by Ricardo Ruiz - Flaticon */}
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition">
                <span className="truncate pr-2">
                  <a
                    href="https://www.flaticon.com/free-icons/gasolina"
                    title="gasolina icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                  >
                    Gasolina icons
                  </a>{' '}
                  created by{' '}
                  <a
                    href="https://www.flaticon.com/authors/ricardo-ruiz"
                    title="Ricardo Ruiz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                  >
                    Ricardo Ruiz
                  </a>{' '}
                  - Flaticon
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </li>
            </ul>
          </div>

          {/* Versão e Especificações Técnicas */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-1">
            <span>Versão 1.0.0</span>
            <span>Motor de Física 2D & Suspensão Dinâmica</span>
          </div>
        </div>
      </div>

      {/* Rodapé com botão de voltar */}
      <div className="max-w-4xl mx-auto w-full flex justify-center pt-2 pb-1">
        <button
          onClick={onBackToMenu}
          className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-racing font-extrabold text-xs sm:text-sm uppercase transition shadow-lg active:scale-95 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retornar ao Menu</span>
        </button>
      </div>
    </div>
  );
};
