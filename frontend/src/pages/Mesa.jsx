import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PLAYERS } from '../data/players';
import { getChannel } from '../api/pusher';
import UnoChip from '../components/UnoChip';
import { Crown, Home, RotateCcw, ChevronRight, MessageSquare, Send, X, Zap, AlertTriangle } from 'lucide-react';

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
  vermelho: {
    hex: '#dc3730', dark: '#6b0e0e', darkMid: '#991515',
    glow: '0 0 40px rgba(220,55,48,0.75)',
    glowSoft: 'rgba(220,55,48,0.35)',
    bg: 'linear-gradient(155deg, #dc3730 0%, #6b0e0e 100%)',
    btn: 'linear-gradient(135deg, #dc3730, #a81c1c)',
  },
  azul: {
    hex: '#3b82f6', dark: '#1a3a8a', darkMid: '#1d4ed8',
    glow: '0 0 40px rgba(59,130,246,0.75)',
    glowSoft: 'rgba(59,130,246,0.35)',
    bg: 'linear-gradient(155deg, #3b82f6 0%, #1a3a8a 100%)',
    btn: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  verde: {
    hex: '#22c55e', dark: '#0d4a28', darkMid: '#16a34a',
    glow: '0 0 40px rgba(34,197,94,0.75)',
    glowSoft: 'rgba(34,197,94,0.35)',
    bg: 'linear-gradient(155deg, #22c55e 0%, #0d4a28 100%)',
    btn: 'linear-gradient(135deg, #22c55e, #15803d)',
  },
  amarelo: {
    hex: '#f59e0b', dark: '#7a4500', darkMid: '#d97706',
    glow: '0 0 40px rgba(245,158,11,0.75)',
    glowSoft: 'rgba(245,158,11,0.35)',
    bg: 'linear-gradient(155deg, #f59e0b 0%, #7a4500 100%)',
    btn: 'linear-gradient(135deg, #f59e0b, #c47d08)',
  },
};

const PLAYER_HEX = {
  red: '#dc3730', blue: '#3b82f6', green: '#22c55e',
  yellow: '#f59e0b', white: '#c8ccd8',
};

/* ─── Card label helpers ─── */
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
  if (carta.valor === 'bloqueio') return '⊘';
  if (carta.valor === 'reverso') return '⟳';
  if (carta.valor === 'coringa') return '★';
  return carta.valor;
}

/* ══════════════════════════════════════════════
   CARD IN HAND — premium feel
   ══════════════════════════════════════════════ */
