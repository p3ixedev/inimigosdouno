import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PLAYERS, COLOR_STYLES } from '../data/players';
import { getChannel } from '../api/pusher';
import UnoChip from '../components/UnoChip';
import { Crown, Home, RotateCcw, ChevronRight, MessageSquare, Send, X, Zap } from 'lucide-react';

/* ─── UNO constants ─── */
const CORES_UNO = ['vermelho', 'azul', 'verde', 'amarelo'];
const COR_LABEL = { vermelho: 'Vermelho', azul: 'Azul', verde: 'Verde', amarelo: 'Amarelo' };

const FRASES = [
  'Nem minha vó jogava assim',
  'Continua assim...',
  'Desiste logo',
  'Tô sendo roubado',
  'Impossível isso',
  'Pega +4 idiota',
  'Você é uma vergonha',
  'Até meu cachorro joga melhor',
  'Obrigado pelo +4',
  'Tô gostando desse baralho',
];

/* ─── Color tokens per UNO color ─── */
const COR = {
  vermelho: { bg: 'bg-[#dc3730]', hex: '#dc3730', glow: '0 0 32px rgba(220,55,48,0.7)',  btn: 'bg-[#dc3730] hover:bg-[#ef4444]', dark: '#7f1d1d' },
  azul:     { bg: 'bg-[#3b82f6]', hex: '#3b82f6', glow: '0 0 32px rgba(59,130,246,0.7)', btn: 'bg-[#3b82f6] hover:bg-[#60a5fa]', dark: '#1e3a5f' },
  verde:    { bg: 'bg-[#22c55e]', hex: '#22c55e', glow: '0 0 32px rgba(34,197,94,0.7)',  btn: 'bg-[#22c55e] hover:bg-[#4ade80]', dark: '#14532d' },
  amarelo:  { bg: 'bg-[#f59e0b]', hex: '#f59e0b', glow: '0 0 32px rgba(245,158,11,0.7)', btn: 'bg-[#f59e0b] hover:bg-[#fbbf24]', dark: '#78350f' },
};

const BLOQUEIO_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-full h-full">
    <circle cx="12" cy="12" r="9" /><line x1="5" y1="19" x2="19" y2="5" />
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
  if (carta.valor === 'bloqueio') return BLOQUEIO_SVG;
  if (carta.valor === 'reverso') return REVERSO_SVG;
  if (carta.valor === 'coringa') return '★';
  return carta.valor;
}

function getLabelText(carta) {
  if (carta.tipo === 'numero') return String(carta.valor);
  if (carta.valor === '+2') return '+2';
  if (carta.valor === '+4') return '+4';
  if (carta.valor === 'bloqueio') return 'X';
  if (carta.valor === 'reverso') return 'R';
  if (carta.valor === 'coringa') return '★';
  return carta.valor;
}

/* ─── Card in hand ─── */
function CartaMao({ carta, selecionada, onClick, disabled }) {
  const corObj = carta.cor ? COR[carta.cor] : null;
  const labelContent = getLabelCarta(carta);
  const labelText = getLabelText(carta);
  const isIcon = carta.valor === 'bloqueio' || carta.valor === 'reverso';
  const isWild = carta.tipo === 'especial' && !carta.cor;

  const bg = corObj
    ? `linear-gradient(160deg, ${corObj.hex}, ${corObj.dark})`
    : 'linear-gradient(160deg, #3f3f5a, #1c1c2e)';

  return (
    <motion.button
      layout
      whileHover={!disabled ? { y: -18, scale: 1.12, rotate: -4 } : {}}
      whileTap={!disabled ? { scale: 0.91 } : {}}
      animate={selecionada ? { y: -22, scale: 1.14 } : { y: 0, scale: 1 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-shrink-0 rounded-xl select-none w-11 h-16 sm:w-14 sm:h-20 ${
        disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        background: bg,
        boxShadow: selecionada
          ? '0 0 0 3px white, 0 12px 32px rgba(255,255,255,0.3)'
          : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.2)',
        border: selecionada ? '2px solid white' : '1px solid rgba(255,255,255,0.18)',
      }}
    >
      {/* Oval center decoration */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: '14% 8%',
          background: 'rgba(255,255,255,0.14)',
          borderRadius: '50% / 60%',
          transform: 'rotate(-20deg)',
        }}
      />
      {/* Top-left label */}
      <div className="absolute top-0.5 left-1 text-white font-black leading-none" style={{ fontSize: '8px' }}>
        {labelText}
      </div>
      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center p-1.5">
        {isIcon ? (
          <span className="text-white block w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg">
            {labelContent}
          </span>
        ) : (
          <span className="text-white font-black leading-none drop-shadow-lg" style={{ fontSize: isWild ? '18px' : '22px' }}>
            {labelContent}
          </span>
        )}
      </div>
      {/* Bottom-right (rotated) */}
      <div className="absolute bottom-0.5 right-1 text-white font-black leading-none rotate-180" style={{ fontSize: '8px' }}>
        {labelText}
      </div>
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-1/3 rounded-t-xl pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)' }} />
    </motion.button>
  );
}

