// ============================================================
// LÓGICA COMPLETA DO UNO - Inimigos do Uno
// ============================================================

export const CORES = ['vermelho', 'azul', 'verde', 'amarelo'];
export const NUMEROS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const ACOES = ['bloqueio', 'reverso', '+2'];
export const ESPECIAIS = ['+4', 'coringa'];

// Cria um baralho completo de UNO
export function criarBaralho() {
  const cartas = [];
  let id = 0;

  CORES.forEach((cor) => {
    // Números 0-9 (0 aparece uma vez, 1-9 aparecem duas vezes)
    NUMEROS.forEach((num) => {
      cartas.push({ id: id++, tipo: 'numero', valor: num, cor });
      if (num !== 0) cartas.push({ id: id++, tipo: 'numero', valor: num, cor });
    });

    // Cartas de ação (2 de cada por cor)
    ACOES.forEach((acao) => {
      cartas.push({ id: id++, tipo: 'acao', valor: acao, cor });
      cartas.push({ id: id++, tipo: 'acao', valor: acao, cor });
    });
  });

  // Cartas especiais (4 de cada, sem cor)
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

// Distribui 7 cartas pra cada jogador
export function distribuirCartas(baralho, jogadores) {
  const maos = {};
  const baralhoRestante = [...baralho];
  jogadores.forEach((id) => {
    maos[id] = baralhoRestante.splice(0, 7);
  });
  // Garante que a primeira carta da pilha não seja especial
  let primeiraIdx = baralhoRestante.findIndex((c) => c.tipo === 'numero');
  if (primeiraIdx === -1) primeiraIdx = 0;
  const [primeira] = baralhoRestante.splice(primeiraIdx, 1);
  return { maos, baralho: baralhoRestante, pilha: [primeira] };
}

// Verifica se uma carta pode ser jogada em cima da carta do topo
export function podePagar(carta, topo, corAtual, acumulado) {
  // Se tem acúmulo de +2, só pode jogar +2
  if (acumulado > 0 && topo.valor === '+2') {
    return carta.valor === '+2';
  }
  // Se tem acúmulo de +4, só pode jogar +4 ou +2 da cor atual
  if (acumulado > 0 && topo.valor === '+4') {
    return carta.valor === '+4' || (carta.valor === '+2' && carta.cor === corAtual);
  }

  // Coringa e +4 sempre podem ser jogados
  if (carta.tipo === 'especial') return true;

  // Mesma cor ou mesmo valor
  return carta.cor === corAtual || carta.valor === topo.valor;
}

// Valida uma sequência de cartas jogadas de uma vez
export function validarSequencia(cartas, topo, corAtual, acumulado) {
  if (cartas.length === 0) return false;
  if (cartas.length === 1) return podePagar(cartas[0], topo, corAtual, acumulado);

  // Primeira carta deve ser válida pra jogar no topo
  if (!podePagar(cartas[0], topo, corAtual, acumulado)) return false;

  // Valida as cartas seguintes entre si
  for (let i = 1; i < cartas.length; i++) {
    const anterior = cartas[i - 1];
    const atual = cartas[i];
    const corAnterior = anterior.cor;
    const valorAnterior = anterior.valor;

    // Não pode ter especial no meio de uma sequência
    if (atual.tipo === 'especial') return false;
    if (anterior.tipo === 'especial') return false;

    const mesmaCorQueAnterior = atual.cor === corAnterior;
    const mesmoValorQueAnterior = atual.valor === valorAnterior;

    // Sequência de mesmo número em cores diferentes: OK
    if (mesmoValorQueAnterior) continue;

    // Sequência de mesma cor: valor deve ser adjacente (crescente ou decrescente)
    if (mesmaCorQueAnterior) {
      const diff = Math.abs(Number(atual.valor) - Number(valorAnterior));
      if (diff === 1) continue;
    }

    // Mudança de cor com mesmo valor
    // Ex: 3 verde -> 3 vermelho -> 4 vermelho
    // Verifica se o valor anterior aparece na carta atual (transição de cor)
    if (atual.valor === valorAnterior) continue;

    // Transição tipo "2v→2a→3a→3r→4r"
    // Permite: mesma cor adjacente OU mesmo valor cor diferente
    const corOk = atual.cor === corAnterior;
    const valorOk = atual.valor === valorAnterior;
    const crescente = typeof atual.valor === 'number' &&
      typeof valorAnterior === 'number' &&
      Math.abs(atual.valor - valorAnterior) === 1 &&
      corOk;

    if (!corOk && !valorOk && !crescente) return false;
  }

  return true;
}

// Calcula o efeito da última carta de uma sequência
export function calcularEfeito(cartas, ordemAtual, totalJogadores) {
  const ultima = cartas[cartas.length - 1];
  let efeito = {
    tipo: null,
    pularVez: false,
    reverter: false,
    comprar: 0,
    escolherCor: false,
    acaoZero: false,
  };

  if (ultima.tipo === 'numero') {
    if (ultima.valor === 0) {
      efeito.acaoZero = true;
    }
    return efeito;
  }

  if (ultima.tipo === 'especial') {
    if (ultima.valor === 'coringa') {
      efeito.escolherCor = true;
    }
    if (ultima.valor === '+4') {
      efeito.escolherCor = true;
      efeito.comprar = 4;
    }
    return efeito;
  }

  if (ultima.tipo === 'acao') {
    if (ultima.valor === 'bloqueio') {
      efeito.pularVez = true;
    }
    if (ultima.valor === '+2') {
      efeito.comprar = 2;
    }
    if (ultima.valor === 'reverso') {
      // Conta quantos reversos foram jogados na sequência
      const reversos = cartas.filter((c) => c.valor === 'reverso').length;
      if (reversos % 2 !== 0) {
        efeito.reverter = true;
      }
    }
  }

  return efeito;
}

// Próximo jogador na ordem
export function proximoJogador(jogadores, atual, ordem, pular = false) {
  const idx = jogadores.indexOf(atual);
  const step = ordem === 'normal' ? 1 : -1;
  let next = (idx + step + jogadores.length) % jogadores.length;
  if (pular) {
    next = (next + step + jogadores.length) % jogadores.length;
  }
  return jogadores[next];
}

// Compra N cartas do baralho (reembaralha descarte se necessário)
export function comprarCartas(n, baralho, pilha) {
  let b = [...baralho];
  let p = [...pilha];
  const compradas = [];

  for (let i = 0; i < n; i++) {
    if (b.length === 0) {
      // Reembaralha o descarte, mantendo só o topo
      const topo = p[p.length - 1];
      b = embaralhar(p.slice(0, p.length - 1));
      p = [topo];
    }
    if (b.length > 0) {
      compradas.push(b.shift());
    }
  }

  return { compradas, baralho: b, pilha: p };
}

// Estado inicial do jogo
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
    acumulado: 0, // pontos acumulados de +2/+4
    fase: 'jogando', // jogando | escolherCor | acaoZero | fim
    vencedor: null,
    unoDeclarado: {}, // { jogadorId: true/false }
    ultimaAcao: null,
  };
}

