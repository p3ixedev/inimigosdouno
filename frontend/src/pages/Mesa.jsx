// ============================================================
// Mesa.jsx - Redesign AAA da tela de partida
//
// IMPORTANTE: 100% da lógica original foi preservada:
//  - Todos os imports, hooks, state, refs, useEffect, callbacks
//  - Todas as chamadas de API (apiEntrar, apiGetSala, apiAcao)
//  - Toda a integração Pusher e eventos (jogador-entrou,
//    jogo-iniciado, estado-atualizado, uno-declarado, chat-mensagem)
//  - Todas as constantes (COR, CORES_UNO, COR_LABEL, FRASES,
//    CONFETTI_PIECES, BLOQUEIO_SVG, REVERSO_SVG) e helpers
//    (getLabelCarta, getSubLabel, getIconCarta)
//  - Toda a lógica de estados derivados e fluxo do jogo
//
// Apenas a camada visual (JSX + classes) foi refeita.
// Requer: `import './Mesa.css'` (arquivo acompanhante).
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PLAYERS, COLOR_STYLES } from '../data/players';
import { getChannel } from '../api/pusher';
import UnoChip from '../components/UnoChip';
import { Crown, Home, RotateCcw, ChevronRight, Copy, Check, Trophy, LogOut, MessageCircle, X } from 'lucide-react';
import './Mesa.css';

const CORES_UNO = ['vermelho', 'azul', 'verde', 'amarelo'];
const COR_LABEL = { vermelho: 'Vermelho', azul: 'Azul', verde: 'Verde', amarelo: 'Amarelo' };

const FRASES = [
  "Nem minha vo jogava assim",
  "Continua assim...",
  "Desiste logo",
  "To sendo roubado",
  "Impossivel isso",
  "Pega +4 idiota",
  "Voce e uma vergonha",
  "Ate meu cachorro joga melhor",
  "Obrigado pelo +4",
  "To gostando desse baralho",
];

const COR = {
  vermelho: { bg: 'bg-[oklch(0.63_0.24_27)]', from: 'oklch(0.68 0.23 27)', to: 'oklch(0.42 0.20 27)', glow: 'shadow-[0_0_30px_oklch(0.63_0.24_27/0.55)]', btn: 'bg-[oklch(0.63_0.24_27)] hover:bg-[oklch(0.68_0.24_27)]', hex: 'oklch(0.63 0.24 27)' },
  azul:     { bg: 'bg-[oklch(0.6_0.22_255)]',  from: 'oklch(0.65 0.21 255)', to: 'oklch(0.40 0.19 255)', glow: 'shadow-[0_0_30px_oklch(0.6_0.22_255/0.55)]',  btn: 'bg-[oklch(0.6_0.22_255)] hover:bg-[oklch(0.65_0.22_255)]',  hex: 'oklch(0.6 0.22 255)' },
  verde:    { bg: 'bg-[oklch(0.68_0.2_152)]',  from: 'oklch(0.72 0.19 152)', to: 'oklch(0.45 0.17 152)', glow: 'shadow-[0_0_30px_oklch(0.68_0.2_152/0.55)]',  btn: 'bg-[oklch(0.68_0.2_152)] hover:bg-[oklch(0.73_0.2_152)]',  hex: 'oklch(0.68 0.2 152)' },
  amarelo:  { bg: 'bg-[oklch(0.85_0.18_90)]',  from: 'oklch(0.90 0.17 90)', to: 'oklch(0.65 0.18 90)',  glow: 'shadow-[0_0_30px_oklch(0.85_0.18_90/0.55)]',  btn: 'bg-[oklch(0.85_0.18_90)] hover:bg-[oklch(0.88_0.18_90)]',  hex: 'oklch(0.85 0.18 90)' },
};

const COR_ESCURO = {
  vermelho: 'oklch(0.35 0.18 27)',
  azul: 'oklch(0.32 0.16 255)',
  verde: 'oklch(0.38 0.14 152)',
  amarelo: 'oklch(0.52 0.14 90)',
};