/* ─── Card on top of pile ─── */
function CartaTopo({ carta, corAtual }) {
  if (!carta) return null;
  const displayCor = carta.cor || corAtual;
  const corObj = displayCor ? COR[displayCor] : null;
  const labelContent = getLabelCarta(carta);
  const labelText = getLabelText(carta);
  const isIcon = carta.valor === 'bloqueio' || carta.valor === 'reverso';

  const bg = corObj
    ? `linear-gradient(160deg, ${corObj.hex}, ${corObj.dark})`
    : 'linear-gradient(160deg, #3f3f5a, #1c1c2e)';

  return (
    <motion.div
      key={carta.id}
      initial={{ scale: 0.25, rotate: -30, opacity: 0, y: -28 }}
      animate={{ scale: 1, rotate: [-12, 6, -4, 2, 0], opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      className="relative rounded-2xl w-20 h-28 sm:w-24 sm:h-32"
      style={{
        background: bg,
        border: '3px solid rgba(255,255,255,0.3)',
        boxShadow: corObj
          ? `${corObj.glow}, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)`
          : '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div
        className="absolute pointer-events-none"
        style={{ inset: '10%', background: 'rgba(255,255,255,0.12)', borderRadius: '50%/60%', transform: 'rotate(-20deg)' }}
      />
      <div className="absolute top-1 left-1.5 text-white font-black leading-none" style={{ fontSize: '10px' }}>
        {labelText}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-3">
        {isIcon ? (
          <span className="text-white block w-10 h-10 sm:w-12 sm:h-12 drop-shadow-xl">{labelContent}</span>
        ) : (
          <span className="text-white font-black drop-shadow-xl" style={{ fontSize: '38px' }}>{labelContent}</span>
        )}
      </div>
      <div className="absolute bottom-1 right-1.5 text-white font-black leading-none rotate-180" style={{ fontSize: '10px' }}>
        {labelText}
      </div>
      <div className="absolute inset-x-0 top-0 h-1/3 rounded-t-2xl pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }} />
    </motion.div>
  );
}

/* ─── Card back (for other players) ─── */
function CartaVerso({ count }) {
  const slots = Math.min(count, 7);
  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: `${Math.max(28, slots * 8 + 18)}px`, height: '32px' }}>
        {Array.from({ length: slots }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-md"
            style={{
              width: '18px',
              height: '28px',
              left: `${i * 8}px`,
              top: '2px',
              background: 'linear-gradient(160deg, #dc3730, #3b3b5a)',
              border: '1px solid rgba(255,255,255,0.2)',
              transform: `rotate(${(i - slots / 2) * 3}deg)`,
              zIndex: i,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          />
        ))}
        {count > 7 && (
          <span className="absolute right-0 top-2 text-[9px] text-muted-foreground font-bold">+{count - 7}</span>
        )}
      </div>
    </div>
  );
}

/* ─── API calls ─── */
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

/* ─── MAIN COMPONENT ─── */
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
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [verCartasModal, setVerCartasModal] = useState(null);
  const [textoChat, setTextoChat] = useState('');
  const channelRef = useRef(null);

  const pById = (id) => PLAYERS.find((p) => p.id === id);

  const mostrarNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 2800);
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
    channel.bind('jogador-entrou', ({ jogadores }) => { setSala((prev) => prev ? { ...prev, jogadores } : prev); });
    channel.bind('jogo-iniciado', ({ estado: e }) => { setEstado(e); setSala((prev) => prev ? { ...prev, fase: 'jogando' } : prev); });
    channel.bind('estado-atualizado', ({ estado: e }) => { setEstado(e); setCartasSelecionadas([]); setModal(null); });
    channel.bind('uno-declarado', ({ jogadorId, estado: e }) => {
      setEstado(e);
      const p = pById(jogadorId);
      setUnoAnim(jogadorId);
      mostrarNotif(`${p?.name} gritou UNO!`);
      setTimeout(() => setUnoAnim(null), 2800);
    });
    channel.bind('chat-mensagem', ({ jogadorId, texto }) => {
      const p = PLAYERS.find((pl) => pl.id === jogadorId);
      setMensagens((prev) => [...prev.slice(-19), { jogadorId, nome: p?.name || jogadorId, texto, ts: Date.now() }]);
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
    if (ultima.tipo === 'especial') { setModal('escolherCor'); return; }
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
    try { await apiAcao(codigo, user.id, 'comprar'); } catch (e) { setErro(e.message); }
  }
  async function iniciarJogo() {
    setErro('');
    try { await apiAcao(codigo, user.id, 'iniciar'); } catch (e) { setErro(e.message); }
  }
  async function declararUno() {
    try { await apiAcao(codigo, user.id, 'uno'); } catch (e) {}
  }
  async function enviarFrase(texto) {
    try { await apiAcao(codigo, user.id, 'chat', { texto }); } catch (e) {}
  }
  async function enviarTexto() {
    const texto = textoChat.trim();
    if (!texto) return;
    setTextoChat('');
    try { await apiAcao(codigo, user.id, 'chat', { texto }); } catch (e) {}
  }
  async function confirmarAcaoZero(acao, alvoId) {
    setErro('');
    try {
      if (acao === 'ver') {
        const p = pById(alvoId);
        const cartasAlvo = estado.maos[alvoId] || [];
        setVerCartasModal({ nome: p?.name || alvoId, cartas: cartasAlvo });
        await apiAcao(codigo, user.id, 'acaoZero', { acao, alvoId });
        setModal(null);
        setAlvoZero(null);
      } else {
        await apiAcao(codigo, user.id, 'acaoZero', { acao, alvoId });
        setModal(null);
        setAlvoZero(null);
      }
    } catch (e) { setErro(e.message); }
  }

  const minhaMao = estado?.maos?.[user?.id] || [];
  const ehMinhVez = estado?.turnoAtual === user?.id;
  const topo = estado?.pilha?.[estado.pilha.length - 1];
  const isCriador = sala?.criadorId === user?.id;
  const corAtualObj = estado?.corAtual ? COR[estado.corAtual] : null;

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="uno-bg min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl animate-pulse"
            style={{ background: 'linear-gradient(135deg, #dc3730, #b91c1c)' }} />
          <span className="absolute inset-0 flex items-center justify-center font-display text-xl text-white">UNO</span>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Entrando na sala...</p>
      </div>
    );
  }

  /* ─── ERROR ─── */
  if (erro && !sala) {
    return (
      <div className="uno-bg min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-2xl p-6 text-center max-w-sm w-full"
          style={{ background: 'rgba(220,55,48,0.1)', border: '1px solid rgba(220,55,48,0.25)' }}>
          <p className="text-red-300 mb-4">{erro}</p>
          <button
            onClick={() => navigate('/jogo')}
            className="text-sm font-semibold underline text-muted-foreground hover:text-foreground transition"
          >
            Voltar ao lobby
          </button>
        </div>
      </div>
    );
  }

  /* ─── WIN SCREEN ─── */
  if (estado?.fase === 'fim') {
    const vencedor = pById(estado.vencedor);
    const vencedorPlayer = PLAYERS.find((p) => p.id === estado.vencedor);
    const vencedorHex = vencedorPlayer ? { red: '#dc3730', blue: '#3b82f6', green: '#22c55e', yellow: '#f59e0b', white: '#e2e8f0' }[vencedorPlayer.color] : '#f59e0b';

    return (
      <div className="uno-bg min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="pointer-events-none fixed inset-0" aria-hidden="true">
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${vencedorHex}18 0%, transparent 65%)` }} />
        </div>
        <motion.div
          initial={{ scale: 0.25, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 16 }}
          className="relative z-10 rounded-3xl p-8 text-center max-w-sm w-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            border: `1px solid ${vencedorHex}40`,
            boxShadow: `0 0 80px -20px ${vencedorHex}50, 0 24px 64px rgba(0,0,0,0.6)`,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground mb-4">Vencedor</p>

          <motion.div
            className="flex justify-center mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            {vencedorPlayer && <UnoChip color={vencedorPlayer.color} label={vencedor?.name[0]} />}
          </motion.div>

          <motion.h2
            className="font-display leading-none mb-2"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', color: vencedorHex }}
            translate="no"
          >
            {vencedor?.name}
          </motion.h2>

          <p className="text-sm text-muted-foreground mb-8">ganhou a partida!</p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Home className="h-4 w-4" />
              Início
            </button>
            <button
              onClick={() => navigate('/jogo')}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition"
              style={{
                background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                boxShadow: '0 8px 24px -8px rgba(220,55,48,0.5)',
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Jogar de novo
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── LOBBY ─── */
  if (!estado || sala?.fase === 'lobby') {
    return (
      <div className="uno-bg min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(220,55,48,0.18) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            borderRadius: '1.5rem',
            overflow: 'hidden',
          }}
        >
          {/* Lobby header */}
          <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground mb-1">
              Código da Sala
            </p>
            <h2 className="font-display text-6xl tracking-[0.35em]" style={{ color: '#f59e0b' }}>{codigo}</h2>
            <p className="text-xs text-muted-foreground mt-1.5">Compartilhe este código com seus amigos!</p>
          </div>

          {/* Players list */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Jogadores ({sala?.jogadores?.length}/5)
            </p>
            <div className="space-y-2">
              {sala?.jogadores?.map((j) => {
                const p = pById(j.id);
                return (
                  <motion.div
                    key={j.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {p && <UnoChip color={p.color} label={j.nome[0]} sm />}
                    <span className="font-semibold text-sm flex-1" translate="no">{j.nome}</span>
                    {j.id === sala.criadorId && (
                      <Crown className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Start / waiting */}
          <div className="px-6 pb-4">
            {isCriador ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={iniciarJogo}
                disabled={(sala?.jogadores?.length || 0) < 2}
                className="w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-40 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                  boxShadow: (sala?.jogadores?.length || 0) >= 2 ? '0 8px 24px -8px rgba(220,55,48,0.6)' : 'none',
                }}
              >
                {(sala?.jogadores?.length || 0) < 2 ? 'Aguardando jogadores...' : 'Iniciar Jogo!'}
              </motion.button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="w-4 h-4 border-2 rounded-full"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#dc3730' }}
                />
                Aguardando o criador iniciar...
              </div>
            )}
            {erro && (
              <p className="mt-3 text-sm text-center" style={{ color: '#fca5a5' }}>{erro}</p>
            )}
          </div>

          {/* Lobby chat */}
          <div className="px-6 pb-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">Chat</p>
            <div
              className="rounded-xl p-2.5 mb-2 h-28 overflow-y-auto flex flex-col gap-1"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {mensagens.length === 0 ? (
                <p className="text-xs text-muted-foreground/40 text-center mt-8">Nenhuma mensagem ainda</p>
              ) : (
                mensagens.map((m) => (
                  <div key={m.ts} className="text-xs">
                    <span className="font-bold text-muted-foreground" translate="no">{m.nome}: </span>
                    <span className="text-foreground/80">{m.texto}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={textoChat}
                onChange={(e) => setTextoChat(e.target.value.slice(0, 100))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) enviarTexto(); }}
                placeholder="Digite uma mensagem..."
                className="flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder:text-muted-foreground/40 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
              <button
                onClick={enviarTexto}
                disabled={!textoChat.trim()}
                className="px-3 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition"
                style={{ background: 'rgba(220,55,48,0.8)' }}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── GAMEPLAY ─── */
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#0b0c14' }}>

      {/* Dynamic color ambient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-1000"
        style={{
          background: corAtualObj
            ? `radial-gradient(ellipse 60% 50% at 50% 100%, ${corAtualObj.hex}12 0%, transparent 70%)`
            : undefined,
        }}
      />

      {/* Floating notification */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -32, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
            style={{
              background: 'rgba(14,16,28,0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {notif}
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNO! burst animation */}
      <AnimatePresence>
        {unoAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: [0, 1.4, 1], opacity: 1, rotate: [-20, 6, 0] }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <span className="font-display select-none"
              style={{
                fontSize: 'clamp(5rem, 18vw, 10rem)',
                color: '#f59e0b',
                textShadow: '0 0 80px rgba(245,158,11,0.9), 0 0 160px rgba(245,158,11,0.4)',
                letterSpacing: '0.1em',
              }}>
              UNO!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color picker modal */}
      <AnimatePresence>
        {modal === 'escolherCor' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
            style={{ backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.7, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="rounded-3xl p-6 w-full max-w-xs text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
              }}>
              <p className="font-display text-4xl mb-1">Escolha a cor</p>
              <p className="text-xs text-muted-foreground mb-5">Qual cor ativa agora?</p>
              <div className="grid grid-cols-2 gap-3">
                {CORES_UNO.map((cor) => (
                  <motion.button
                    key={cor}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => enviarJogada(cor)}
                    className="rounded-2xl py-5 text-white font-bold text-sm transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${COR[cor].hex}, ${COR[cor].dark})`,
                      boxShadow: `0 8px 24px -8px ${COR[cor].hex}70`,
                    }}
                  >
                    {COR_LABEL[cor]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zero card modal */}
      <AnimatePresence>
        {modal === 'acaoZero' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
            style={{ backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="rounded-3xl p-6 w-full max-w-xs text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
              }}>
              <p className="font-display text-3xl mb-1">Carta Zero!</p>
              <p className="text-sm text-muted-foreground mb-5">Escolha uma ação:</p>
              {!alvoZero ? (
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setAlvoZero('ver')}
                    className="flex-1 rounded-2xl py-4 text-white font-bold text-sm transition"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1e3a5f)', boxShadow: '0 8px 24px -8px rgba(59,130,246,0.5)' }}>
                    Ver cartas
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setAlvoZero('trocar')}
                    className="flex-1 rounded-2xl py-4 text-white font-bold text-sm transition"
                    style={{ background: 'linear-gradient(135deg, #dc3730, #7f1d1d)', boxShadow: '0 8px 24px -8px rgba(220,55,48,0.5)' }}>
                    Trocar mão
                  </motion.button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {alvoZero === 'ver' ? 'Ver cartas de quem?' : 'Trocar mão com quem?'}
                  </p>
                  <div className="space-y-2">
                    {estado.jogadores.filter((id) => id !== user.id).map((id) => {
                      const p = pById(id);
                      return (
                        <motion.button key={id} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                          onClick={() => confirmarAcaoZero(alvoZero, id)}
                          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                          {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                          <span className="font-semibold text-sm" translate="no">{p?.name}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                        </motion.button>
                      );
                    })}
                  </div>
                  <button onClick={() => setAlvoZero(null)} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition">
                    Voltar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View cards modal (zero) */}
      <AnimatePresence>
        {verCartasModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
            style={{ backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="rounded-3xl p-6 w-full max-w-sm text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
              }}>
              <p className="font-display text-2xl mb-0.5">Cartas de <span translate="no">{verCartasModal.nome}</span></p>
              <p className="text-xs text-muted-foreground mb-4">Só você pode ver isso</p>
              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {verCartasModal.cartas.map((carta) => {
                  const corObj = carta.cor ? COR[carta.cor] : null;
                  const labelText = getLabelText(carta);
                  return (
                    <div key={carta.id} className="relative flex items-center justify-center rounded-xl w-10 h-14"
                      style={{
                        background: corObj ? `linear-gradient(160deg, ${corObj.hex}, ${corObj.dark})` : 'linear-gradient(160deg, #3f3f5a, #1c1c2e)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}>
                      <span className="text-white font-black text-lg drop-shadow-lg">{labelText}</span>
                    </div>
                  );
                })}
              </div>
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => setVerCartasModal(null)}
                className="w-full rounded-2xl py-3 text-sm font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg, #dc3730, #b91c1c)', boxShadow: '0 8px 24px -8px rgba(220,55,48,0.5)' }}>
                Fechar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat button */}
      <div className="fixed bottom-36 right-3 z-30 sm:bottom-40 sm:right-4">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setChatAberto((v) => !v)}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition shadow-lg"
          style={{
            background: chatAberto ? '#dc3730' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: chatAberto ? '0 4px 16px -4px rgba(220,55,48,0.6)' : '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {chatAberto
            ? <X className="w-4.5 h-4.5 text-white" />
            : <MessageSquare className="w-4.5 h-4.5 text-foreground/70" />
          }
        </motion.button>
        {mensagens.length > 0 && !chatAberto && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
            style={{ background: '#dc3730' }}>
            {mensagens.length > 9 ? '9+' : mensagens.length}
          </motion.span>
        )}
      </div>

      {/* Floating chat messages */}
      <div className="fixed bottom-48 left-2 right-16 z-20 pointer-events-none sm:left-4 sm:right-auto sm:w-64">
        <AnimatePresence>
          {mensagens.slice(-3).map((m) => (
            <motion.div
              key={m.ts}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="mb-1 rounded-xl px-3 py-2"
              style={{
                background: 'rgba(11,12,20,0.9)',
                border: '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-[10px] font-bold text-muted-foreground" translate="no">{m.nome}: </span>
              <span className="text-xs text-foreground/80">{m.texto}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            className="fixed bottom-48 right-3 z-30 w-64 rounded-2xl p-3 shadow-2xl sm:right-4"
            style={{
              background: 'rgba(11,12,20,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">Chat ao vivo</p>
            <div className="flex gap-1.5 mb-2.5">
              <input
                type="text"
                value={textoChat}
                onChange={(e) => setTextoChat(e.target.value.slice(0, 100))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) enviarTexto(); }}
                placeholder="Mensagem..."
                className="flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder:text-muted-foreground/40 outline-none transition"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
              />
              <button
                onClick={enviarTexto}
                disabled={!textoChat.trim()}
                className="px-2.5 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition"
                style={{ background: '#dc3730' }}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5 px-1">Frases rápidas</p>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {FRASES.map((frase) => (
                <button
                  key={frase}
                  onClick={() => enviarFrase(frase)}
                  className="w-full text-left text-xs text-foreground/70 rounded-xl px-3 py-2 transition hover:text-foreground"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  {frase}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN GAME LAYOUT ─── */}
      <div className="relative z-10 flex flex-col min-h-screen p-2 sm:p-3 gap-2">

        {/* Other players */}
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
                transition={{ repeat: ehVez ? Infinity : 0, duration: 1.6 }}
                className="rounded-2xl p-3 flex flex-col gap-2 transition-all"
                style={{
                  background: ehVez
                    ? 'rgba(245,158,11,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: ehVez
                    ? '2px solid rgba(245,158,11,0.5)'
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: ehVez ? '0 0 24px -4px rgba(245,158,11,0.3)' : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" translate="no">{p?.name}</p>
                    {ehVez && (
                      <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                        className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>
                        vez dele
                      </motion.p>
                    )}
                  </div>
                  {temUno && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}>
                      UNO
                    </motion.span>
                  )}
                </div>
                <CartaVerso count={mao.length} />
                <p className="text-[10px] text-muted-foreground text-center">{mao.length} carta{mao.length !== 1 ? 's' : ''}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Game table center */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2">

          {/* Current color indicator */}
          {estado.corAtual && (
            <motion.div
              key={estado.corAtual}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${COR[estado.corAtual].hex}, ${COR[estado.corAtual].dark})`,
                boxShadow: COR[estado.corAtual].glow,
              }}
            >
              <span className="w-2 h-2 rounded-full bg-white/80" />
              {COR_LABEL[estado.corAtual]}
            </motion.div>
          )}

          {/* Deck & top card */}
          <div className="flex items-center gap-6 sm:gap-10">
            {/* Draw pile */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.button
                whileHover={ehMinhVez ? { scale: 1.06, rotate: -4 } : {}}
                whileTap={ehMinhVez ? { scale: 0.94, rotate: -6 } : {}}
                onClick={ehMinhVez ? comprar : undefined}
                className="relative flex items-center justify-center rounded-2xl transition-all"
                style={{
                  width: '64px',
                  height: '88px',
                  background: ehMinhVez
                    ? 'linear-gradient(160deg, #dc3730, #7f1d1d)'
                    : 'linear-gradient(160deg, #2a2b3d, #1a1b28)',
                  border: ehMinhVez ? '2px solid rgba(220,55,48,0.5)' : '2px solid rgba(255,255,255,0.1)',
                  cursor: ehMinhVez ? 'pointer' : 'not-allowed',
                  opacity: ehMinhVez ? 1 : 0.5,
                  boxShadow: ehMinhVez ? '0 8px 24px -8px rgba(220,55,48,0.6)' : '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                <div className="absolute inset-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
                <span className="relative font-display text-white text-sm tracking-wider z-10">UNO</span>
                {estado.acumulado > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-2.5 -right-2.5 text-white text-xs font-black rounded-full w-7 h-7 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                      boxShadow: '0 4px 12px -4px rgba(220,55,48,0.7)',
                      border: '2px solid #0b0c14',
                    }}
                  >
                    +{estado.acumulado}
                  </motion.span>
                )}
              </motion.button>
              {ehMinhVez && (
                <p className="text-[10px] text-muted-foreground font-medium">comprar</p>
              )}
            </div>

            {/* Discard pile */}
            <div className="flex flex-col items-center gap-1.5">
              <CartaTopo carta={topo} corAtual={estado.corAtual} />
              <p className="text-[10px] text-muted-foreground font-medium">pilha</p>
            </div>
          </div>

          {/* Turn indicator */}
          <div className="text-center px-4">
            {ehMinhVez ? (
              <motion.p
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="text-base font-bold tracking-wide"
                style={{ color: '#f59e0b' }}
              >
                Sua vez!
              </motion.p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Vez de{' '}
                <span className="text-foreground font-bold" translate="no">
                  {pById(estado.turnoAtual)?.name}
                </span>
              </p>
            )}
            {estado.acumulado > 0 && (
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-xs font-bold mt-1 px-3 py-1 rounded-full inline-block"
                style={{ background: 'rgba(220,55,48,0.15)', color: '#fca5a5', border: '1px solid rgba(220,55,48,0.3)' }}
              >
                <Zap className="inline h-3 w-3 mr-1" />
                Acumulado: +{estado.acumulado} cartas!
              </motion.p>
            )}
          </div>

          {/* Zero card action */}
          {ehMinhVez && estado.fase === 'acaoZero' && (
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setModal('acaoZero')}
              className="rounded-2xl px-5 py-2.5 text-sm font-bold text-zinc-900 transition"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 8px 24px -8px rgba(245,158,11,0.6)',
              }}
            >
              Escolher ação da carta 0
            </motion.button>
          )}
        </div>

        {/* My hand */}
        <div
          className="rounded-3xl p-3 sm:p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Hand header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {user && pById(user.id) && (
                <UnoChip color={pById(user.id).color} label={user.name[0]} sm />
              )}
              <span className="text-sm font-semibold" translate="no">{user?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                {minhaMao.length}
              </span>
            </div>
            <div className="flex gap-2">
              {minhaMao.length === 1 && (
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={declararUno}
                  className="rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider transition"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#1a0f00',
                    boxShadow: '0 4px 16px -4px rgba(245,158,11,0.7)',
                  }}
                >
                  UNO!
                </motion.button>
              )}
              {cartasSelecionadas.length > 0 && ehMinhVez && (
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={jogar}
                  className="rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition text-white"
                  style={{
                    background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                    boxShadow: '0 4px 16px -4px rgba(220,55,48,0.6)',
                  }}
                >
                  Jogar {cartasSelecionadas.length > 1 ? `(${cartasSelecionadas.length})` : '>'}
                </motion.button>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="card-hand">
            <AnimatePresence>
              {minhaMao.map((carta) => (
                <motion.div
                  key={carta.id}
                  layout
                  initial={{ scale: 0, opacity: 0, y: 24 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: -24 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                >
                  <CartaMao
                    carta={carta}
                    selecionada={cartasSelecionadas.some((c) => c.id === carta.id)}
                    onClick={() => ehMinhVez && toggleCarta(carta)}
                    disabled={!ehMinhVez}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Error */}
          <AnimatePresence>
            {erro && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-xs text-center rounded-xl px-3 py-2"
                style={{ background: 'rgba(220,55,48,0.1)', color: '#fca5a5', border: '1px solid rgba(220,55,48,0.2)' }}
              >
                {erro}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