// Processa uma jogada
export function processarJogada(estado, jogadorId, cartasJogadas, corEscolhida = null) {
  if (estado.turnoAtual !== jogadorId) return { erro: 'Não é sua vez!' };
  if (estado.fase !== 'jogando') return { erro: 'Ação inválida nesta fase.' };

  const mao = [...estado.maos[jogadorId]];
  const topo = estado.pilha[estado.pilha.length - 1];

  // Valida que o jogador tem as cartas
  const idsJogadas = cartasJogadas.map((c) => c.id);
  const temTodasCartas = idsJogadas.every((id) => mao.some((c) => c.id === id));
  if (!temTodasCartas) return { erro: 'Carta inválida!' };

  // Valida a sequência
  if (!validarSequencia(cartasJogadas, topo, estado.corAtual, estado.acumulado)) {
    return { erro: 'Jogada inválida!' };
  }

  // Remove as cartas da mão
  const novaMao = mao.filter((c) => !idsJogadas.includes(c.id));
  const novaPilha = [...estado.pilha, ...cartasJogadas];

  const efeito = calcularEfeito(cartasJogadas, estado.ordem, estado.jogadores.length);
  let novoEstado = {
    ...estado,
    maos: { ...estado.maos, [jogadorId]: novaMao },
    pilha: novaPilha,
    acumulado: 0,
  };

  // Verifica vitória
  if (novaMao.length === 0) {
    return { ...novoEstado, fase: 'fim', vencedor: jogadorId };
  }

  // UNO automático ao ficar com 1 carta
  if (novaMao.length === 1) {
    novoEstado.unoDeclarado = { ...novoEstado.unoDeclarado, [jogadorId]: true };
  }

  // Reverso
  let novaOrdem = estado.ordem;
  if (efeito.reverter) {
    novaOrdem = estado.ordem === 'normal' ? 'reverso' : 'normal';
    novoEstado.ordem = novaOrdem;
  }

  // Escolher cor (coringa ou +4)
  if (efeito.escolherCor) {
    if (efeito.comprar > 0) {
      // +4: acumula e passa pra fase de escolher cor
      novoEstado.acumulado = estado.acumulado + efeito.comprar;
    }
    if (corEscolhida) {
      novoEstado.corAtual = corEscolhida;
      novoEstado.turnoAtual = proximoJogador(estado.jogadores, jogadorId, novaOrdem);
      novoEstado.fase = 'jogando';
    } else {
      novoEstado.fase = 'escolherCor';
      novoEstado.turnoAtual = jogadorId; // mantém pra escolher a cor
    }
    return novoEstado;
  }

  // Ação do 0
  if (efeito.acaoZero) {
    novoEstado.corAtual = cartasJogadas[cartasJogadas.length - 1].cor;
    novoEstado.fase = 'acaoZero';
    novoEstado.turnoAtual = jogadorId;
    return novoEstado;
  }

  // +2 acumulado
  if (efeito.comprar === 2) {
    novoEstado.acumulado = estado.acumulado + 2;
    novoEstado.corAtual = cartasJogadas[cartasJogadas.length - 1].cor;
    novoEstado.turnoAtual = proximoJogador(estado.jogadores, jogadorId, novaOrdem);
    return novoEstado;
  }

  // Bloqueio
  if (efeito.pularVez) {
    novoEstado.corAtual = cartasJogadas[cartasJogadas.length - 1].cor;
    novoEstado.turnoAtual = proximoJogador(estado.jogadores, jogadorId, novaOrdem, true);
    return novoEstado;
  }

  // Jogada normal
  novoEstado.corAtual = cartasJogadas[cartasJogadas.length - 1].cor || estado.corAtual;
  novoEstado.turnoAtual = proximoJogador(estado.jogadores, jogadorId, novaOrdem);
  return novoEstado;
}