// Confete gerado uma unica vez (constante do modulo)
const CONFETTI_PIECES = Array.from({ length: 22 }).map((_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const dist = 90 + (i % 3) * 36;
  const cores = [COR.vermelho.hex, COR.azul.hex, COR.verde.hex, COR.amarelo.hex, 'oklch(0.9 0.16 85)'];
  return {
    id: i,
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    color: cores[i % cores.length],
    delay: (i % 7) * 0.035,
    rotate: (i % 2 === 0 ? 1 : -1) * (160 + i * 9),
  };
});

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
  if (carta.valor === 'bloqueio') return 'X';
  if (carta.valor === 'reverso') return 'R';
  if (carta.valor === 'coringa') return '*';
  return carta.valor;
}

function getSubLabel(carta) {
  if (carta.valor === 'bloqueio') return 'BLOCK';
  if (carta.valor === 'reverso') return 'REV';
  if (carta.valor === '+2') return 'DRAW';
  if (carta.valor === '+4') return 'WILD';
  if (carta.valor === 'coringa') return 'WILD';
  return null;
}

function getIconCarta(carta) {
  if (carta.valor === 'bloqueio') return BLOQUEIO_SVG;
  if (carta.valor === 'reverso') return REVERSO_SVG;
  return null;
}

// ------------------------------------------------------------
// Carta na mao do jogador
// Mesmo layoutId que a carta topo - permite "voo" contínuo.
// ------------------------------------------------------------
function CartaMao({ carta, selecionada, onClick, disabled }) {
  const isEspecial = carta.tipo === 'especial';
  const isDestaque = carta.tipo === 'acao' || carta.tipo === 'especial';
  const corObj = carta.cor ? COR[carta.cor] : null;
  const label = getLabelCarta(carta);
  const sub = getSubLabel(carta);
  const icon = getIconCarta(carta);
  const gradFrom = corObj ? corObj.from : 'oklch(0.32 0.01 260)';
  const gradTo = corObj ? corObj.to : 'oklch(0.14 0.005 260)';

  return (
    <motion.button
      layoutId={`card-${carta.id}`}
      layout
      initial={{ scale: 0, opacity: 0, y: 30 }}
      exit={{ scale: 0, opacity: 0, y: -20 }}
      whileHover={!disabled ? { y: -20, scale: 1.09, rotate: -2 } : {}}
      whileTap={!disabled ? { scale: 0.94 } : {}}
      animate={selecionada ? { y: -26, scale: 1.12, opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      onClick={onClick}
      disabled={disabled}
      className={`mesa-card mesa-card-sheen flex-shrink-0 select-none w-[52px] h-[76px] sm:w-[62px] sm:h-[92px] ${selecionada ? 'is-selected' : ''} ${disabled ? 'is-disabled cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ '--card-from': gradFrom, '--card-to': gradTo }}
    >
      <span className="mesa-card-oval" />
      {isDestaque && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white/80 z-10" />
      )}
      <div className="absolute top-1 left-1.5 text-white font-black leading-none z-10"
           style={{ fontSize: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>
        {label}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-10">
        {icon ? (
          <span className="text-white block w-7 h-7 sm:w-8 sm:h-8"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.55))' }}>
            {icon}
          </span>
        ) : (
          <span className="text-white font-black leading-none"
                style={{ fontSize: isEspecial ? '20px' : '26px', textShadow: '0 2px 6px rgba(0,0,0,0.55)' }}>
            {label}
          </span>
        )}
        {sub && (
          <span className="mt-0.5 text-white/55 font-bold"
                style={{ fontSize: '5.5px', letterSpacing: '0.1em' }}>
            {sub}
          </span>
        )}
      </div>
      <div className="absolute bottom-1 right-1.5 text-white font-black leading-none rotate-180 z-10"
           style={{ fontSize: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>
        {label}
      </div>
    </motion.button>
  );
}

// ------------------------------------------------------------
// Carta no topo da pilha
// ------------------------------------------------------------
function CartaTopo({ carta, corAtual }) {
  if (!carta) return null;
  const corObj = carta.cor ? COR[carta.cor] : (corAtual ? COR[corAtual] : null);
  const label = getLabelCarta(carta);
  const sub = getSubLabel(carta);
  const icon = getIconCarta(carta);
  const gradFrom = corObj ? corObj.from : 'oklch(0.4 0.01 260)';
  const gradTo = corObj ? corObj.to : 'oklch(0.16 0.005 260)';

  return (
    <motion.div
      layoutId={`card-${carta.id}`}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, rotate: [-10, 6, -3, 2, 0] }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      className="mesa-card mesa-card-lg mesa-card-sheen relative w-[96px] h-[136px] sm:w-[112px] sm:h-[158px]"
      style={{ '--card-from': gradFrom, '--card-to': gradTo }}
    >
      <span className="mesa-card-oval" />
      <div className="absolute top-1.5 left-2 text-white font-black leading-none z-10"
           style={{ fontSize: '12px', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
        {label}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
        {icon ? (
          <span className="text-white block w-12 h-12 sm:w-14 sm:h-14"
                style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.65))' }}>
            {icon}
          </span>
        ) : (
          <span className="text-white font-black leading-none"
                style={{ fontSize: '42px', textShadow: '0 3px 10px rgba(0,0,0,0.65)' }}>
            {label}
          </span>
        )}
        {sub && (
          <span className="mt-1 text-white/60 font-bold"
                style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
            {sub}
          </span>
        )}
      </div>
      <div className="absolute bottom-1.5 right-2 text-white font-black leading-none rotate-180 z-10"
           style={{ fontSize: '12px', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
        {label}
      </div>
    </motion.div>
  );
}

// Miniatura empilhada de mão de adversário
function MaoMini({ count }) {
  const visiveis = Math.min(count, 7);
  return (
    <div className="mesa-mini-backs">
      {Array.from({ length: visiveis }).map((_, i) => (
        <span
          key={i}
          className="mesa-mini-back"
          style={{ transform: `translateY(${(i % 2) * -1}px) rotate(${(i - visiveis / 2) * 3}deg)` }}
        />
      ))}
      {count > visiveis && (
        <span className="text-[10px] text-zinc-500 self-center ml-1">+{count - visiveis}</span>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// API helpers (inalterados)
// ------------------------------------------------------------
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

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
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
  const [copiado, setCopiado] = useState(false);
  const [flourish, setFlourish] = useState(null);
  const mensagensEndRef = useRef(null);
  const channelRef = useRef(null);
  const prevTopoIdRef = useRef(null);

  const pById = (id) => PLAYERS.find((p) => p.id === id);

  const mostrarNotif = (msg) => {
    setNotif(msg);
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
      mostrarNotif(`${p?.name} gritou UNO!`);
      setTimeout(() => setUnoAnim(null), 2500);
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

  function copiarCodigo() {
    try {
      navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch (e) {}
  }

  const minhaMao = estado?.maos?.[user?.id] || [];
  const ehMinhVez = estado?.turnoAtual === user?.id;
  const topo = estado?.pilha?.[estado.pilha.length - 1];
  const isCriador = sala?.criadorId === user?.id;
  const corAtualObj = estado?.corAtual ? COR[estado.corAtual] : null;

  // Flourish em cartas de ação / especial
  useEffect(() => {
    if (!topo) return;
    const isNovaCarta = prevTopoIdRef.current !== null && prevTopoIdRef.current !== topo.id;
    if (isNovaCarta && (topo.tipo === 'acao' || topo.tipo === 'especial')) {
      const corFlourish = topo.cor || estado?.corAtual;
      setFlourish({ key: Date.now(), cor: corFlourish });
      const t = setTimeout(() => setFlourish(null), 850);
      prevTopoIdRef.current = topo.id;
      return () => clearTimeout(t);
    }
    prevTopoIdRef.current = topo.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topo?.id]);

  let viewKey = 'jogo';
  let content;

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------
  if (loading) {
    viewKey = 'loading';
    content = (
      <div className="mesa-room min-h-screen flex flex-col items-center justify-center gap-5">
        <div className="relative h-14 w-14 z-10">
          <div className="absolute inset-0 rounded-full border-2 border-white/8" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[oklch(0.9_0.16_85)] animate-spin" />
        </div>
        <p className="mesa-eyebrow z-10">Entrando na sala</p>
      </div>
    );
  }
  // ------------------------------------------------------------
  // ERRO
  // ------------------------------------------------------------
  else if (erro && !sala) {
    viewKey = 'erro';
    content = (
      <div className="mesa-room min-h-screen flex flex-col items-center justify-center gap-5 px-4">
        <p className="text-[oklch(0.82_0.16_27)] text-center text-sm z-10">{erro}</p>
        <button onClick={() => navigate('/jogo')} className="mesa-btn mesa-btn-ghost z-10">
          Voltar ao lobby
        </button>
      </div>
    );
  }
  // ------------------------------------------------------------
  // FIM DE PARTIDA
  // ------------------------------------------------------------
  else if (estado?.fase === 'fim') {
    viewKey = 'fim';
    const vencedorPlayer = PLAYERS.find((p) => p.id === estado.vencedor);
    content = (
      <div className="mesa-room min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          className="mesa-surface relative w-full max-w-sm p-8 text-center overflow-hidden z-10"
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            {CONFETTI_PIECES.map((c) => (
              <motion.div
                key={c.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{ x: c.x, y: c.y, opacity: 0, scale: 1, rotate: c.rotate }}
                transition={{ duration: 1.25, delay: 0.35 + c.delay, ease: 'easeOut' }}
                className="absolute h-2 w-2 rounded-sm"
                style={{ background: c.color }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, oklch(0.9 0.17 88 / 0.2), oklch(0.72 0.19 82 / 0.1))',
              border: '1px solid oklch(0.9 0.17 85 / 0.35)',
            }}
          >
            <Trophy className="h-6 w-6 text-[oklch(0.9_0.16_85)]" />
          </motion.div>
          <p className="mesa-eyebrow relative mb-3">Vencedor</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative flex justify-center mb-3"
          >
            {vencedorPlayer && <UnoChip color={vencedorPlayer.color} label={vencedorPlayer.name[0]} />}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative mesa-display text-5xl mb-7"
            translate="no"
          >
            {vencedorPlayer?.name}
          </motion.h2>
          <div className="relative flex gap-3">
            <button onClick={() => navigate('/')} className="mesa-btn mesa-btn-ghost flex-1">
              <Home className="h-4 w-4" /> Inicio
            </button>
            <button onClick={() => navigate('/jogo')} className="mesa-btn mesa-btn-primary flex-1">
              <RotateCcw className="h-4 w-4" /> Jogar de novo
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  // ------------------------------------------------------------
  // LOBBY
  // ------------------------------------------------------------
  else if (!estado || sala?.fase === 'lobby') {
    viewKey = 'lobby';
    content = (
      <div className="mesa-room min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mesa-surface relative z-10 w-full max-w-sm p-6"
        >
          <div className="text-center mb-7">
            <p className="mesa-eyebrow mb-3">Codigo da sala</p>
            <button
              onClick={copiarCodigo}
              className="group inline-flex items-center gap-2 rounded-2xl px-2 py-1 transition hover:bg-white/5"
            >
              <h2 className="mesa-display text-6xl tracking-[0.4em] text-[oklch(0.9_0.16_85)]">{codigo}</h2>
              {copiado ? (
                <Check className="h-5 w-5 text-[oklch(0.72_0.19_152)]" />
              ) : (
                <Copy className="h-5 w-5 text-zinc-500 opacity-0 transition group-hover:opacity-100" />
              )}
            </button>
            <p className="text-xs text-zinc-500 mt-3">Toque no codigo para copiar e manda pros amigos!</p>
          </div>
          <div className="space-y-2 mb-6">
            <p className="mesa-eyebrow">Jogadores ({sala?.jogadores?.length}/5)</p>
            <AnimatePresence>
              {sala?.jogadores?.map((j, i) => {
                const p = pById(j.id);
                return (
                  <motion.div
                    key={j.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="mesa-surface-flat flex items-center gap-3 px-4 py-3"
                  >
                    {p && <UnoChip color={p.color} label={j.nome[0]} sm />}
                    <span className="font-semibold" translate="no">{j.nome}</span>
                    {j.id === sala.criadorId && <Crown className="h-3.5 w-3.5 text-[oklch(0.9_0.16_85)] ml-auto" />}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {isCriador ? (
            <button
              onClick={iniciarJogo}
              disabled={(sala?.jogadores?.length || 0) < 2}
              className="mesa-btn mesa-btn-primary w-full py-3.5 text-sm uppercase tracking-wider"
            >
              {(sala?.jogadores?.length || 0) < 2 ? 'Aguardando jogadores...' : 'Iniciar jogo!'}
            </button>
          ) : (
            <p className="flex items-center justify-center gap-2 text-center text-sm text-zinc-400 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.9_0.16_85)] animate-pulse" />
              Aguardando o criador iniciar...
            </p>
          )}
          {erro && <p className="mt-3 text-sm text-[oklch(0.82_0.16_27)] text-center">{erro}</p>}

          <div className="mt-6 border-t border-white/8 pt-5">
            <p className="mesa-eyebrow mb-3">Chat</p>
            <div className="mesa-surface-flat p-2 mb-2 h-28 overflow-y-auto flex flex-col gap-1">
              {mensagens.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center mt-8">Nenhuma mensagem ainda</p>
              ) : (
                mensagens.map((m) => (
                  <div key={m.ts} className="text-xs">
                    <span className="font-bold text-zinc-400" translate="no">{m.nome}: </span>
                    <span className="text-zinc-200">{m.texto}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={textoChat}
                onChange={(e) => setTextoChat(e.target.value.slice(0, 100))}
                onKeyDown={(e) => e.key === 'Enter' && enviarTexto()}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[oklch(0.9_0.16_85)] transition [color-scheme:dark]"
              />
              <button onClick={enviarTexto} disabled={!textoChat.trim()} className="mesa-btn mesa-btn-primary mesa-btn-sm">
                Enviar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  // ------------------------------------------------------------
  // PARTIDA (redesign principal)
  // ------------------------------------------------------------
  else {
    viewKey = 'jogo';
    const cartasCount = minhaMao.length;
    content = (
      <div className="mesa-room min-h-screen flex flex-col">
        {/* Halo dinâmico na cor atual */}
        <div
          className="mesa-hue"
          style={{
            background: corAtualObj
              ? `radial-gradient(ellipse 60% 45% at 50% 50%, ${corAtualObj.hex.replace(')', ' / 0.18)')} 0%, transparent 65%)`
              : undefined,
          }}
        />
        {/* Feltro central */}
        <div className="mesa-felt" />

        {/* Flourish nas jogadas especiais */}
        <AnimatePresence>
          {flourish && (
            <motion.div
              key={flourish.key}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.55, 0], scale: [0.4, 1.7, 2.1] }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
            >
              <div
                className="h-44 w-44 rounded-full sm:h-72 sm:w-72"
                style={{
                  background: `radial-gradient(circle, ${COR[flourish.cor]?.hex || 'white'} 0%, transparent 70%)`,
                  filter: 'blur(6px)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notificação */}
        <AnimatePresence>
          {notif && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mesa-notif fixed top-4 left-1/2 -translate-x-1/2 z-50"
            >
              {notif}
            </motion.div>
          )}
        </AnimatePresence>

        {/* UNO! */}
        <AnimatePresence>
          {unoAnim && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -15 }}
              animate={{ scale: [0, 1.35, 1], opacity: 1, rotate: [-15, 6, 0] }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div
                className="mesa-display text-[7rem] sm:text-[11rem]"
                style={{
                  color: 'oklch(0.94 0.16 85)',
                  textShadow: '0 0 60px oklch(0.9 0.16 85 / 0.9), 0 4px 20px rgba(0,0,0,0.6)',
                }}
              >
                UNO!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal escolher cor */}
        <AnimatePresence>
          {modal === 'escolherCor' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mesa-modal-overlay">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mesa-modal text-center">
                <p className="mesa-display text-3xl mb-1">Escolha a cor</p>
                <p className="text-xs text-zinc-400 mb-6">Qual cor ativa agora?</p>
                <div className="grid grid-cols-2 gap-3">
                  {CORES_UNO.map((cor) => (
                    <button
                      key={cor}
                      onClick={() => enviarJogada(cor)}
                      className="mesa-card mesa-card-sheen aspect-[3/4] flex items-center justify-center text-white font-black text-lg tracking-wider"
                      style={{ '--card-from': COR[cor].from, '--card-to': COR[cor].to }}
                    >
                      <span className="mesa-card-oval" />
                      <span className="relative z-10" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.55)' }}>
                        {COR_LABEL[cor]}
                      </span>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mesa-modal-overlay">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mesa-modal text-center">
                <p className="mesa-display text-2xl mb-1">Carta Zero</p>
                <p className="text-sm text-zinc-400 mb-6">Escolha uma acao:</p>
                {!alvoZero ? (
                  <div className="flex gap-3">
                    <button onClick={() => setAlvoZero('ver')} className="mesa-btn flex-1 py-4"
                      style={{ background: 'linear-gradient(180deg, oklch(0.6 0.22 255), oklch(0.42 0.19 255))', color: 'white' }}>
                      Ver cartas
                    </button>
                    <button onClick={() => setAlvoZero('trocar')} className="mesa-btn mesa-btn-primary flex-1 py-4">
                      Trocar mao
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-zinc-400 mb-3">
                      {alvoZero === 'ver' ? 'Ver cartas de quem?' : 'Trocar mao com quem?'}
                    </p>
                    <div className="space-y-2">
                      {estado.jogadores.filter((id) => id !== user.id).map((id) => {
                        const p = pById(id);
                        return (
                          <button
                            key={id}
                            onClick={() => confirmarAcaoZero(alvoZero, id)}
                            className="mesa-surface-flat w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition"
                          >
                            {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                            <span className="font-semibold" translate="no">{p?.name}</span>
                            <ChevronRight className="h-4 w-4 text-zinc-500 ml-auto" />
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setAlvoZero(null)} className="mt-5 text-xs text-zinc-500 hover:text-zinc-300">
                      Voltar
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal ver cartas do zero */}
        <AnimatePresence>
          {verCartasModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mesa-modal-overlay">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mesa-modal text-center" style={{ maxWidth: 420 }}>
                <p className="mesa-display text-2xl mb-1">
                  Cartas de <span translate="no">{verCartasModal.nome}</span>
                </p>
                <p className="text-xs text-zinc-400 mb-5">So voce pode ver isso</p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {verCartasModal.cartas.map((carta) => {
                    const corObj = carta.cor ? COR[carta.cor] : null;
                    const gradFrom = corObj ? corObj.from : 'oklch(0.32 0.01 260)';
                    const gradTo = corObj ? corObj.to : 'oklch(0.14 0.005 260)';
                    const label = getLabelCarta(carta);
                    const icon = getIconCarta(carta);
                    return (
                      <div
                        key={carta.id}
                        className="mesa-card mesa-card-sheen relative w-11 h-16 flex items-center justify-center"
                        style={{ '--card-from': gradFrom, '--card-to': gradTo }}
                      >
                        <span className="mesa-card-oval" />
                        {icon ? (
                          <span className="text-white block w-6 h-6 relative z-10">{icon}</span>
                        ) : (
                          <span className="text-white font-black text-lg relative z-10">{label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setVerCartasModal(null)} className="mesa-btn mesa-btn-primary w-full py-3">
                  Fechar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão chat flutuante */}
        <div className="fixed bottom-40 right-3 z-30 sm:bottom-44 sm:right-4">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setChatAberto((v) => !v)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-zinc-200 transition"
            style={{
              background: 'linear-gradient(160deg, oklch(0.16 0.008 260 / 0.9), oklch(0.09 0.005 260 / 0.95))',
              border: '1px solid oklch(1 0 0 / 0.08)',
              boxShadow: '0 10px 24px -10px oklch(0 0 0 / 0.7)',
            }}
          >
            {chatAberto ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Mensagens recentes */}
        <div className="fixed bottom-52 left-2 right-16 z-20 pointer-events-none sm:left-4 sm:right-auto sm:w-64">
          <AnimatePresence>
            {mensagens.slice(-3).map((m) => (
              <motion.div
                key={m.ts}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mesa-surface-flat mb-1 px-3 py-2"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <span className="text-[10px] font-bold text-zinc-400" translate="no">{m.nome}: </span>
                <span className="text-xs text-white">{m.texto}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Painel de frases */}
        <AnimatePresence>
          {chatAberto && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mesa-surface fixed bottom-52 right-3 z-30 w-64 p-3 sm:right-4"
            >
              <p className="mesa-eyebrow mb-2 px-1">Chat ao vivo</p>
              <div className="flex gap-1.5 mb-3">
                <input
                  type="text"
                  value={textoChat}
                  onChange={(e) => setTextoChat(e.target.value.slice(0, 100))}
                  onKeyDown={(e) => e.key === 'Enter' && enviarTexto()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[oklch(0.9_0.16_85)] transition [color-scheme:dark]"
                />
                <button onClick={enviarTexto} disabled={!textoChat.trim()} className="mesa-btn mesa-btn-primary mesa-btn-sm">
                  Enviar
                </button>
              </div>
              <p className="mesa-eyebrow mb-2 px-1">Frases rapidas</p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {FRASES.map((frase) => (
                  <button
                    key={frase}
                    onClick={() => enviarFrase(frase)}
                    className="mesa-surface-flat w-full text-left text-xs text-zinc-200 px-3 py-2 hover:bg-white/[0.04] transition"
                  >
                    {frase}
                  </button>
                ))}
              </div>
              <button onClick={() => setChatAberto(false)} className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-300 transition">
                Fechar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD: código + sair */}
        <div className="relative z-20 flex items-center justify-between px-3 pt-3 sm:px-5 sm:pt-4">
          <button onClick={copiarCodigo} className="mesa-hud-chip group">
            <span className="mesa-eyebrow" style={{ fontSize: '0.6rem' }}>Sala</span>
            <span className="mesa-hud-code">{codigo}</span>
            {copiado
              ? <Check className="h-3.5 w-3.5 text-[oklch(0.72_0.19_152)]" />
              : <Copy className="h-3.5 w-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition" />}
          </button>

          {estado.corAtual && (
            <div className="mesa-color-chip">
              <span className="mesa-color-chip-dot" style={{ color: corAtualObj?.hex, background: corAtualObj?.hex }} />
              {COR_LABEL[estado.corAtual]}
            </div>
          )}

          <button onClick={() => navigate('/')} className="mesa-hud-chip">
            <LogOut className="h-3.5 w-3.5" />
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>Sair</span>
          </button>
        </div>

        {/* Painéis dos adversários */}
        <div className="relative z-10 px-3 sm:px-5 mt-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {estado.jogadores.filter((id) => id !== user.id).map((id) => {
              const p = pById(id);
              const mao = estado.maos[id] || [];
              const ehVez = estado.turnoAtual === id;
              const temUno = estado.unoDeclarado?.[id];
              const corHex = p ? COR[p.color]?.hex : undefined;
              return (
                <motion.div
                  key={id}
                  animate={ehVez ? { y: [-2, -4, -2] } : { y: 0 }}
                  transition={{ repeat: ehVez ? Infinity : 0, duration: 2.4, ease: 'easeInOut' }}
                  className={`mesa-player ${ehVez ? 'is-turn' : ''}`}
                  style={ehVez ? { '--turn-color': corHex } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    {p && <UnoChip color={p.color} label={p.name[0]} sm />}
                    <div className="min-w-0 flex-1">
                      <p className="mesa-player-name truncate" translate="no">{p?.name}</p>
                      {ehVez
                        ? <p className="mesa-player-meta" style={{ color: 'oklch(0.9 0.16 85)', letterSpacing: '0.18em' }}>Jogando</p>
                        : <p className="mesa-player-meta">Aguardando</p>}
                    </div>
                    {temUno && <span className="mesa-uno-badge">UNO</span>}
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <MaoMini count={mao.length} />
                    <span className="mesa-player-count">{mao.length}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mesa central */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6">

          {/* Indicador de turno */}
          <div className="text-center">
            {ehMinhVez ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mesa-turn-pill"
              >
                <span className="mesa-turn-dot" />
                Sua vez
              </motion.div>
            ) : (
              <p className="mesa-turn-text">
                Vez de <strong translate="no">{pById(estado.turnoAtual)?.name}</strong>
              </p>
            )}
            {estado.acumulado > 0 && (
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mesa-stack-pill mt-3"
              >
                Acumulado +{estado.acumulado}
              </motion.p>
            )}
          </div>

          {/* Baralho + Pilha */}
          <div className="relative flex items-center gap-8 sm:gap-14">

            {/* Baralho - pilha física */}
            <div className="flex flex-col items-center gap-3">
              <motion.button
                whileHover={ehMinhVez ? { y: -4 } : {}}
                whileTap={ehMinhVez ? { scale: 0.95, rotate: -3 } : {}}
                onClick={ehMinhVez ? comprar : undefined}
                disabled={!ehMinhVez}
                className={`relative ${ehMinhVez ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                style={{ background: 'transparent', border: 0, padding: 0 }}
              >
                <div className="mesa-deck">
                  <div className="mesa-card-back mesa-card-back-lg" />
                  <div className="mesa-card-back mesa-card-back-lg" />
                  <div className="mesa-card-back mesa-card-back-lg" />
                  <div className="mesa-card-back mesa-card-back-lg" />
                  <div className="mesa-card-back mesa-card-back-lg" />
                  {estado.acumulado > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="mesa-deck-badge">
                      +{estado.acumulado}
                    </motion.span>
                  )}
                </div>
                <div className="mesa-deck-shadow" />
              </motion.button>
              <p className="mesa-eyebrow" style={{ fontSize: '0.58rem' }}>Comprar</p>
            </div>

            {/* Descarte - topo */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  <CartaTopo key={topo?.id} carta={topo} corAtual={estado.corAtual} />
                </AnimatePresence>
                <div className="mesa-discard-shadow" />
              </div>
              <p className="mesa-eyebrow" style={{ fontSize: '0.58rem' }}>Descarte</p>
            </div>
          </div>

          {/* Ação carta 0 */}
          {ehMinhVez && estado.fase === 'acaoZero' && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setModal('acaoZero')}
              className="mesa-btn mesa-btn-gold px-6 py-3 uppercase tracking-wider"
            >
              Escolher acao da carta 0
            </motion.button>
          )}
        </div>

        {/* Minha mão - leque no piso */}
        <div className="relative z-10 px-3 pb-4 sm:px-5 sm:pb-5">
          <div className="mesa-hand-floor mesa-surface p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {user && pById(user.id) && <UnoChip color={pById(user.id).color} label={user.name[0]} sm />}
                <div>
                  <p className="mesa-player-name" translate="no">{user?.name}</p>
                  <p className="mesa-player-meta">Sua mao · {cartasCount} carta{cartasCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cartasCount === 1 && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={declararUno}
                    className="mesa-btn mesa-btn-gold uppercase"
                    style={{ letterSpacing: '0.2em', padding: '8px 16px' }}
                  >
                    UNO!
                  </motion.button>
                )}
                {cartasSelecionadas.length > 0 && ehMinhVez && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={jogar}
                    className="mesa-btn mesa-btn-primary uppercase"
                    style={{ letterSpacing: '0.1em' }}
                  >
                    Jogar {cartasSelecionadas.length > 1 ? `(${cartasSelecionadas.length})` : ''}
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </div>

            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-3 pt-4 justify-center flex-wrap min-h-[92px]">
              <AnimatePresence>
                {minhaMao.map((carta) => (
                  <CartaMao
                    key={carta.id}
                    carta={carta}
                    selecionada={cartasSelecionadas.some((c) => c.id === carta.id)}
                    onClick={() => ehMinhVez && toggleCarta(carta)}
                    disabled={!ehMinhVez}
                  />
                ))}
              </AnimatePresence>
            </div>

            {erro && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-xs text-[oklch(0.85_0.18_27)] text-center bg-[oklch(0.35_0.15_27_/_0.2)] px-3 py-2 rounded-xl border border-[oklch(0.62_0.22_27_/_0.3)]"
              >
                {erro}
              </motion.p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
