import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PLAYERS, COLOR_STYLES } from '../data/players';
import { getChannel } from '../api/pusher';
import UnoChip from '../components/UnoChip';
import { Crown, Home, RotateCcw, ChevronRight } from 'lucide-react';

const CORES_UNO = ['vermelho', 'azul', 'verde', 'amarelo'];
const COR_LABEL = { vermelho: 'Vermelho', azul: 'Azul', verde: 'Verde', amarelo: 'Amarelo' };

const COR = {
  vermelho: {
    bg: 'bg-[oklch(0.63_0.24_27)]',
    glow: 'shadow-[0_0_30px_oklch(0.63_0.24_27/0.7)]',
    border: 'border-[oklch(0.63_0.24_27)]',
    btn: 'bg-[oklch(0.63_0.24_27)] hover:bg-[oklch(0.68_0.24_27)]',
    hex: 'oklch(0.63 0.24 27)',
  },
  azul: {
    bg: 'bg-[oklch(0.6_0.22_255)]',
    glow: 'shadow-[0_0_30px_oklch(0.6_0.22_255/0.7)]',
    border: 'border-[oklch(0.6_0.22_255)]',
    btn: 'bg-[oklch(0.6_0.22_255)] hover:bg-[oklch(0.65_0.22_255)]',
    hex: 'oklch(0.6 0.22 255)',
  },
  verde: {
    bg: 'bg-[oklch(0.68_0.2_152)]',
    glow: 'shadow-[0_0_30px_oklch(0.68_0.2_152/0.7)]',
    border: 'border-[oklch(0.68_0.2_152)]',
    btn: 'bg-[oklch(0.68_0.2_152)] hover:bg-[oklch(0.73_0.2_152)]',
    hex: 'oklch(0.68 0.2 152)',
  },
  amarelo: {
    bg: 'bg-[oklch(0.85_0.18_90)]',
    glow: 'shadow-[0_0_30px_oklch(0.85_0.18_90/0.7)]',
    border: 'border-[oklch(0.85_0.18_90)]',
    btn: 'bg-[oklch(0.85_0.18_90)] hover:bg-[oklch(0.88_0.18_90)]',
    hex: 'oklch(0.85 0.18 90)',
  },
};

const COR_ESCURO = {
  vermelho: 'oklch(0.35 0.18 27)',
  azul: 'oklch(0.32 0.16 255)',
  verde: 'oklch(0.38 0.14 152)',
  amarelo: 'oklch(0.52 0.14 90)',
};

const BLOQUEIO_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-full h-full">
    <circle cx="12" cy="12" r="9" />
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);

const REVERSO_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

function getLabelCarta(carta) {
  if (carta.tipo === 'numero') return String(carta.valor);
  if (carta.valor === '+2') return '+2';
  if (carta.valor === '+4') return '+4';
  if (carta.valor === 'bloqueio') return 'BLOCK';
  if (carta.valor === 'reverso') return 'REV';
  if (carta.valor === 'coringa') return '*';
  return carta.valor;
}

function getIconCarta(carta) {
  if (carta.valor === 'bloqueio') return BLOQUEIO_SVG;
  if (carta.valor === 'reverso') return REVERSO_SVG;
  return null;
}

function getSubLabelCarta(carta) {
  if (carta.valor === 'bloqueio') return 'BLOCK';
  if (carta.valor === 'reverso') return 'REV';
  if (carta.valor === '+2') return 'DRAW';
  if (carta.valor === '+4') return 'WILD';
  if (carta.valor === 'coringa') return 'WILD';
  return null;
}

