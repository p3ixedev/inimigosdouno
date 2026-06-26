// ============================================================
// LÓGICA COMPLETA DO UNO - Inimigos do Uno
// ============================================================

export const CORES = ['vermelho', 'azul', 'verde', 'amarelo'];
export const NUMEROS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const ACOES = ['bloqueio', 'reverso', '+2'];
export const ESPECIAIS = ['+4', 'coringa'];

export function criarBaralho() {
  const cartas = [];
  let id = 0;
  CORES.forEach((cor) => {
    NUMEROS.forEach((num) => {
      cartas.push({ id: id++, tipo: 'numero', valor: num, cor });
      if (num !== 0) cartas.push({ id: id++, tipo: 'numero', valor: num, cor });
    });
    ACOES.forEach((acao) => {
      cartas.push({ id: id++, tipo: 'acao', valor: acao, cor });
      cartas.push({ id: id++, tipo: 'acao', valor: acao, cor });
    });
  });
  for (let i = 0; i < 4; i++) {
    cartas.push({ id: id++, tipo: 'especial', valor: '+4', cor: null });
    cartas.push({ id: id++, tipo: 'especial', valor: 'coringa', cor: null });
  }
  return embaralhar(cartas);
}

export function embaralhar(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function distribuirCartas(baralho, jogadores) {
  const maos = {};
  const baralhoRestante = [...baralho];
  jogadores.forEach((id) => {
    maos[id] = baralhoRestante.splice(0, 7);
  });
  let primeiraIdx = baralhoRestante.findIndex((c) => c.tipo === 'numero');
  if (primeiraIdx === -1) primeiraIdx = 0;
  const [primeira] = baralhoRestante.splice(primeiraIdx, 1);
  return { maos, baralho: baralhoRestante, pilha: [primeira] };
}

export function podePagar(carta, topo, corAtual, acumulado) {
  if (acumulado > 0 && topo.valor === '+2') {
    return carta.valor === '+2';
  }
  if (acumulado > 0 && topo.valor === '+4') {
    return carta.valor === '+4' || (carta.valor === '+2' && carta.cor === corAtual);
  }
  if (carta.tipo === 'especial') return true;
  return carta.cor === corAtual || carta.valor === topo.valor;
}

function cartasSequenciaCompativeis(anterior, atual) {
  if (atual.tipo === 'especial' || anterior.tipo === 'especial') return false;
  // Mesmo valor em qualquer cor: OK (ex: 9 verde -> 9 azul)
  if (atual.valor === anterior.valor) return true;
  // Mesma cor com valores numéricos adjacentes: OK (ex: 8 verde -> 9 verde)
  if (atual.cor === anterior.cor) {
    const valAtual = Number(atual.valor);
    const valAnterior = Number(anterior.valor);
    if (!isNaN(valAtual) && !isNaN(valAnterior) && Math.abs(valAtual - valAnterior) === 1) return true;
  }
  return false;
}

export function validarSequencia(cartas, topo, corAtual, acumulado) {
  if (cartas.length === 0) return false;
  if (!podePagar(cartas[0], topo, corAtual, acumulado)) return false;
  for (let i = 1; i < cartas.length; i++) {
    if (!cartasSequenciaCompativeis(cartas[i - 1], cartas[i])) return false;
  }
  return true;
}

export function calcularEfeito(cartas) {
  const ultima = cartas[cartas.length - 1];
  const efeito = { pularVez: false, reverter: false, comprar: 0, escolherCor: false, acaoZero: false };
  if (ultima.tipo === 'numero') {
    if (ultima.valor === 0) efeito.acaoZero = true;
    return efeito;
  }
  if (ultima.tipo === 'especial') {
    efeito.escolherCor = true;
    if (ultima.valor === '+4') efeito.comprar = 4;
    return efeito;
  }
  if (ultima.tipo === 'acao') {
    if (ultima.valor === 'bloqueio') efeito.pularVez = true;
    if (ultima.valor === '+2') efeito.comprar = 2;
    if (ultima.valor === 'reverso') {
      const reversos = cartas.filter((c) => c.valor === 'reverso').length;
      if (reversos % 2 !== 0) efeito.reverter = true;
    }
  }
  return efeito;
}

export function calcularEfeitoComJogadores(cartas, totalJogadores) {
  const efeito = calcularEfeito(cartas);
  // Com 2 jogadores, reverso funciona como bloqueio
  if (totalJogadores === 2 && efeito.reverter) {
    efeito.reverter = false;
    efeito.pularVez = true;
  }
  return efeito;
}

export function proximoJogador(jogadores, atual, ordem, pular = false) {
  const idx = jogadores.indexOf(atual);
  const step = ordem === 'normal' ? 1 : -1;
  let next = (idx + step + jogadores.length) % jogadores.length;
  if (pular) next = (next + step + jogadores.length) % jogadores.length;
  return jogadores[next];
}

export function comprarCartas(n, baralho, pilha) {
  let b = [...baralho];
  let p = [...pilha];
  const compradas = [];
  for (let i = 0; i < n; i++) {
    if (b.length === 0) {
      const topo = p[p.length - 1];
      b = embaralhar(p.slice(0, p.length - 1));
      p = [topo];
    }
    if (b.length > 0) compradas.push(b.shift());
  }
  return { compradas, baralho: b, pilha: p };
}

export function criarEstadoInicial(jogadores) {
  const baralho = criarBaralho();
  const { maos, baralho: b, pilha } = distribuirCartas(baralho, jogadores);
  return {
    jogadores,
    maos,
    baralho: b,
    pilha,
    corAtual: pilha[0].cor,
    turnoAtual: jogadores[0],
    ordem: 'normal',
    acumulado: 0,
    fase: 'jogando',
    vencedor: null,
    unoDeclarado: {},
  };
}

export function processarJogada(estado, jogadorId, cartasJogadas, corEscolhida = null) {
  if (estado.turnoAtual !== jogadorId) return { erro: 'Não é sua vez!' };
  if (estado.fase !== 'jogando') return { erro: 'Ação inválida nesta fase.' };

  const mao = [...estado.maos[jogadorId]];
  const topo = estado.pilha[estado.pilha.length - 1];
  const idsJogadas = cartasJogadas.map((c) => c.id);
  const temTodasCartas = idsJogadas.every((id) => mao.some((c) => c.id === id));
  if (!temTodasCartas) return { erro: 'Carta inválida!' };
  if (!validarSequencia(cartasJogadas, topo, estado.corAtual, estado.acumulado)) {
    return { erro: 'Jogada inválida!' };
  }

  const novaMao = mao.filter((c) => !idsJogadas.includes(c.id));
  const novaPilha = [...estado.pilha, ...cartasJogadas];
  const ultimaCarta = cartasJogadas[cartasJogadas.length - 1];
  const efeito = calcularEfeitoComJogadores(cartasJogadas, estado.jogadores.length);

  let novoEstado = {
    ...estado,
    maos: { ...estado.maos, [jogadorId]: novaMao },
    pilha: novaPilha,
    acumulado: 0,
  };

  if (novaMao.length === 0) return { ...novoEstado, fase: 'fim', vencedor: jogadorId };
  if (novaMao.length === 1) novoEstado.unoDeclarado = { ...novoEstado.unoDeclarado, [jogadorId]: true };

  let novaOrdem = estado.ordem;
  if (efeito.reverter) {
    novaOrdem = estado.ordem === 'normal' ? 'reverso' : 'normal';
    novoEstado.ordem = novaOrdem;
  }

  if (efeito.escolherCor) {
    novoEstado.acumulado = estado.acumulado + efeito.comprar;
    if (corEscolhida && CORES.includes(corEscolhida)) {
      novoEstado.corAtual = corEscolhida;
      novoEstado.turnoAtual = proximoJogador(estado.jogadores, jogadorId, novaOrdem);
      novoEstado.fase = 'jogando';
    } else {
      novoEstado.fase = 'escolherCor';
      novoEstado.turnoAtual = jogadorId;
    }
    return novoEstado;
  }

  if (efeito.acaoZero) {
    novoEstado.corAtual = ultimaCarta.cor;
    novoEstado.fase = 'acaoZero';
    novoEstado.turnoAtual = jogadorId;
    return novoEstado;
  }

  if (efeito.comprar === 2) {
    novoEstado.acumulado = estado.acumulado + 2;
    novoEstado.corAtual = ultimaCarta.cor;
    novoEstado.turnoAtual = proximoJogador(estado.jogadores, jogadorId, novaOrdem);
    return novoEstado;
  }

  if (efeito.pularVez) {
    novoEstado.corAtual = ultimaCarta.cor;
    novoEstado.turnoAtual = proximoJogador(estado.jogadores, jogadorId, novaOrdem, true);
    return novoEstado;
  }

  novoEstado.corAtual = ultimaCarta.cor || estado.corAtual;
  novoEstado.turnoAtual = proximoJogador(estado.jogadores, jogadorId, novaOrdem);
  return novoEstado;
}

export function escolherCor(estado, jogadorId, cor) {
  if (estado.turnoAtual !== jogadorId) return { erro: 'Não é sua vez!' };
  if (estado.fase !== 'escolherCor') return { erro: 'Ação inválida.' };
  if (!CORES.includes(cor)) return { erro: 'Cor inválida.' };
  return {
    ...estado,
    corAtual: cor,
    fase: 'jogando',
    turnoAtual: proximoJogador(estado.jogadores, jogadorId, estado.ordem),
  };
}

export function comprarCarta(estado, jogadorId) {
  if (estado.turnoAtual !== jogadorId) return { erro: 'Não é sua vez!' };
  if (estado.fase !== 'jogando' && estado.fase !== 'acaoZero') return { erro: 'Ação inválida.' };
  const n = estado.acumulado > 0 ? estado.acumulado : 1;
  const { compradas, baralho, pilha } = comprarCartas(n, estado.baralho, estado.pilha);
  const novaMao = [...estado.maos[jogadorId], ...compradas];
  const topo = pilha[pilha.length - 1];

  // Se comprou por acumulo (+2/+4), passa a vez direto
  if (estado.acumulado > 0) {
    return {
      ...estado,
      maos: { ...estado.maos, [jogadorId]: novaMao },
      baralho,
      pilha,
      acumulado: 0,
      fase: 'jogando',
      turnoAtual: proximoJogador(estado.jogadores, jogadorId, estado.ordem),
      cartaCompradaJogavel: null,
    };
  }

  // Comprou 1 carta - verifica se pode jogar
  const cartaComprada = compradas[0];
  const podeJogar = cartaComprada && podePagar(cartaComprada, topo, estado.corAtual, 0);

  return {
    ...estado,
    maos: { ...estado.maos, [jogadorId]: novaMao },
    baralho,
    pilha,
    acumulado: 0,
    fase: 'jogando',
    // Se pode jogar, mantem a vez; senao passa
    turnoAtual: podeJogar ? jogadorId : proximoJogador(estado.jogadores, jogadorId, estado.ordem),
    cartaCompradaJogavel: podeJogar ? cartaComprada : null,
  };
}

export function acaoZero(estado, jogadorId, acao, alvoId) {
  if (estado.fase !== 'acaoZero') return { erro: 'Ação inválida.' };
  if (estado.turnoAtual !== jogadorId) return { erro: 'Não é sua vez!' };
  let novasMaos = { ...estado.maos };
  if (acao === 'trocar' && alvoId) {
    const maoJogador = [...novasMaos[jogadorId]];
    const maoAlvo = [...novasMaos[alvoId]];
    novasMaos = { ...novasMaos, [jogadorId]: maoAlvo, [alvoId]: maoJogador };
  }
  return {
    ...estado,
    maos: novasMaos,
    fase: 'jogando',
    turnoAtual: proximoJogador(estado.jogadores, jogadorId, estado.ordem),
  };
}

export function declararUno(estado, jogadorId) {
  return { ...estado, unoDeclarado: { ...estado.unoDeclarado, [jogadorId]: true } };
}