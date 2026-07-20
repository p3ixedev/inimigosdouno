// ============================================================
// cartaImagens.js - Mapeamento das imagens fixas das cartas
// ============================================================
// Como usar:
// 1. Coloque os arquivos de imagem dentro de:
//      frontend/public/cartas/
// 2. Siga o padrao de nomes abaixo (tudo minusculo, sem acento,
//    sem espaco). O jogo troca pra imagem automaticamente assim
//    que o arquivo existir no lugar certo.
// 3. Se faltar algum arquivo, a carta correspondente cai sozinha
//    no visual padrao (gradiente + numero) sem quebrar nada.
//
// VERSO - usado em toda carta virada pra baixo (mao dos
// adversarios e o monte de compra). E uma imagem so pro baralho
// inteiro:
//   /cartas/verso.png
//
// FRENTE - numeros (0 a 9), um arquivo por cor:
//   /cartas/vermelho-0.png ... /cartas/vermelho-9.png
//   /cartas/azul-0.png     ... /cartas/azul-9.png
//   /cartas/verde-0.png    ... /cartas/verde-9.png
//   /cartas/amarelo-0.png  ... /cartas/amarelo-9.png
//
// FRENTE - acoes (bloqueio, reverso, +2), um arquivo por cor:
//   /cartas/vermelho-bloqueio.png
//   /cartas/vermelho-reverso.png
//   /cartas/vermelho-mais2.png
//   (troque "vermelho" por azul / verde / amarelo)
//
// FRENTE - especiais (sem cor fixa, uma imagem cada):
//   /cartas/mais4.png
//   /cartas/coringa.png
// ============================================================

export const VERSO_CARTA = '/cartas/verso.png';

const NOME_ACAO = {
  bloqueio: 'bloqueio',
  reverso: 'reverso',
  '+2': 'mais2',
};

export function getImagemFrenteCarta(carta) {
  if (!carta) return null;
  if (carta.tipo === 'especial') {
    return carta.valor === '+4' ? '/cartas/mais4.png' : '/cartas/coringa.png';
  }
  if (carta.tipo === 'numero') {
    return `/cartas/${carta.cor}-${carta.valor}.png`;
  }
  if (carta.tipo === 'acao') {
    return `/cartas/${carta.cor}-${NOME_ACAO[carta.valor]}.png`;
  }
  return null;
}