import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PLAYERS, COLOR_STYLES } from '../data/players';
import { getChannel } from '../api/pusher';
import UnoChip from '../components/UnoChip';
import { Crown, Home, RotateCcw } from 'lucide-react';

const CORES_UNO = ['vermelho', 'azul', 'verde', 'amarelo'];
const COR_LABEL = { vermelho: 'Vermelho', azul: 'Azul', verde: 'Verde', amarelo: 'Amarelo' };
const COR_CLASS = {
  vermelho: 'bg-[oklch(0.63_0.24_27)]',
  azul: 'bg-[oklch(0.6_0.22_255)]',
  verde: 'bg-[oklch(0.68_0.2_152)]',
  amarelo: 'bg-[oklch(0.85_0.18_90)]',
};
const COR_TOPO = {
  vermelho: 'border-[oklch(0.63_0.24_27)] shadow-[0_0_30px_oklch(0.63_0.24_27/0.5)]',
  azul: 'border-[oklch(0.6_0.22_255)] shadow-[0_0_30px_oklch(0.6_0.22_255/0.5)]',
  verde: 'border-[oklch(0.68_0.2_152)] shadow-[0_0_30px_oklch(0.68_0.2_152/0.5)]',
  amarelo: 'border-[oklch(0.85_0.18_90)] shadow-[0_0_30px_oklch(0.85_0.18_90/0.5)]',
};