function CartaMao({ carta, selecionada, onClick, disabled }) {
  const corObj = carta.cor ? COR[carta.cor] : null;
  const label = getLabelCarta(carta);
  const labelText = getLabelText(carta);
  const isIcon = carta.valor === 'bloqueio' || carta.valor === 'reverso';
  const isWild = carta.tipo === 'especial' && !carta.cor;

  return (
    <motion.button
      layout
      whileHover={!disabled ? { y: -20, scale: 1.14, rotate: -4, zIndex: 10 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      animate={selecionada ? { y: -24, scale: 1.16, zIndex: 10 } : { y: 0, scale: 1 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-shrink-0 select-none rounded-[10px] sm:rounded-[12px]
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        width: '42px',
        height: '62px',
        background: corObj ? corObj.bg : 'linear-gradient(155deg, #3a3b54, #1a1b28)',
        border: selecionada
          ? '2.5px solid rgba(255,255,255,0.95)'
          : '1.5px solid rgba(255,255,255,0.18)',
        boxShadow: selecionada
          ? `0 0 0 3px rgba(255,255,255,0.2), 0 20px 48px -8px rgba(255,255,255,0.15), ${corObj?.glow || '0 8px 24px rgba(0,0,0,0.6)'}`
          : disabled
            ? '0 2px 8px rgba(0,0,0,0.4)'
            : `0 6px 18px -4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.2)`,
        opacity: disabled && !selecionada ? 0.45 : 1,
      }}
    >
      {/* Oval center */}
      <div className="absolute" style={{ inset: '14% 9%', background: 'rgba(255,255,255,0.13)', borderRadius: '50% / 60%', transform: 'rotate(-20deg)' }} />
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-2/5 rounded-t-[10px] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent)' }} />
      {/* Corner top-left */}
      <div className="absolute top-0.5 left-0.5 font-black text-white leading-none" style={{ fontSize: '7px' }}>
        {labelText}
      </div>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '2px' }}>
        {isIcon ? (
          <span className="text-white block drop-shadow-lg" style={{ width: '22px', height: '22px' }}>{label}</span>
        ) : (
          <span className="text-white font-black leading-none drop-shadow-xl"
            style={{ fontSize: isWild ? '16px' : '22px', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {label}
          </span>
        )}
      </div>
      {/* Corner bottom-right */}
      <div className="absolute bottom-0.5 right-0.5 font-black text-white leading-none rotate-180" style={{ fontSize: '7px' }}>
        {labelText}
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════
   TOP CARD — discard pile, big + animated
   ══════════════════════════════════════════════ */
function CartaTopo({ carta, corAtual }) {
  if (!carta) return null;
  const displayCor = carta.cor || corAtual;
  const corObj = displayCor ? COR[displayCor] : null;
  const label = getLabelCarta(carta);
  const labelText = getLabelText(carta);
  const isIcon = carta.valor === 'bloqueio' || carta.valor === 'reverso';

  return (
    <motion.div
      key={carta.id}
      initial={{ scale: 0.2, rotate: -35, opacity: 0, y: -30 }}
      animate={{ scale: 1, rotate: [-14, 7, -4, 2, 0], opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 16 }}
      className="relative rounded-2xl"
      style={{
        width: '78px', height: '108px',
        background: corObj ? corObj.bg : 'linear-gradient(155deg, #3a3b54, #1a1b28)',
        border: '3px solid rgba(255,255,255,0.28)',
        boxShadow: corObj
          ? `${corObj.glow}, 0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -3px 0 rgba(0,0,0,0.2)`
          : '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      <div className="absolute" style={{ inset: '10%', background: 'rgba(255,255,255,0.12)', borderRadius: '50% / 62%', transform: 'rotate(-20deg)' }} />
      <div className="absolute inset-x-0 top-0 h-2/5 rounded-t-2xl pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent)' }} />
      <div className="absolute top-1 left-1.5 text-white font-black leading-none" style={{ fontSize: '10px' }}>
        {labelText}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-2.5">
        {isIcon ? (
          <span className="text-white block drop-shadow-2xl" style={{ width: '42px', height: '42px' }}>{label}</span>
        ) : (
          <span className="text-white font-black drop-shadow-2xl"
            style={{ fontSize: '44px', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>
            {label}
          </span>
        )}
      </div>
      <div className="absolute bottom-1 right-1.5 text-white font-black leading-none rotate-180" style={{ fontSize: '10px' }}>
        {labelText}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   CARD BACK — other players' hands
   ══════════════════════════════════════════════ */
function CartaVerso({ count }) {
  const slots = Math.min(count, 8);
  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: `${Math.max(28, slots * 9 + 16)}px`, height: '34px' }}>
        {Array.from({ length: slots }).map((_, i) => (
          <div key={i} className="absolute rounded-lg uno-card-back"
            style={{
              width: '18px', height: '28px',
              left: `${i * 9}px`, top: '3px',
              transform: `rotate(${(i - (slots - 1) / 2) * 2.5}deg)`,
              zIndex: i,
            }} />
        ))}
        {count > 8 && (
          <span className="absolute -right-5 top-2 text-[9px] font-black"
            style={{ color: 'rgba(255,255,255,0.5)' }}>+{count - 8}</span>
        )}
      </div>
    </div>
  );
}

/* ─── API helpers ─── */
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

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
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
  const chatEndRef = useRef(null);

  const pById = (id) => PLAYERS.find((p) => p.id === id);
  const mostrarNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  useEffect(() => {
    if (!user) return;
    async function init() {
      try {
        await apiEntrar(codigo, user.id, user.name);
        const { sala: s } = await apiGetSala(codigo);
        setSala(s);
        if (s.estado) setEstado(s.estado);
      } catch (e) { setErro(e.message); }
      finally { setLoading(false); }
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
      setTimeout(() => setUnoAnim(null), 3000);
    });
    channel.bind('chat-mensagem', ({ jogadorId, texto }) => {
      const p = PLAYERS.find((pl) => pl.id === jogadorId);
      setMensagens((prev) => [...prev.slice(-29), { jogadorId, nome: p?.name || jogadorId, texto, ts: Date.now() }]);
    });
    return () => { channel.unbind_all(); };
  }, [codigo, user]);

  useEffect(() => {
    if (chatAberto) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, chatAberto]);

  const toggleCarta = useCallback((carta) => {
    setCartasSelecionadas((prev) => {
      const has = prev.find((c) => c.id === carta.id);
      if (has) return prev.filter((c) => c.id !== carta.id);
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
      setCartasSelecionadas([]); setModal(null);
    } catch (e) { setErro(e.message); setCartasSelecionadas([]); }
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
    try { await apiAcao(codigo, user.id, 'uno'); } catch { }
  }
  async function enviarFrase(texto) {
    try { await apiAcao(codigo, user.id, 'chat', { texto }); } catch { }
  }
  async function enviarTexto() {
    const texto = textoChat.trim();
    if (!texto) return;
    setTextoChat('');
    try { await apiAcao(codigo, user.id, 'chat', { texto }); } catch { }
  }
  async function confirmarAcaoZero(acao, alvoId) {
    setErro('');
    try {
      if (acao === 'ver') {
        const p = pById(alvoId);
        const cartasAlvo = estado.maos[alvoId] || [];
        setVerCartasModal({ nome: p?.name || alvoId, cartas: cartasAlvo });
        await apiAcao(codigo, user.id, 'acaoZero', { acao, alvoId });
        setModal(null); setAlvoZero(null);
      } else {
        await apiAcao(codigo, user.id, 'acaoZero', { acao, alvoId });
        setModal(null); setAlvoZero(null);
      }
    } catch (e) { setErro(e.message); }
  }

  const minhaMao = estado?.maos?.[user?.id] || [];
  const ehMinhVez = estado?.turnoAtual === user?.id;
  const topo = estado?.pilha?.[estado.pilha.length - 1];
  const isCriador = sala?.criadorId === user?.id;
  const corAtualObj = estado?.corAtual ? COR[estado.corAtual] : null;

  /* ── LOADING ── */
  if (loading) {
    return (
      <div className="table-bg min-h-screen flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl blur-2xl scale-150"
            style={{ background: 'rgba(220,55,48,0.4)' }} />
          <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #dc3730, #8b1515)',
              boxShadow: '0 12px 40px -8px rgba(220,55,48,0.7), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
            <div className="absolute inset-[16%] rounded-[50%_/_58%] rotate-[-20deg]"
              style={{ background: 'rgba(255,255,255,0.16)' }} />
            <span className="relative font-display text-white text-2xl z-10">UNO</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
            className="w-5 h-5 border-2 rounded-full"
            style={{ borderColor: 'rgba(255,255,255,0.12)', borderTopColor: '#dc3730' }} />
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Entrando na sala...
          </p>
        </div>
      </div>
    );
  }

  /* ── ERROR ── */
  if (erro && !sala) {
    return (
      <div className="table-bg min-h-screen flex flex-col items-center justify-center gap-5 px-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(220,55,48,0.12)', border: '1px solid rgba(220,55,48,0.3)' }}>
          <AlertTriangle className="h-6 w-6" style={{ color: '#fca5a5' }} />
        </div>
        <div className="rounded-2xl p-6 text-center max-w-sm w-full"
          style={{ background: 'rgba(220,55,48,0.08)', border: '1px solid rgba(220,55,48,0.2)' }}>
          <p className="text-sm mb-4" style={{ color: '#fca5a5' }}>{erro}</p>
          <button onClick={() => navigate('/jogo')}
            className="text-sm font-semibold underline transition hover:no-underline"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            Voltar ao lobby
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     WIN SCREEN — epic, memorable
     ══════════════════════════════════════ */
  if (estado?.fase === 'fim') {
    const vencedor = pById(estado.vencedor);
    const vencedorHex = vencedor ? (PLAYER_HEX[vencedor.color] || '#f59e0b') : '#f59e0b';

    return (
      <div className="table-bg min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden relative">
        {/* Background rays */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          {/* Rotating rays behind winner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
            className="absolute w-[80vmin] h-[80vmin]"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${vencedorHex}08 10deg, transparent 20deg, transparent 30deg, ${vencedorHex}06 40deg, transparent 50deg)`,
              borderRadius: '50%',
            }} />
          {/* Center glow */}
          <div className="absolute w-[50vmin] h-[50vmin] rounded-full"
            style={{ background: `radial-gradient(circle, ${vencedorHex}20 0%, transparent 60%)` }} />
          {/* Outer ring */}
          <motion.div
            className="absolute ring-pulse"
            style={{
              width: '60vmin', height: '60vmin',
              border: `1px solid ${vencedorHex}30`,
              borderRadius: '50%',
            }} />
        </div>

        {/* Confetti particles */}
        {['#dc3730','#3b82f6','#22c55e','#f59e0b','#c8ccd8'].map((color, i) => (
          <motion.div key={i}
            initial={{ y: '-10vh', x: `${10 + i * 20}vw`, opacity: 0, rotate: 0 }}
            animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 720 }}
            transition={{ duration: 3 + i * 0.5, delay: i * 0.3, repeat: Infinity, repeatDelay: 2 }}
            className="pointer-events-none fixed w-3 h-3 rounded-sm"
            style={{ background: color, top: 0 }} />
        ))}

        <motion.div
          initial={{ scale: 0.2, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14 }}
          className="relative z-10 rounded-3xl p-8 text-center max-w-sm w-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
            border: `1.5px solid ${vencedorHex}50`,
            boxShadow: `0 0 100px -20px ${vencedorHex}50, 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          {/* Top accent bar */}
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl"
            style={{ background: `linear-gradient(90deg, transparent, ${vencedorHex}, transparent)` }} />

          <p className="text-[10px] font-bold uppercase tracking-[0.5em] mb-5"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            Vencedor da Partida
          </p>

          {/* Floating winner chip */}
          <motion.div
            className="flex justify-center mb-5"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl scale-200"
                style={{ background: `${vencedorHex}50` }} />
              {vencedor && (
                <div className="relative scale-125">
                  <UnoChip color={vencedor.color} label={vencedor.name[0]} />
                </div>
              )}
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
            className="font-display leading-none mb-1"
            style={{
              fontSize: 'clamp(3rem, 12vw, 5rem)',
              color: vencedorHex,
              textShadow: `0 0 40px ${vencedorHex}70`,
            }}
            translate="no"
          >
            {vencedor?.name}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-medium mb-8"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            ganhou a partida!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            <button onClick={() => navigate('/')}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold">
              <Home className="h-4 w-4" />
              Início
            </button>
            <button onClick={() => navigate('/jogo')}
              className="btn-primary flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold">
              <RotateCcw className="h-4 w-4" />
              Revanche
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     LOBBY SCREEN
     ══════════════════════════════════════ */
  if (!estado || sala?.fase === 'lobby') {
    return (
      <div className="uno-bg min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="pointer-events-none fixed inset-0 grid-pattern opacity-100 z-0" aria-hidden="true" />
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(220,55,48,0.16) 0%, transparent 60%)' }} />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
          className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>

          {/* Top accent */}
          <div className="h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(220,55,48,0.7), rgba(59,130,246,0.4), transparent)' }} />

          {/* Room code header */}
          <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] mb-2"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              Código da Sala
            </p>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-5xl sm:text-6xl tracking-[0.4em] text-gradient-gold leading-none">
                {codigo}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold rounded-full px-2.5 py-1 flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                <span className="status-online w-1.5 h-1.5 rounded-full" />
                Ao vivo
              </div>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Compartilhe este código com seus amigos
            </p>
          </div>

          {/* Players */}
          <div className="px-6 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] mb-3"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              Jogadores ({sala?.jogadores?.length ?? 0}/5)
            </p>
            <div className="space-y-2">
              {sala?.jogadores?.map((j, i) => {
                const p = pById(j.id);
                const hex = p ? (PLAYER_HEX[p.color] || '#dc3730') : '#dc3730';
                return (
                  <motion.div key={j.id}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 relative overflow-hidden"
                    style={{
                      background: `${hex}09`,
                      border: `1px solid ${hex}25`,
                    }}>
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                      style={{ background: hex, boxShadow: `0 0 6px ${hex}` }} />
                    {p && <UnoChip color={p.color} label={j.nome[0]} sm />}
                    <span className="font-semibold text-sm flex-1" translate="no">{j.nome}</span>
                    {j.id === sala.criadorId && (
                      <div className="flex items-center gap-1 text-[10px] font-bold"
                        style={{ color: '#f59e0b' }}>
                        <Crown className="h-3 w-3" /> Host
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 2 - (sala?.jogadores?.length ?? 0)) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ border: '1.5px dashed rgba(255,255,255,0.07)' }}>
                  <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Aguardando jogador...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start / wait */}
          <div className="px-6 pb-5">
            {isCriador ? (
              <motion.button whileTap={{ scale: 0.98 }} onClick={iniciarJogo}
                disabled={(sala?.jogadores?.length || 0) < 2}
                className="btn-primary w-full rounded-2xl py-4 text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2">
                {(sala?.jogadores?.length || 0) < 2
                  ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-4 h-4 border-2 rounded-full"
                      style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                      Aguardando jogadores...</>
                  : <><Zap className="h-4 w-4" />Iniciar Jogo!</>}
              </motion.button>
            ) : (
              <div className="flex items-center justify-center gap-2.5 py-3.5 text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
                  className="w-4 h-4 border-2 rounded-full"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: '#dc3730' }} />
                Aguardando o host iniciar...
              </div>
            )}
            {erro && <p className="mt-2 text-xs text-center" style={{ color: '#fca5a5' }}>{erro}</p>}
          </div>

          {/* Lobby chat */}
          <div className="px-6 pb-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] mt-4 mb-2.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Chat
            </p>
            <div className="rounded-2xl p-3 mb-2.5 h-32 overflow-y-auto flex flex-col gap-1.5"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {mensagens.length === 0 ? (
                <p className="text-xs text-center mt-9" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Nenhuma mensagem ainda
                </p>
              ) : mensagens.map((m) => (
                <div key={m.ts} className="text-xs leading-relaxed">
                  <span className="font-bold" style={{ color: 'rgba(255,255,255,0.55)' }} translate="no">
                    {m.nome}:
                  </span>{' '}
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{m.texto}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input type="text" value={textoChat}
                onChange={(e) => setTextoChat(e.target.value.slice(0, 100))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) enviarTexto(); }}
                placeholder="Mensagem..."
                className="flex-1 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  placeholder: 'rgba(255,255,255,0.3)',
                }} />
              <button onClick={enviarTexto} disabled={!textoChat.trim()}
                className="btn-primary px-3.5 py-2.5 rounded-xl text-white disabled:opacity-40">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     GAMEPLAY SCREEN — THE MAIN EVENT
     ══════════════════════════════════════ */
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden table-felt">

      {/* Dynamic color ambient — changes with current UNO color */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        animate={{ opacity: corAtualObj ? 1 : 0 }}
        transition={{ duration: 1.2 }}
        style={{
          background: corAtualObj
            ? `radial-gradient(ellipse 70% 60% at 50% 105%, ${corAtualObj.hex}10 0%, transparent 65%)`
            : undefined,
        }} />

      {/* Subtle grid */}
      <div className="pointer-events-none fixed inset-0 z-0 grid-pattern opacity-100" aria-hidden="true" />

      {/* ── FLOATING NOTIFICATION ── */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
            style={{
              background: 'rgba(10,11,20,0.96)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
              backdropFilter: 'blur(14px)',
            }}
          >
            {notif}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UNO! BURST ── */}
      <AnimatePresence>
        {unoAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -25 }}
            animate={{ scale: [0, 1.5, 1.1], opacity: 1, rotate: [-25, 8, 0] }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 13 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              {/* Glow rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                  transition={{ repeat: 3, duration: 0.5, ease: 'easeOut' }}
                  className="absolute rounded-full"
                  style={{ width: '200px', height: '200px', background: 'rgba(245,158,11,0.25)' }} />
              </div>
              <span className="font-display select-none relative"
                style={{
                  fontSize: 'clamp(6rem, 20vw, 12rem)',
                  color: '#f59e0b',
                  textShadow: '0 0 80px rgba(245,158,11,0.9), 0 0 160px rgba(245,158,11,0.5), 0 0 240px rgba(245,158,11,0.2)',
                  letterSpacing: '0.1em',
                }}>
                UNO!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COLOR PICKER MODAL ── */}
      <AnimatePresence>
        {modal === 'escolherCor' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4"
            style={{ backdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ scale: 0.65, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="rounded-3xl p-6 w-full max-w-xs text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.09)',
              }}>
              <p className="font-display text-4xl leading-none mb-1">Escolha a cor</p>
              <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Qual cor ativa agora?</p>
              <div className="grid grid-cols-2 gap-3">
                {CORES_UNO.map((cor) => (
                  <motion.button key={cor}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => enviarJogada(cor)}
                    className="rounded-2xl py-5 text-white font-bold text-sm transition-all relative overflow-hidden"
                    style={{
                      background: COR[cor].bg,
                      boxShadow: `0 8px 28px -8px ${COR[cor].hex}80, inset 0 1px 0 rgba(255,255,255,0.2)`,
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}>
                    <div className="absolute inset-[15%_10%] rounded-[50%_/_60%] rotate-[-20deg]"
                      style={{ background: 'rgba(255,255,255,0.12)' }} />
                    <span className="relative">{COR_LABEL[cor]}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ZERO CARD MODAL ── */}
      <AnimatePresence>
        {modal === 'acaoZero' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4"
            style={{ backdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ scale: 0.65, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="rounded-3xl p-6 w-full max-w-xs text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.85)',
              }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Zap className="h-6 w-6" style={{ color: '#f59e0b' }} />
              </div>
              <p className="font-display text-3xl mb-1">Carta Zero!</p>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Escolha uma ação:</p>
              {!alvoZero ? (
                <div className="flex gap-3">
                  {[
                    { id: 'ver', label: 'Ver cartas', bg: 'linear-gradient(135deg, #3b82f6, #1a3a7a)', glow: 'rgba(59,130,246,0.5)' },
                    { id: 'trocar', label: 'Trocar mão', bg: 'linear-gradient(135deg, #dc3730, #6b0e0e)', glow: 'rgba(220,55,48,0.5)' },
                  ].map((a) => (
                    <motion.button key={a.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setAlvoZero(a.id)}
                      className="flex-1 rounded-2xl py-4 text-white font-bold text-sm transition"
                      style={{ background: a.bg, boxShadow: `0 8px 28px -8px ${a.glow}`, border: '1px solid rgba(255,255,255,0.12)' }}>
                      {a.label}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {alvoZero === 'ver' ? 'Ver cartas de quem?' : 'Trocar mão com quem?'}
                  </p>
                  <div className="space-y-2">
                    {estado.jogadores.filter((id) => id !== user.id).map((id) => {
                      const p = pById(id);
                      const hex = p ? (PLAYER_HEX[p.color] || '#dc3730') : '#dc3730';
                      return (
                        <motion.button key={id} whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}
                          onClick={() => confirmarAcaoZero(alvoZero, id)}
                          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition"
                          style={{
                            background: `${hex}0d`,
                            border: `1px solid ${hex}30`,
                          }}>
                          {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                          <span className="font-semibold text-sm flex-1 text-left" translate="no">{p?.name}</span>
                          <ChevronRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                        </motion.button>
                      );
                    })}
                  </div>
                  <button onClick={() => setAlvoZero(null)}
                    className="mt-4 text-xs transition hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Voltar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIEW CARDS MODAL ── */}
      <AnimatePresence>
        {verCartasModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4"
            style={{ backdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ scale: 0.65, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="rounded-3xl p-6 w-full max-w-sm text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.85)',
              }}>
              <p className="font-display text-2xl mb-0.5">
                Cartas de <span translate="no">{verCartasModal.nome}</span>
              </p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Só você pode ver isso</p>
              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {verCartasModal.cartas.map((carta) => {
                  const corObj = carta.cor ? COR[carta.cor] : null;
                  return (
                    <div key={carta.id} className="relative rounded-xl flex items-center justify-center"
                      style={{
                        width: '42px', height: '60px',
                        background: corObj ? corObj.bg : 'linear-gradient(155deg, #3a3b54, #1a1b28)',
                        border: '1.5px solid rgba(255,255,255,0.18)',
                        boxShadow: corObj ? `0 4px 12px -4px ${corObj.hex}60` : '0 4px 12px rgba(0,0,0,0.4)',
                      }}>
                      <div className="absolute" style={{ inset: '14% 9%', background: 'rgba(255,255,255,0.12)', borderRadius: '50% / 60%', transform: 'rotate(-20deg)' }} />
                      <span className="relative text-white font-black text-lg drop-shadow-lg">
                        {getLabelText(carta)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setVerCartasModal(null)}
                className="btn-primary w-full rounded-2xl py-3 text-sm font-bold">
                Fechar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHAT BUTTON ── */}
      <div className="fixed bottom-36 right-3 z-30 sm:bottom-40 sm:right-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setChatAberto((v) => !v)}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition shadow-xl"
          style={{
            background: chatAberto
              ? 'linear-gradient(135deg, #dc3730, #a81c1c)'
              : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: chatAberto
              ? '0 8px 24px -4px rgba(220,55,48,0.6)'
              : '0 4px 16px rgba(0,0,0,0.5)',
          }}>
          {chatAberto
            ? <X className="w-4 h-4 text-white" />
            : <MessageSquare className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.65)' }} />}
        </motion.button>
        <AnimatePresence>
          {mensagens.length > 0 && !chatAberto && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
              style={{ background: '#dc3730', boxShadow: '0 0 8px rgba(220,55,48,0.7)' }}>
              {mensagens.length > 9 ? '9+' : mensagens.length}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── FLOATING CHAT MESSAGES ── */}
      <div className="fixed bottom-48 left-2 right-16 z-20 pointer-events-none sm:left-3 sm:right-auto sm:w-60">
        <AnimatePresence>
          {mensagens.slice(-3).map((m) => (
            <motion.div key={m.ts}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-1.5 rounded-xl px-3 py-2"
              style={{
                background: 'rgba(8,9,18,0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
              }}>
              <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }} translate="no">
                {m.nome}:
              </span>{' '}
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{m.texto}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── CHAT PANEL ── */}
      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="fixed bottom-48 right-3 z-30 w-64 rounded-2xl p-3 sm:right-4"
            style={{
              background: 'rgba(8,9,18,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(16px)',
            }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] mb-2.5 px-1"
              style={{ color: 'rgba(255,255,255,0.35)' }}>Chat ao vivo</p>
            <div className="flex gap-1.5 mb-2.5">
              <input type="text" value={textoChat}
                onChange={(e) => setTextoChat(e.target.value.slice(0, 100))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) enviarTexto(); }}
                placeholder="Mensagem..."
                className="flex-1 rounded-xl px-3 py-2 text-xs text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }} />
              <button onClick={enviarTexto} disabled={!textoChat.trim()}
                className="btn-primary px-2.5 py-2 rounded-xl disabled:opacity-40">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5 px-1"
              style={{ color: 'rgba(255,255,255,0.25)' }}>Frases rápidas</p>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {FRASES.map((frase) => (
                <button key={frase} onClick={() => enviarFrase(frase)}
                  className="w-full text-left text-xs rounded-xl px-3 py-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                  {frase}
                </button>
              ))}
            </div>
            <div className="max-h-28 overflow-y-auto mt-2.5 space-y-1" ref={chatEndRef}>
              {mensagens.map((m) => (
                <div key={m.ts} className="text-xs leading-relaxed">
                  <span className="font-bold" style={{ color: 'rgba(255,255,255,0.5)' }} translate="no">{m.nome}:</span>{' '}
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{m.texto}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════
          MAIN GAME LAYOUT
          ══════════════════════ */}
      <div className="relative z-10 flex flex-col min-h-screen p-2 gap-2 sm:p-3 sm:gap-3">

        {/* ── OTHER PLAYERS ── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {estado.jogadores.filter((id) => id !== user.id).map((id) => {
            const p = pById(id);
            const mao = estado.maos[id] || [];
            const ehVez = estado.turnoAtual === id;
            const temUno = estado.unoDeclarado?.[id];
            const hex = p ? (PLAYER_HEX[p.color] || '#dc3730') : '#dc3730';

            return (
              <motion.div key={id}
                animate={ehVez ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ repeat: ehVez ? Infinity : 0, duration: 1.8 }}
                className="rounded-2xl p-3 flex flex-col gap-2 transition-all relative overflow-hidden"
                style={{
                  background: ehVez ? `${hex}08` : 'rgba(255,255,255,0.03)',
                  border: ehVez ? `2px solid ${hex}55` : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: ehVez ? `0 0 32px -6px ${hex}40` : 'none',
                }}
              >
                {/* Left accent when active */}
                {ehVez && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5"
                    style={{ background: hex, boxShadow: `0 0 8px ${hex}` }} />
                )}

                <div className="flex items-center gap-2">
                  {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" translate="no">{p?.name}</p>
                    {ehVez && (
                      <motion.p animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                        className="text-[10px] font-black uppercase tracking-wider"
                        style={{ color: '#f59e0b' }}>
                        jogando
                      </motion.p>
                    )}
                  </div>
                  {temUno && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.5)' }}>
                      UNO
                    </motion.span>
                  )}
                </div>

                <CartaVerso count={mao.length} />

                <p className="text-[9px] text-center uppercase tracking-wider font-medium"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {mao.length} carta{mao.length !== 1 ? 's' : ''}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── GAME TABLE CENTER ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2">

          {/* Current color indicator */}
          <AnimatePresence mode="wait">
            {estado.corAtual && corAtualObj && (
              <motion.div key={estado.corAtual}
                initial={{ scale: 0.7, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest relative"
                style={{
                  background: corAtualObj.bg,
                  boxShadow: `${corAtualObj.glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                <span className="w-2 h-2 rounded-full bg-white/80" />
                {COR_LABEL[estado.corAtual]}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deck & discard pile */}
          <div className="flex items-center gap-8 sm:gap-12">

            {/* Draw pile */}
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileHover={ehMinhVez ? { scale: 1.08, rotate: -6, y: -4 } : {}}
                whileTap={ehMinhVez ? { scale: 0.92 } : {}}
                onClick={ehMinhVez ? comprar : undefined}
                className="relative flex items-center justify-center rounded-2xl transition-all"
                style={{
                  width: '64px', height: '90px',
                  background: ehMinhVez
                    ? 'linear-gradient(155deg, #dc3730, #6b0e0e)'
                    : 'linear-gradient(155deg, #252636, #15161f)',
                  border: ehMinhVez
                    ? '2px solid rgba(220,55,48,0.6)'
                    : '2px solid rgba(255,255,255,0.1)',
                  cursor: ehMinhVez ? 'pointer' : 'not-allowed',
                  opacity: ehMinhVez ? 1 : 0.5,
                  boxShadow: ehMinhVez
                    ? '0 12px 32px -8px rgba(220,55,48,0.7), inset 0 1px 0 rgba(255,255,255,0.18)'
                    : '0 4px 16px rgba(0,0,0,0.5)',
                }}>
                {/* Oval */}
                <div className="absolute" style={{ inset: '16% 10%', background: 'rgba(255,255,255,0.1)', borderRadius: '50% / 60%', transform: 'rotate(-20deg)' }} />
                <span className="relative font-display text-white text-sm tracking-widest z-10">UNO</span>
                {estado.acumulado > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-2.5 -right-2.5 text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #dc3730, #a81c1c)',
                      boxShadow: '0 4px 12px -4px rgba(220,55,48,0.8)',
                      border: '2px solid #07080f',
                    }}>
                    +{estado.acumulado}
                  </motion.span>
                )}
              </motion.button>
              {ehMinhVez && (
                <p className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  comprar
                </p>
              )}
            </div>

            {/* Discard pile */}
            <div className="flex flex-col items-center gap-2">
              <CartaTopo carta={topo} corAtual={estado.corAtual} />
              <p className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                pilha
              </p>
            </div>
          </div>

          {/* Turn indicator */}
          <div className="text-center px-4">
            <AnimatePresence mode="wait">
              {ehMinhVez ? (
                <motion.div key="my-turn"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}>
                  <motion.p
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-base font-black uppercase tracking-widest"
                    style={{ color: '#f59e0b', textShadow: '0 0 20px rgba(245,158,11,0.6)' }}>
                    Sua vez!
                  </motion.p>
                </motion.div>
              ) : (
                <motion.p key="other-turn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Vez de{' '}
                  <span className="font-bold" style={{ color: 'rgba(255,255,255,0.8)' }} translate="no">
                    {pById(estado.turnoAtual)?.name}
                  </span>
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {estado.acumulado > 0 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(220,55,48,0.15)', color: '#fca5a5', border: '1px solid rgba(220,55,48,0.35)' }}>
                  <Zap className="h-3 w-3" />
                  Acumulado: +{estado.acumulado} cartas!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Zero card action */}
          <AnimatePresence>
            {ehMinhVez && estado.fase === 'acaoZero' && (
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setModal('acaoZero')}
                className="btn-gold rounded-2xl px-5 py-2.5 text-sm font-bold">
                Escolher ação da carta 0
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── MY HAND PANEL ── */}
        <div
          className="rounded-3xl p-3 sm:p-4 transition-all duration-500"
          style={ehMinhVez ? {
            background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(255,255,255,0.025) 100%)',
            border: '1.5px solid rgba(245,158,11,0.35)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 0 40px -16px rgba(245,158,11,0.3), inset 0 1px 0 rgba(245,158,11,0.1)',
          } : {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>

          {/* Hand header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {user && pById(user.id) && (
                <UnoChip color={pById(user.id).color} label={user.name[0]} sm />
              )}
              <span className="text-sm font-semibold" translate="no">{user?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: ehMinhVez ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.07)',
                  color: ehMinhVez ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                  border: ehMinhVez ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.1)',
                }}>
                {minhaMao.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* UNO button — shows when 1 card */}
              <AnimatePresence>
                {minhaMao.length === 1 && (
                  <motion.button
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    whileHover={{ scale: 1.08, rotate: -3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={declararUno}
                    className="btn-gold rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                    UNO!
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Play button */}
              <AnimatePresence>
                {cartasSelecionadas.length > 0 && ehMinhVez && (
                  <motion.button
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                    onClick={jogar}
                    className="btn-primary rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    Jogar {cartasSelecionadas.length > 1 ? `(${cartasSelecionadas.length})` : ''}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Cards */}
          <div className="card-hand">
            <AnimatePresence>
              {minhaMao.map((carta, i) => (
                <motion.div key={carta.id} layout
                  initial={{ scale: 0, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: -30 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.02 }}>
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
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-2 text-xs text-center rounded-xl px-3 py-2"
                style={{ background: 'rgba(220,55,48,0.1)', color: '#fca5a5', border: '1px solid rgba(220,55,48,0.22)' }}>
                {erro}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