// Jogador escolhe cor após coringa/+4
export function escolherCor(estado, jogadorId, cor) {
  if (estado.turnoAtual !== jogadorId) return { erro: 'Não é sua vez!' };
  if (estado.fase !== 'escolherCor') return { erro: 'Ação inválida.' };

  return {
    ...estado,
    corAtual: cor,
    fase: 'jogando',
    turnoAtual: proximoJogador(estado.jogadores, jogadorId, estado.ordem),
  };
}

// Jogador compra carta (quando não tem o que jogar)
export function comprarCarta(estado, jogadorId) {
  if (estado.turnoAtual !== jogadorId) return { erro: 'Não é sua vez!' };
  if (estado.fase !== 'jogando') return { erro: 'Ação inválida.' };

  // Se tem acumulado, compra tudo e perde a vez
  const n = estado.acumulado > 0 ? estado.acumulado : 1;
  const { compradas, baralho, pilha } = comprarCartas(n, estado.baralho, estado.pilha);

  const novaMao = [...estado.maos[jogadorId], ...compradas];
  const novoEstado = {
    ...estado,
    maos: { ...estado.maos, [jogadorId]: novaMao },
    baralho,
    pilha,
    acumulado: 0,
    turnoAtual: proximoJogador(estado.jogadores, jogadorId, estado.ordem),
  };

  return novoEstado;
}

// Ação do 0: ver ou trocar cartas com alguém
export function acaoZero(estado, jogadorId, acao, alvoId) {
  if (estado.fase !== 'acaoZero') return { erro: 'Ação inválida.' };
  if (estado.turnoAtual !== jogadorId) return { erro: 'Não é sua vez!' };

  let novasManosState = { ...estado.maos };

  if (acao === 'trocar') {
    // Troca as mãos entre jogadorId e alvoId
    const maoJogador = novasManosState[jogadorId];
    const maoAlvo = novasManosState[alvoId];
    novasManosState = {
      ...novasManosState,
      [jogadorId]: maoAlvo,
      [alvoId]: maoJogador,
    };
  }
  // Se acao === 'ver', não faz nada nas mãos (só mostra visualmente no front)

  return {
    ...estado,
    maos: novasManosState,
    fase: 'jogando',
    turnoAtual: proximoJogador(estado.jogadores, jogadorId, estado.ordem),
  };
}

// Declara UNO
export function declararUno(estado, jogadorId) {
  return {
    ...estado,
    unoDeclarado: { ...estado.unoDeclarado, [jogadorId]: true },
  };
}