// Carta na mão do jogador
function CartaMao({ carta, selecionada, onClick, disabled }) {
  const isEspecial = carta.tipo === 'especial';
  const corObj = carta.cor ? COR[carta.cor] : null;
  const bgClass = corObj ? corObj.bg : 'bg-gradient-to-br from-zinc-700 to-zinc-900';
  const label = getLabelCarta(carta);
  const icon = getIconCarta(carta);
  const corEscuro = carta.cor ? COR_ESCURO[carta.cor] : '#1a1a2e';

  return (
    <motion.button
      layout
      whileHover={!disabled ? { y: -16, scale: 1.1, rotate: -3 } : {}}
      whileTap={!disabled ? { scale: 0.93 } : {}}
      animate={selecionada ? { y: -20, scale: 1.12 } : { y: 0, scale: 1 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex-shrink-0 rounded-xl select-none transition-shadow
        w-11 h-16 sm:w-14 sm:h-20
        ${bgClass}
        ${selecionada ? 'ring-4 ring-white shadow-[0_0_25px_white/50]' : 'ring-1 ring-white/20'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ boxShadow: selecionada ? '0 8px 30px rgba(255,255,255,0.3)' : undefined }}
    >
      {/* Oval interno */}
      <div
        className="absolute inset-[12%] rounded-[50%] opacity-30"
        style={{ background: corEscuro, transform: 'rotate(-20deg)', borderRadius: '50% / 60%' }}
      />

      {/* Número/símbolo mini — canto superior esquerdo */}
      <div className="absolute top-0.5 left-1 text-white font-black leading-none" style={{ fontSize: '9px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
        {label}
      </div>

      {/* Label/icone central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        {icon ? (
          <span className="text-white block w-7 h-7 sm:w-8 sm:h-8" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
            {icon}
          </span>
        ) : (
          <span className="text-white font-black leading-none drop-shadow-lg" style={{ fontSize: isEspecial ? '20px' : '24px', textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
            {label}
          </span>
        )}
      </div>

      {/* Número/símbolo mini — canto inferior direito (invertido) */}
      <div className="absolute bottom-0.5 right-1 text-white font-black leading-none rotate-180" style={{ fontSize: '9px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
        {label}
      </div>

      {/* Brilho no topo */}
      <div className="absolute inset-x-0 top-0 h-1/3 rounded-t-xl bg-white/10 pointer-events-none" />
    </motion.button>
  );
}

// Carta no topo da pilha
function CartaTopo({ carta, corAtual }) {
  if (!carta) return null;
  const corObj = carta.cor ? COR[carta.cor] : (corAtual ? COR[corAtual] : null);
  const bgClass = corObj ? corObj.bg : 'bg-zinc-700';
  const glowClass = corAtual && COR[corAtual] ? COR[corAtual].glow : '';
  const label = getLabelCarta(carta);
  const icon = getIconCarta(carta);
  const corEscuro = carta.cor ? COR_ESCURO[carta.cor] : (corAtual ? COR_ESCURO[corAtual] : '#1a1a2e');

  return (
    <motion.div
      key={carta.id}
      initial={{ scale: 0.3, rotate: -25, opacity: 0, y: -20 }}
      animate={{ scale: 1, rotate: [-8, 5, -3, 2, 0], opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`relative rounded-2xl w-20 h-28 sm:w-24 sm:h-32 border-4 border-white/30 ${bgClass} ${glowClass}`}
    >
      {/* Oval interno */}
      <div
        className="absolute inset-[10%] opacity-40"
        style={{ background: corEscuro, transform: 'rotate(-20deg)', borderRadius: '50% / 60%' }}
      />

      {/* Mini canto superior esquerdo */}
      <div className="absolute top-1 left-1.5 text-white font-black leading-none" style={{ fontSize: '11px', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
        {label}
      </div>

      {/* Label/icone central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
        {icon ? (
          <span className="text-white block w-10 h-10 sm:w-12 sm:h-12" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))' }}>
            {icon}
          </span>
        ) : (
          <span className="text-white font-black leading-none drop-shadow-xl" style={{ fontSize: '36px', textShadow: '0 3px 10px rgba(0,0,0,0.6)' }}>
            {label}
          </span>
        )}
      </div>

      {/* Mini canto inferior direito */}
      <div className="absolute bottom-1 right-1.5 text-white font-black leading-none rotate-180" style={{ fontSize: '11px', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
        {label}
      </div>

      {/* Brilho */}
      <div className="absolute inset-x-0 top-0 h-1/3 rounded-t-2xl bg-white/15 pointer-events-none" />
    </motion.div>
  );
}

// Carta no verso (outros jogadores)
function CartaVerso({ count }) {
  return (
    <div className="flex gap-0.5 flex-wrap justify-center">
      {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-4 rounded-sm bg-gradient-to-br from-[oklch(0.63_0.24_27)] to-[oklch(0.3_0.15_265)] ring-1 ring-white/20"
          style={{ transform: `rotate(${(i - Math.min(count, 8) / 2) * 3}deg)` }}
        />
      ))}
      {count > 8 && <span className="text-[10px] text-zinc-400 self-center ml-1">+{count - 8}</span>}
    </div>
  );
}

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

export default function Mesa() {
  const { codigo } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sala, setSala] = useState(null);
  const [estado, setEstado] = useState(null);
  const [cartasSelecionadas, setCartasSelecionadas] = useState([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [alvoZero, setAlvoZero] = useState(null);
  const [unoAnim, setUnoAnim] = useState(null);
  const [notif, setNotif] = useState(null);
  const channelRef = useRef(null);

  const pById = (id) => PLAYERS.find((p) => p.id === id);

  const mostrarNotif = (msg, tipo = 'info') => {
    setNotif({ msg, tipo });
    setTimeout(() => setNotif(null), 2500);
  };

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

    channel.bind('estado-atualizado', ({ estado: e }) => {
      setEstado(e);
      setCartasSelecionadas([]);
      setModal(null);
    });

    channel.bind('uno-declarado', ({ jogadorId, estado: e }) => {
      setEstado(e);
      const p = pById(jogadorId);
      setUnoAnim(jogadorId);
      mostrarNotif(`${p?.name} gritou UNO! `, 'uno');
      setTimeout(() => setUnoAnim(null), 2500);
    });

    return () => { channel.unbind_all(); };
  }, [codigo, user]);

  const toggleCarta = useCallback((carta) => {
    setCartasSelecionadas((prev) => {
      const jatem = prev.find((c) => c.id === carta.id);
      if (jatem) return prev.filter((c) => c.id !== carta.id);
      return [...prev, carta];
    });
  }, []);

  async function jogar() {
    if (cartasSelecionadas.length === 0) return;
    const ultima = cartasSelecionadas[cartasSelecionadas.length - 1];
    if (ultima.tipo === 'especial') {
      setModal('escolherCor');
      return;
    }
    await enviarJogada(null);
  }

  async function enviarJogada(corEscolhida) {
    setErro('');
    try {
      await apiAcao(codigo, user.id, 'jogar', { cartas: cartasSelecionadas, corEscolhida });
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

  async function passarVez() {
    setErro('');
    try {
      await apiAcao(codigo, user.id, 'passar');
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
  const corAtualObj = estado?.corAtual ? COR[estado.corAtual] : null;

  if (loading) {
    return (
      <div className="uno-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse"></div>
          <p className="text-zinc-400">Entrando na sala...</p>
        </div>
      </div>
    );
  }

  if (erro && !sala) {
    return (
      <div className="uno-bg min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl"></div>
        <p className="text-[oklch(0.85_0.18_27)] text-center">{erro}</p>
        <button onClick={() => navigate('/jogo')} className="text-zinc-400 hover:text-white text-sm underline">
          Voltar ao lobby
        </button>
      </div>
    );
  }

  // FIM DE JOGO
  if (estado?.fase === 'fim') {
    const vencedor = pById(estado.vencedor);
    const vencedorPlayer = PLAYERS.find(p => p.id === estado.vencedor);
    return (
      <div className="uno-bg min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="uno-card-surface rounded-3xl p-8 text-center max-w-sm w-full"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-7xl mb-4"
          >
            
          </motion.div>
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Vencedor</p>
          <div className="flex justify-center mb-3">
            {vencedorPlayer && <UnoChip color={vencedorPlayer.color} label={vencedor?.name[0]} />}
          </div>
          <h2 className="font-display text-5xl mb-6" translate="no">{vencedor?.name}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[oklch(0.22_0.035_265)]/60 py-3 text-sm text-zinc-300 ring-1 ring-white/10 hover:ring-white/25 transition"
            >
              <Home className="h-4 w-4" /> Início
            </button>
            <button
              onClick={() => navigate('/jogo')}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[oklch(0.63_0.24_27)] py-3 text-sm font-bold text-white hover:bg-[oklch(0.68_0.24_27)] transition"
            >
              <RotateCcw className="h-4 w-4" /> Jogar de novo
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // LOBBY
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
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Código da sala</p>
            <h2 className="font-display text-6xl tracking-[0.4em] text-[oklch(0.86_0.17_85)]">{codigo}</h2>
            <p className="text-xs text-zinc-500 mt-2"> Manda esse código pros amigos!</p>
          </div>

          <div className="space-y-2 mb-6">
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Jogadores ({sala?.jogadores?.length}/5)</p>
            {sala?.jogadores?.map((j) => {
              const p = pById(j.id);
              return (
                <div key={j.id} className="flex items-center gap-3 rounded-2xl bg-[oklch(0.22_0.035_265)]/60 px-4 py-3 ring-1 ring-white/5">
                  {p && <UnoChip color={p.color} label={j.nome[0]} sm />}
                  <span className="font-semibold" translate="no">{j.nome}</span>
                  {j.id === sala.criadorId && <Crown className="h-3.5 w-3.5 text-[oklch(0.86_0.17_85)] ml-auto" />}
                </div>
              );
            })}
          </div>

          {isCriador ? (
            <button
              onClick={iniciarJogo}
              disabled={(sala?.jogadores?.length || 0) < 2}
              className="w-full rounded-2xl bg-[oklch(0.63_0.24_27)] py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-40 hover:bg-[oklch(0.68_0.24_27)] transition shadow-[0_8px_24px_oklch(0.63_0.24_27/0.4)]"
            >
              {(sala?.jogadores?.length || 0) < 2 ? ' Aguardando jogadores...' : ' Iniciar jogo!'}
            </button>
          ) : (
            <p className="text-center text-sm text-zinc-400 animate-pulse py-2">
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
    <div className="uno-bg relative min-h-screen flex flex-col overflow-hidden">
      {/* Glow de fundo da cor atual */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-1000"
        style={{
          background: corAtualObj
            ? `radial-gradient(ellipse at center, ${corAtualObj.hex}15 0%, transparent 70%)`
            : undefined
        }}
      />

      {/* Notificação flutuante */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[oklch(0.22_0.035_265)] ring-1 ring-white/20 text-sm font-semibold text-white shadow-2xl"
          >
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNO! animação */}
      <AnimatePresence>
        {unoAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{ scale: [0, 1.3, 1], opacity: 1, rotate: [-15, 5, 0] }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="font-display text-[7rem] sm:text-[10rem] drop-shadow-2xl"
              style={{ color: 'oklch(0.86 0.17 85)', textShadow: '0 0 60px oklch(0.86 0.17 85 / 0.8)' }}>
              UNO!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal escolher cor */}
      <AnimatePresence>
        {modal === 'escolherCor' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="uno-card-surface rounded-3xl p-6 w-full max-w-xs text-center">
              <p className="font-display text-3xl mb-1">Escolha a cor</p>
              <p className="text-xs text-zinc-400 mb-5">Qual cor ativa agora?</p>
              <div className="grid grid-cols-2 gap-3">
                {CORES_UNO.map((cor) => (
                  <button key={cor} onClick={() => enviarJogada(cor)}
                    className={`${COR[cor].btn} rounded-2xl py-5 text-white font-bold text-sm transition shadow-lg`}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="uno-card-surface rounded-3xl p-6 w-full max-w-xs text-center">
              <div className="text-4xl mb-2">0</div>
              <p className="font-display text-2xl mb-1">Carta Zero!</p>
              <p className="text-sm text-zinc-400 mb-5">Escolha uma ação:</p>
              {!alvoZero ? (
                <div className="flex gap-3">
                  <button onClick={() => setAlvoZero('ver')}
                    className="flex-1 rounded-2xl bg-[oklch(0.6_0.22_255)] py-4 text-white font-bold text-sm hover:opacity-90 transition">
                     Ver cartas
                  </button>
                  <button onClick={() => setAlvoZero('trocar')}
                    className="flex-1 rounded-2xl bg-[oklch(0.63_0.24_27)] py-4 text-white font-bold text-sm hover:opacity-90 transition">
                     Trocar mão
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-zinc-400 mb-3">
                    {alvoZero === 'ver' ? ' Ver cartas de quem?' : ' Trocar mão com quem?'}
                  </p>
                  <div className="space-y-2">
                    {estado.jogadores.filter((id) => id !== user.id).map((id) => {
                      const p = pById(id);
                      return (
                        <button key={id} onClick={() => confirmarAcaoZero(alvoZero, id)}
                          className="w-full flex items-center gap-3 rounded-2xl bg-[oklch(0.22_0.035_265)]/60 px-4 py-3 hover:bg-[oklch(0.28_0.04_265)] transition ring-1 ring-white/10">
                          {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                          <span className="font-semibold" translate="no">{p?.name}</span>
                          <ChevronRight className="h-4 w-4 text-zinc-500 ml-auto" />
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setAlvoZero(null)} className="mt-4 text-xs text-zinc-500 hover:text-zinc-300">
                    ← Voltar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col min-h-screen p-2 sm:p-3 gap-2">

        {/* Outros jogadores */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {estado.jogadores.filter((id) => id !== user.id).map((id) => {
            const p = pById(id);
            const mao = estado.maos[id] || [];
            const ehVez = estado.turnoAtual === id;
            const temUno = estado.unoDeclarado?.[id];
            return (
              <motion.div
                key={id}
                animate={ehVez ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ repeat: ehVez ? Infinity : 0, duration: 1.5 }}
                className={`uno-card-surface rounded-2xl p-3 flex flex-col gap-2 transition-all ${
                  ehVez ? 'ring-2 ring-[oklch(0.86_0.17_85)] shadow-[0_0_20px_oklch(0.86_0.17_85/0.3)]' : 'ring-1 ring-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" translate="no">{p?.name}</p>
                    {ehVez && (
                      <p className="text-[10px] font-bold text-[oklch(0.86_0.17_85)] animate-pulse">vez dele </p>
                    )}
                  </div>
                  {temUno && (
                    <span className="text-[10px] font-black text-[oklch(0.86_0.17_85)] bg-[oklch(0.86_0.17_85)]/10 px-1.5 py-0.5 rounded-full">UNO</span>
                  )}
                </div>
                <CartaVerso count={mao.length} />
                <p className="text-[10px] text-zinc-500 text-center">{mao.length} carta{mao.length !== 1 ? 's' : ''}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Mesa central */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2">

          {/* Indicador de cor atual */}
          {estado.corAtual && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${corAtualObj?.bg || ''} shadow-lg`}>
              <div className="w-2 h-2 rounded-full bg-white/80" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">{COR_LABEL[estado.corAtual]}</span>
            </div>
          )}

          <div className="flex items-center gap-5 sm:gap-8">
            {/* Baralho */}
            <div className="flex flex-col items-center gap-1">
              <motion.button
                whileTap={ehMinhVez ? { scale: 0.92, rotate: -5 } : {}}
                onClick={ehMinhVez && !cartaCompradaJogavel ? comprar : undefined}
                className={`relative flex items-center justify-center rounded-2xl border-2 border-white/20 w-16 h-22 sm:w-20 sm:h-28 transition-all ${
                  ehMinhVez && !cartaCompradaJogavel
                    ? 'cursor-pointer hover:border-white/60 hover:shadow-[0_0_20px_white/20] bg-gradient-to-br from-[oklch(0.25_0.05_265)] to-[oklch(0.15_0.03_265)]'
                    : 'cursor-not-allowed opacity-50 bg-gradient-to-br from-[oklch(0.2_0.04_265)] to-[oklch(0.12_0.02_265)]'
                }`}
                style={{ height: '88px' }}
              >
                {/* Padrão no verso */}
                <div className="absolute inset-2 rounded-xl bg-[oklch(0.63_0.24_27)]/30 border border-[oklch(0.63_0.24_27)]/40" />
                <span className="relative font-display text-white text-base tracking-wider z-10">UNO</span>
                {estado.acumulado > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2.5 -right-2.5 bg-[oklch(0.63_0.24_27)] text-white text-xs font-black rounded-full w-7 h-7 flex items-center justify-center shadow-lg ring-2 ring-[oklch(0.14_0.03_265)]"
                  >
                    +{estado.acumulado}
                  </motion.span>
                )}
              </motion.button>
              {ehMinhVez && !cartaCompradaJogavel && <p className="text-[10px] text-zinc-500">comprar</p>}
            </div>

            {/* Topo da pilha */}
            <div className="flex flex-col items-center gap-1">
              <CartaTopo carta={topo} corAtual={estado.corAtual} />
              <p className="text-[10px] text-zinc-500">pilha</p>
            </div>
          </div>

          {/* Info do turno */}
          <div className="text-center">
            {ehMinhVez ? (
              <motion.p
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-sm font-bold text-[oklch(0.86_0.17_85)]"
              >
                 Sua vez!
              </motion.p>
            ) : (
              <p className="text-sm text-zinc-400">
                Vez de <span className="text-white font-bold" translate="no">{pById(estado.turnoAtual)?.name}</span>
              </p>
            )}
            {estado.acumulado > 0 && (
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-xs font-bold text-[oklch(0.85_0.18_27)] mt-1 bg-[oklch(0.63_0.24_27)]/15 px-3 py-1 rounded-full inline-block"
              >
                 Acumulado: +{estado.acumulado} cartas!
              </motion.p>
            )}
          </div>

          {/* Ação do 0 */}
          {ehMinhVez && estado.fase === 'acaoZero' && (
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={() => setModal('acaoZero')}
              className="rounded-2xl bg-[oklch(0.85_0.18_90)] px-5 py-2.5 text-sm font-bold text-zinc-900 shadow-lg hover:opacity-90 transition"
            >
              0 Escolher ação da carta 0
            </motion.button>
          )}

          {/* Carta comprada jogável */}
          {ehMinhVez && cartaCompradaJogavel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-xs font-bold text-[oklch(0.86_0.17_85)] animate-pulse">
                 Carta comprada pode ser jogada!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCartasSelecionadas([cartaCompradaJogavel]);
                                  }}
                  className="rounded-2xl bg-[oklch(0.68_0.2_152)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition shadow-lg"
                >
                   Jogar carta
                </button>
                <button
                  onClick={passarVez}
                  className="rounded-2xl bg-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-600 transition"
                >
                   Passar vez
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Minha mão */}
        <div className="uno-card-surface rounded-3xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {user && pById(user.id) && (
                <UnoChip color={pById(user.id).color} label={user.name[0]} sm />
              )}
              <span className="text-sm font-semibold" translate="no">{user?.name}</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{minhaMao.length}</span>
            </div>
            <div className="flex gap-2">
              {minhaMao.length === 1 && (
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={declararUno}
                  className="rounded-xl bg-[oklch(0.86_0.17_85)] px-4 py-1.5 text-xs font-black text-zinc-900 uppercase tracking-wider shadow-[0_4px_15px_oklch(0.86_0.17_85/0.5)] hover:opacity-90 transition"
                >
                  UNO! 
                </motion.button>
              )}
              {cartasSelecionadas.length > 0 && ehMinhVez && (
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={jogar}
                  className="rounded-xl bg-[oklch(0.63_0.24_27)] px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-[oklch(0.68_0.24_27)] transition shadow-lg"
                >
                  Jogar {cartasSelecionadas.length > 1 ? `(${cartasSelecionadas.length})` : '▶'}
                </motion.button>
              )}
            </div>
          </div>

          {/* Cartas */}
          <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-2 pt-1 flex-wrap">
            <AnimatePresence>
              {minhaMao.map((carta) => {
                const eSelecionada = cartasSelecionadas.some((c) => c.id === carta.id);
                const eDestaque = cartaCompradaJogavel?.id === carta.id;
                return (
                  <motion.div
                    key={carta.id}
                    layout
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CartaMao
                      carta={carta}
                      selecionada={eSelecionada}
                        onClick={() => ehMinhVez && toggleCarta(carta)}
                      disabled={!ehMinhVez}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {erro && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-2 text-xs text-[oklch(0.85_0.18_27)] text-center bg-[oklch(0.63_0.24_27)]/10 px-3 py-1.5 rounded-xl"
            >
               {erro}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