async function apiAcao(codigo, jogadorId, acao, dados = {}) {
  const res = await fetch('/api/jogo/acao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, jogadorId, acao, dados }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function apiEntrar(codigo, jogadorId, jogadorNome) {
  const res = await fetch('/api/jogo/entrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, jogadorId, jogadorNome }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function apiGetSala(codigo) {
  const res = await fetch(`/api/jogo/entrar?codigo=${codigo}`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

function CartaUno({ carta, selecionada, onClick, disabled }) {
  const isEspecial = carta.tipo === 'especial';
  const corBg = carta.cor ? COR_CLASS[carta.cor] : 'bg-zinc-800';
  const label = carta.tipo === 'numero'
    ? carta.valor
    : carta.valor === '+2' ? '+2'
    : carta.valor === '+4' ? '+4'
    : carta.valor === 'bloqueio' ? '🚫'
    : carta.valor === 'reverso' ? '🔄'
    : carta.valor === 'coringa' ? '🌈'
    : carta.valor;

  return (
    <motion.button
      whileHover={!disabled ? { y: -12, scale: 1.08 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center justify-center rounded-xl border-2 text-white font-display font-bold select-none transition-all
        ${corBg}
        ${selecionada ? 'border-white scale-110 -translate-y-3 shadow-[0_0_20px_white/40]' : 'border-white/20'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        w-12 h-16 text-lg sm:w-14 sm:h-20 sm:text-xl
      `}
    >
      <span className="relative z-10">{label}</span>
      {isEspecial && (
        <div className="absolute inset-2 rounded-full border border-white/20" />
      )}
    </motion.button>
  );
}

function CartaTopo({ carta, corAtual }) {
  if (!carta) return null;
  const corBg = carta.cor ? COR_CLASS[carta.cor] : COR_CLASS[corAtual] || 'bg-zinc-700';
  const label = carta.tipo === 'numero'
    ? carta.valor
    : carta.valor === '+2' ? '+2'
    : carta.valor === '+4' ? '+4'
    : carta.valor === 'bloqueio' ? '🚫'
    : carta.valor === 'reverso' ? '🔄'
    : carta.valor === 'coringa' ? '🌈'
    : carta.valor;

  return (
    <motion.div
      key={carta.id}
      initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      className={`relative flex items-center justify-center rounded-2xl border-4 text-white font-display font-bold w-16 h-24 text-2xl sm:w-20 sm:h-28 sm:text-3xl ${corBg} ${COR_TOPO[corAtual] || ''}`}
    >
      <span className="relative z-10">{label}</span>
      <div className="absolute inset-3 rounded-full border border-white/20" />
    </motion.div>
  );
}

export default function Mesa() {
  const { codigo } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sala, setSala] = useState(null);
  const [estado, setEstado] = useState(null);
  const [cartasSelecionadas, setCartasSelecionadas] = useState([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'escolherCor' | 'acaoZero' | 'ver'
  const [alvoZero, setAlvoZero] = useState(null);
  const [unoAnim, setUnoAnim] = useState(null);
  const channelRef = useRef(null);

  const pById = (id) => PLAYERS.find((p) => p.id === id);

  // Entra na sala e carrega estado
  useEffect(() => {
    if (!user) return;
    async function init() {
      try {
        await apiEntrar(codigo, user.id, user.name);
        const { sala: s } = await apiGetSala(codigo);
        setSala(s);
        if (s.estado) setEstado(s.estado);
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [codigo, user]);

  // Pusher - ouve eventos em tempo real
  useEffect(() => {
    if (!codigo) return;
    const channel = getChannel(`sala-${codigo}`);
    channelRef.current = channel;

    channel.bind('jogador-entrou', ({ jogadores }) => {
      setSala((prev) => prev ? { ...prev, jogadores } : prev);
    });

    channel.bind('jogo-iniciado', ({ estado: e }) => {
      setEstado(e);
      setSala((prev) => prev ? { ...prev, fase: 'jogando' } : prev);
    });

    channel.bind('estado-atualizado', ({ estado: e, acaoZeroInfo }) => {
      setEstado(e);
      setCartasSelecionadas([]);
      setModal(null);
      if (acaoZeroInfo && acaoZeroInfo.acao === 'ver' && acaoZeroInfo.alvoId === user?.id) {
        // Mostra as cartas do alvo pra quem pediu ver
      }
    });

    channel.bind('uno-declarado', ({ jogadorId, estado: e }) => {
      setEstado(e);
      setUnoAnim(jogadorId);
      setTimeout(() => setUnoAnim(null), 2000);
    });

    return () => {
      channel.unbind_all();
    };
  }, [codigo, user]);

  // Seleciona/deseleciona carta
  const toggleCarta = useCallback((carta) => {
    setCartasSelecionadas((prev) => {
      const jatem = prev.find((c) => c.id === carta.id);
      if (jatem) return prev.filter((c) => c.id !== carta.id);
      return [...prev, carta];
    });
  }, []);

  // Jogar cartas selecionadas
  async function jogar() {
    if (cartasSelecionadas.length === 0) return;
    const ultima = cartasSelecionadas[cartasSelecionadas.length - 1];
    // Se é especial (coringa/+4), abre modal de cor
    if (ultima.tipo === 'especial') {
      setModal('escolherCor');
      return;
    }
    await enviarJogada(null);
  }

  async function enviarJogada(corEscolhida) {
    setErro('');
    try {
      await apiAcao(codigo, user.id, 'jogar', {
        cartas: cartasSelecionadas,
        corEscolhida,
      });
      setCartasSelecionadas([]);
      setModal(null);
    } catch (e) {
      setErro(e.message);
      setCartasSelecionadas([]);
    }
  }

  async function comprar() {
    setErro('');
    try {
      await apiAcao(codigo, user.id, 'comprar');
    } catch (e) {
      setErro(e.message);
    }
  }

  async function iniciarJogo() {
    setErro('');
    try {
      await apiAcao(codigo, user.id, 'iniciar');
    } catch (e) {
      setErro(e.message);
    }
  }

  async function declararUno() {
    try {
      await apiAcao(codigo, user.id, 'uno');
    } catch (e) {}
  }

  async function confirmarAcaoZero(acao, alvoId = null) {
    setErro('');
    try {
      await apiAcao(codigo, user.id, 'acaoZero', { acao, alvoId });
      setModal(null);
      setAlvoZero(null);
    } catch (e) {
      setErro(e.message);
    }
  }

  const minhaMao = estado?.maos?.[user?.id] || [];
  const ehMinhVez = estado?.turnoAtual === user?.id;
  const topo = estado?.pilha?.[estado.pilha.length - 1];
  const isCriador = sala?.criadorId === user?.id;

  if (loading) {
    return (
      <div className="uno-bg min-h-screen flex items-center justify-center">
        <p className="text-zinc-400 animate-pulse">Entrando na sala...</p>
      </div>
    );
  }

  if (erro && !sala) {
    return (
      <div className="uno-bg min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[oklch(0.85_0.18_27)]">{erro}</p>
        <button onClick={() => navigate('/jogo')} className="text-zinc-400 hover:text-white text-sm">
          Voltar ao lobby
        </button>
      </div>
    );
  }

  // TELA DE FIM DE JOGO
  if (estado?.fase === 'fim') {
    const vencedor = pById(estado.vencedor);
    return (
      <div className="uno-bg min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="uno-card-surface rounded-3xl p-8 text-center max-w-sm w-full"
        >
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-zinc-400 text-sm mb-1">Vencedor</p>
          <h2 className="font-display text-5xl mb-2" translate="no">{vencedor?.name}</h2>
          {vencedor && <UnoChip color={vencedor.color} label={vencedor.name[0]} />}
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[oklch(0.22_0.035_265)]/60 py-3 text-sm text-zinc-300 ring-1 ring-white/10 hover:ring-white/25 transition"
            >
              <Home className="h-4 w-4" />
              Início
            </button>
            <button
              onClick={() => navigate('/jogo')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[oklch(0.63_0.24_27)] py-3 text-sm font-bold text-white hover:bg-[oklch(0.68_0.24_27)] transition"
            >
              <RotateCcw className="h-4 w-4" />
              Jogar de novo
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // LOBBY - aguardando jogadores
  if (!estado || sala?.fase === 'lobby') {
    return (
      <div className="uno-bg min-h-screen flex items-center justify-center px-4">
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[oklch(0.63_0.24_27)]/25 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.6_0.22_255)]/25 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 uno-card-surface rounded-3xl p-6 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Código da sala</p>
            <h2 className="font-display text-5xl tracking-[0.3em] text-[oklch(0.86_0.17_85)]">{codigo}</h2>
            <p className="text-xs text-zinc-500 mt-1">Manda esse código pros amigos!</p>
          </div>

          <div className="space-y-2 mb-6">
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Jogadores ({sala?.jogadores?.length}/5)</p>
            {sala?.jogadores?.map((j) => {
              const p = pById(j.id);
              return (
                <div key={j.id} className="flex items-center gap-3 rounded-xl bg-[oklch(0.22_0.035_265)]/60 px-4 py-3">
                  {p && <UnoChip color={p.color} label={j.nome[0]} sm />}
                  <span className="font-semibold" translate="no">{j.nome}</span>
                  {j.id === sala.criadorId && (
                    <Crown className="h-3.5 w-3.5 text-[oklch(0.86_0.17_85)] ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {isCriador ? (
            <button
              onClick={iniciarJogo}
              disabled={(sala?.jogadores?.length || 0) < 2}
              className="w-full rounded-xl bg-[oklch(0.63_0.24_27)] py-3 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-40 hover:bg-[oklch(0.68_0.24_27)] transition"
            >
              {(sala?.jogadores?.length || 0) < 2 ? 'Aguardando jogadores...' : 'Iniciar jogo!'}
            </button>
          ) : (
            <p className="text-center text-sm text-zinc-400 animate-pulse">
              Aguardando o criador iniciar...
            </p>
          )}

          {erro && <p className="mt-3 text-sm text-[oklch(0.85_0.18_27)] text-center">{erro}</p>}
        </motion.div>
      </div>
    );
  }

  // MESA DO JOGO
  return (
    <div className="uno-bg relative min-h-screen flex flex-col">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[oklch(0.63_0.24_27)]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.6_0.22_255)]/20 blur-3xl" />
      </div>

      {/* UNO animation */}
      <AnimatePresence>
        {unoAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="font-display text-[8rem] text-[oklch(0.86_0.17_85)] drop-shadow-2xl">
              UNO!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal escolher cor */}
      <AnimatePresence>
        {modal === 'escolherCor' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="uno-card-surface rounded-3xl p-6 w-full max-w-xs text-center"
            >
              <p className="font-display text-2xl mb-4">Escolha a cor</p>
              <div className="grid grid-cols-2 gap-3">
                {CORES_UNO.map((cor) => (
                  <button
                    key={cor}
                    onClick={() => enviarJogada(cor)}
                    className={`${COR_CLASS[cor]} rounded-2xl py-4 text-white font-bold text-sm hover:opacity-90 transition`}
                  >
                    {COR_LABEL[cor]}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal ação do 0 */}
      <AnimatePresence>
        {modal === 'acaoZero' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="uno-card-surface rounded-3xl p-6 w-full max-w-xs text-center"
            >
              <p className="font-display text-2xl mb-2">Carta 0!</p>
              <p className="text-sm text-zinc-400 mb-5">Escolha uma ação:</p>

              {!alvoZero ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setAlvoZero('ver')}
                    className="flex-1 rounded-xl bg-[oklch(0.6_0.22_255)] py-3 text-white font-bold text-sm hover:opacity-90 transition"
                  >
                    👁 Ver cartas
                  </button>
                  <button
                    onClick={() => setAlvoZero('trocar')}
                    className="flex-1 rounded-xl bg-[oklch(0.63_0.24_27)] py-3 text-white font-bold text-sm hover:opacity-90 transition"
                  >
                    🔀 Trocar mão
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-zinc-400 mb-3">
                    {alvoZero === 'ver' ? 'Ver cartas de quem?' : 'Trocar mão com quem?'}
                  </p>
                  <div className="space-y-2">
                    {estado.jogadores
                      .filter((id) => id !== user.id)
                      .map((id) => {
                        const p = pById(id);
                        return (
                          <button
                            key={id}
                            onClick={() => confirmarAcaoZero(alvoZero, id)}
                            className="w-full flex items-center gap-3 rounded-xl bg-[oklch(0.22_0.035_265)]/60 px-4 py-3 hover:bg-[oklch(0.22_0.035_265)] transition"
                          >
                            {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                            <span className="font-semibold" translate="no">{p?.name}</span>
                          </button>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setAlvoZero(null)}
                    className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col min-h-screen p-3 sm:p-4 gap-3">

        {/* Outros jogadores */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {estado.jogadores
            .filter((id) => id !== user.id)
            .map((id) => {
              const p = pById(id);
              const mao = estado.maos[id] || [];
              const ehVez = estado.turnoAtual === id;
              const temUno = estado.unoDeclarado?.[id];
              return (
                <div
                  key={id}
                  className={`uno-card-surface rounded-2xl p-3 flex flex-col gap-2 transition ${
                    ehVez ? 'ring-2 ring-[oklch(0.86_0.17_85)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" translate="no">{p?.name}</p>
                      {ehVez && <p className="text-[10px] text-[oklch(0.86_0.17_85)]">vez dele</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(mao.length, 7) }).map((_, i) => (
                        <div key={i} className="w-2 h-3 rounded-sm bg-zinc-600" />
                      ))}
                      {mao.length > 7 && <span className="text-[10px] text-zinc-400">+{mao.length - 7}</span>}
                    </div>
                    <span className="text-xs text-zinc-400 ml-auto">{mao.length} cartas</span>
                  </div>
                  {temUno && (
                    <span className="text-[10px] font-bold text-[oklch(0.86_0.17_85)] uppercase tracking-widest">UNO!</span>
                  )}
                </div>
              );
            })}
        </div>

        {/* Mesa central */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-6">
            {/* Baralho pra comprar */}
            <motion.button
              whileTap={ehMinhVez ? { scale: 0.95 } : {}}
              onClick={ehMinhVez ? comprar : undefined}
              className={`relative flex items-center justify-center rounded-2xl border-2 border-white/20 bg-zinc-800 w-14 h-20 sm:w-16 sm:h-24 ${
                ehMinhVez ? 'cursor-pointer hover:border-white/50' : 'cursor-not-allowed opacity-60'
              }`}
            >
              <span className="font-display text-white text-lg">UNO</span>
              {estado.acumulado > 0 && (
                <span className="absolute -top-2 -right-2 bg-[oklch(0.63_0.24_27)] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  +{estado.acumulado}
                </span>
              )}
            </motion.button>

            {/* Carta do topo */}
            <CartaTopo carta={topo} corAtual={estado.corAtual} />
          </div>

          {/* Info do turno */}
          <div className="text-center">
            {ehMinhVez ? (
              <p className="text-sm font-semibold text-[oklch(0.86_0.17_85)] animate-pulse">
                ✨ Sua vez!
              </p>
            ) : (
              <p className="text-sm text-zinc-400">
                Vez de <span className="text-white font-semibold" translate="no">{pById(estado.turnoAtual)?.name}</span>
              </p>
            )}
            {estado.acumulado > 0 && (
              <p className="text-xs text-[oklch(0.85_0.18_27)] mt-1">
                Acumulado: +{estado.acumulado} cartas
              </p>
            )}
          </div>

          {/* Ação do zero - avisa quando é a vez */}
          {ehMinhVez && estado.fase === 'acaoZero' && (
            <button
              onClick={() => setModal('acaoZero')}
              className="rounded-xl bg-[oklch(0.85_0.18_90)] px-4 py-2 text-sm font-bold text-zinc-900"
            >
              Escolher ação do 0
            </button>
          )}
        </div>

        {/* Minha mão */}
        <div className="uno-card-surface rounded-3xl p-4">
          {/* Header da mão */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {user && pById(user.id) && (
                <UnoChip color={pById(user.id).color} label={user.name[0]} sm />
              )}
              <span className="text-sm font-semibold" translate="no">{user?.name}</span>
              <span className="text-xs text-zinc-400">({minhaMao.length} cartas)</span>
            </div>
            <div className="flex gap-2">
              {minhaMao.length === 1 && (
                <button
                  onClick={declararUno}
                  className="rounded-xl bg-[oklch(0.86_0.17_85)] px-3 py-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider hover:opacity-90 transition"
                >
                  UNO!
                </button>
              )}
              {cartasSelecionadas.length > 0 && ehMinhVez && (
                <button
                  onClick={jogar}
                  className="rounded-xl bg-[oklch(0.63_0.24_27)] px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-[oklch(0.68_0.24_27)] transition"
                >
                  Jogar ({cartasSelecionadas.length})
                </button>
              )}
            </div>
          </div>

          {/* Cartas na mão */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
            <AnimatePresence>
              {minhaMao.map((carta) => (
                <motion.div
                  key={carta.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <CartaUno
                    carta={carta}
                    selecionada={cartasSelecionadas.some((c) => c.id === carta.id)}
                    onClick={() => ehMinhVez && toggleCarta(carta)}
                    disabled={!ehMinhVez}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {erro && (
            <p className="mt-2 text-xs text-[oklch(0.85_0.18_27)] text-center">{erro}</p>
          )}
        </div>
      </div>
    </div>
  );
}
