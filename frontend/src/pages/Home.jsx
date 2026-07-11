// ============================================================
// Home.jsx — REDESIGN "HUB CENTRAL" (pós-login)
//
// IMPORTANTE: 100% da lógica original foi preservada:
//  - Pusher (lobby-global / sala-criada), fetchMatches,
//    createMatch, deleteMatch
//  - Todos os useMemo (stats, rivalries, ranking, historicoSemana)
//  - Registrar partida (togglePlayed / toggleWinner / submit)
//  - Estados, fluxos e navegação idênticos
//
// Apenas a camada visual foi refeita para alinhar com a
// linguagem do Lobby, Sala de Espera, Mesa e Perfil.
// ============================================================

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Crown,
  Trophy,
  Swords,
  Flame,
  History,
  Trash2,
  User,
  LogOut,
  X,
  Gamepad2,
  Play,
  Plus,
  KeyRound,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Medal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';

import { PLAYERS, COLOR_STYLES, startOfWeek } from '../data/players';
import { getChannel } from '../api/pusher';
import { fetchMatches, createMatch, deleteMatch } from '../api/matches';
import UnoChip from '../components/UnoChip';
import FloatingCards from '../components/FloatingCards';
import Podium from '../components/Podium';

// Conta de 0 ate o valor final quando entra na tela - efeito de placar ligando
function CountUp({ value, duration = 1100 }) {
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const target = Number(value) || 0;
    startedRef.current = true;
    if (target === 0) { setDisplay(0); return; }
    let startTs = null;
    let raf;
    function step(ts) {
      if (startTs === null) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="font-score">{display}</span>;
}

const DEALT_CARD_COLORS = {
  vermelho: 'oklch(0.63 0.24 27)',
  azul: 'oklch(0.6 0.22 255)',
  verde: 'oklch(0.68 0.2 152)',
  amarelo: 'oklch(0.85 0.18 90)',
};

// Carta decorativa que "e distribuida" na cena do heroi - o momento de assinatura visual
function DealtCard({ color, value, x, y, rotate, delay, size = 'normal' }) {
  const dims = size === 'small' ? 'h-16 w-11 sm:h-20 sm:w-14' : 'h-20 w-14 sm:h-28 sm:w-20';
  const fontSize = size === 'small' ? 'text-lg sm:text-xl' : 'text-2xl sm:text-4xl';
  return (
    <motion.div
      initial={{ opacity: 0, x: x * 2.6, y: -90, rotate: rotate * 4, scale: 0.55 }}
      animate={{ opacity: 0.94, x, y, rotate, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 130, damping: 15 }}
      className="pointer-events-none absolute left-1/2 top-0"
    >
      <div className="dealt-card-breathe">
        <div
          className={`relative ${dims} rounded-xl border-2 border-white/25 shadow-2xl`}
          style={{ background: DEALT_CARD_COLORS[color] }}
        >
          <div
            className="absolute inset-[14%] opacity-45"
            style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '50% / 60%', transform: 'rotate(-20deg)' }}
          />
          <span
            className={`font-display relative flex h-full items-center justify-center text-white ${fontSize}`}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}
          >
            {value}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export default function Home() {
  const isDesktop = useIsDesktop();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlayed, setSelectedPlayed] = useState([]);
  const [selectedWinners, setSelectedWinners] = useState([]);
  const [note, setNote] = useState('');
  const [tab, setTab] = useState('geral');
  const [notificacaoSala, setNotificacaoSala] = useState(null);

  useEffect(() => {
    const channel = getChannel('lobby-global');
    channel.bind('sala-criada', ({ codigo, criadorNome, criadorId }) => {
      // Nao mostra pra quem criou a sala
      if (user && user.id === criadorId) return;
      setNotificacaoSala({ codigo, criadorNome });
    });
    return () => { channel.unbind_all(); };
  }, [user]);

  useEffect(() => {
    let mounted = true;
    fetchMatches()
      .then((data) => { if (mounted) setMatches(data); })
      .catch((e) => { if (mounted) setError(e.message || 'Erro ao carregar partidas'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const wins = {};
    const weekWins = {};
    const weekStart = startOfWeek();
    PLAYERS.forEach((p) => {
      wins[p.id] = 0;
      weekWins[p.id] = 0;
    });
    matches.forEach((m) => {
      m.winners.forEach((w) => {
        wins[w] = (wins[w] ?? 0) + 1;
        if (m.ts >= weekStart) weekWins[w] = (weekWins[w] ?? 0) + 1;
      });
    });
    const streaks = {};
    PLAYERS.forEach((p) => (streaks[p.id] = 0));
    const sorted = [...matches].sort((a, b) => b.ts - a.ts);
    PLAYERS.forEach((p) => {
      let s = 0;
      for (const m of sorted) {
        if (!m.played.includes(p.id)) continue;
        if (m.winners.includes(p.id)) s++;
        else break;
      }
      streaks[p.id] = s;
    });
    const lead = PLAYERS.reduce((a, b) => (wins[a.id] >= wins[b.id] ? a : b));
    const weekLead = PLAYERS.reduce((a, b) => (weekWins[a.id] >= weekWins[b.id] ? a : b));
    const topStreak = PLAYERS.reduce((a, b) => (streaks[a.id] >= streaks[b.id] ? a : b));
    return { wins, weekWins, streaks, lead, weekLead, topStreak };
  }, [matches]);

  const rivalries = useMemo(() => {
    const pairs = {};
    matches.forEach((m) => {
      for (let i = 0; i < m.played.length; i++) {
        for (let j = i + 1; j < m.played.length; j++) {
          const [a, b] = [m.played[i], m.played[j]].sort();
          const key = `${a}|${b}`;
          if (!pairs[key]) pairs[key] = { a, b, aWins: 0, bWins: 0, total: 0 };
          pairs[key].total++;
          if (m.winners.includes(a)) pairs[key].aWins++;
          if (m.winners.includes(b)) pairs[key].bWins++;
        }
      }
    });
    return Object.values(pairs)
      .filter((p) => p.total >= 2)
      .sort((x, y) => y.total - x.total)
      .slice(0, 3);
  }, [matches]);

  const ranking = useMemo(() => {
    return [...PLAYERS].sort((a, b) => stats.wins[b.id] - stats.wins[a.id]);
  }, [stats]);

  const historicoSemana = useMemo(() => {
    const weekStart = startOfWeek();
    return matches.filter((m) => m.ts >= weekStart);
  }, [matches]);

  // ===== PERFIL RÁPIDO — derivado apenas dos dados já carregados (visual) =====
  const myStats = useMemo(() => {
    if (!user) return null;
    const id = user.id;
    const played = matches.filter((m) => m.played.includes(id));
    const won = matches.filter((m) => m.winners.includes(id));
    const winRate = played.length > 0 ? Math.round((won.length / played.length) * 100) : 0;
    const rankPos = ranking.findIndex((p) => p.id === id);
    const rankLabel =
      won.length >= 30 ? 'Lenda da Mesa' :
      won.length >= 15 ? 'Mestre do Baralho' :
      won.length >= 5  ? 'Veterano' :
      won.length >= 1  ? 'Desafiante' :
      'Novato';
    return {
      partidas: played.length,
      vitorias: won.length,
      winRate,
      sequencia: stats.streaks[id] ?? 0,
      rankPos: rankPos >= 0 ? rankPos + 1 : null,
      rankLabel,
    };
  }, [matches, user, ranking, stats]);

  // Últimas partidas para o card de atividade recente
  const atividadeRecente = useMemo(
    () => [...matches].sort((a, b) => b.ts - a.ts).slice(0, 3),
    [matches]
  );

  const togglePlayed = (id) => {
    setSelectedPlayed((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setSelectedWinners((w) => w.filter((x) => next.includes(x)));
      return next;
    });
  };
  const toggleWinner = (id) => {
    if (!selectedPlayed.includes(id)) return;
    setSelectedWinners((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (selectedPlayed.length < 2 || selectedWinners.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const newMatch = await createMatch({
        played: selectedPlayed,
        winners: selectedWinners,
        note: note.trim() || null,
        ts: Date.now(),
      });
      setMatches((prev) => [newMatch, ...prev]);
      setSelectedPlayed([]);
      setSelectedWinners([]);
      setNote('');
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Erro ao salvar partida');
    } finally {
      setSubmitting(false);
    }
  };

  const removeMatch = async (id) => {
    const prev = matches;
    setMatches((p) => p.filter((m) => m.id !== id));
    try {
      await deleteMatch(id);
    } catch (e) {
      setMatches(prev);
      setError('Falha ao remover partida');
    }
  };

  const pById = (id) => PLAYERS.find((p) => p.id === id);
  const chartData = ranking.map((p) => ({
    name: p.name,
    'Vitórias': stats.wins[p.id],
    'Semana': stats.weekWins[p.id],
  }));

  const scrollTo = (elId) => {
    document.getElementById(elId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const playerData = user ? PLAYERS.find((p) => p.id === user.id) : null;

  return (
    <div className="uno-bg relative">
      <FloatingCards />

      {/* Popup flutuante de notificacao de sala */}
      <AnimatePresence>
        {notificacaoSala && (
          <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <motion.div
              initial={{ y: -40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="w-full max-w-md sm:max-w-xl"
            >
              <div className="relative flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-[oklch(0.63_0.24_27)] to-[oklch(0.5_0.2_27)] px-5 py-4 shadow-[0_20px_60px_-15px_oklch(0.63_0.24_27/0.6)] ring-1 ring-white/20 sm:flex-row sm:items-center sm:gap-5 sm:px-7 sm:py-5">
                <button
                  onClick={() => setNotificacaoSala(null)}
                  className="absolute right-3 top-3 rounded-xl p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white sm:hidden"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:h-12 sm:w-12">
                    <Gamepad2 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white sm:text-base" translate="no">
                      {notificacaoSala.criadorNome}
                    </p>
                    <p className="text-xs text-white/80 sm:text-sm">
                      criou uma sala - bora jogar!
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2 sm:ml-auto">
                  <button
                    onClick={() => navigate(`/jogo/${notificacaoSala.codigo}`)}
                    className="flex-1 rounded-2xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[oklch(0.63_0.24_27)] shadow-lg transition hover:bg-white/90 sm:flex-none sm:text-sm"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => setNotificacaoSala(null)}
                    className="hidden rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white sm:block"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto max-w-6xl px-3 pb-16 pt-5 sm:px-4 sm:pb-24 sm:pt-8">

        {/* ===== TOPBAR ===== */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between gap-2 sm:mb-8"
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.86_0.17_85)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400 sm:text-xs">
                Hub Central
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/perfil')}
                className="group flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
              >
                <User className="h-3.5 w-3.5" />
                <span translate="no">{user.name}</span>
              </button>
              <button
                onClick={() => { logout(); navigate('/entrar'); }}
                className="group flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-[oklch(0.63_0.24_27)]/20 hover:text-[oklch(0.82_0.18_27)] hover:ring-[oklch(0.63_0.24_27)]/40"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          </motion.div>
        )}

        {/* ===== HERO / LAUNCHER ===== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative mb-6 overflow-hidden rounded-3xl uno-card-surface px-5 py-9 sm:mb-8 sm:px-10 sm:py-14"
        >
          <div className="hero-spotlight" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[oklch(0.63_0.24_27)]/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-[oklch(0.6_0.22_255)]/40 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.68_0.2_152)]/15 blur-3xl" />

          {/* Cartas distribuidas - assinatura visual do heroi */}
          <DealtCard color="vermelho" value="7" x={135} y={8} rotate={16} delay={0.15} />
          <DealtCard color="azul" value="R" x={-155} y={54} rotate={-20} delay={0.3} size="small" />
          <DealtCard color="amarelo" value="+2" x={165} y={96} rotate={-14} delay={0.45} size="small" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-[oklch(0.86_0.17_85)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400 sm:text-xs sm:tracking-[0.4em]">
                Bem-vindo de volta{user ? `, ${user.name}` : ''}
              </p>
            </div>
            <motion.h1
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 110 }}
              className="mt-2 font-display text-[2.5rem] leading-[0.95] sm:mt-3 sm:text-7xl lg:text-8xl"
              style={{ filter: 'drop-shadow(0 10px 28px oklch(0.63 0.24 27 / 0.3))' }}
            >
              <span className="foil-text">
                Inimigos do Uno
              </span>
            </motion.h1>
            <p className="mt-2 text-xs text-zinc-400 sm:mt-3 sm:text-sm">O Grupo dos Impossíveis</p>

            {/* CTA principal — o coração do launcher */}
            <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-9">
              <motion.button
                whileHover={isDesktop ? { y: -3, scale: 1.02 } : {}}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/jogo')}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[oklch(0.63_0.24_27)] to-[oklch(0.56_0.22_27)] px-7 py-4 text-sm font-black uppercase tracking-widest text-white shadow-[0_18px_45px_-12px_oklch(0.63_0.24_27/0.75)] ring-1 ring-white/20 transition sm:px-9 sm:py-5 sm:text-base"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 sm:h-9 sm:w-9">
                  <Play className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
                </span>
                Jogar Agora
              </motion.button>

              <motion.button
                whileHover={isDesktop ? { y: -2 } : {}}
                whileTap={{ scale: 0.97 }}
                onClick={() => scrollTo('registrar')}
                className="flex items-center gap-2 rounded-2xl bg-white/[0.05] px-5 py-4 text-xs font-bold uppercase tracking-widest text-zinc-300 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/10 hover:text-white sm:px-6 sm:py-5 sm:text-sm"
              >
                <Trophy className="h-4 w-4 text-[oklch(0.86_0.17_85)]" />
                Registrar Vitória
              </motion.button>
            </div>

            {/* Estatísticas rápidas do grupo */}
            <div className="mt-7 grid grid-cols-2 gap-2 sm:mt-9 sm:gap-3 sm:grid-cols-4">
              <StatTile delay={0.1} label="Partidas" value={<CountUp value={matches.length} />} accent="amarelo" />
              <StatTile
                delay={0.2}
                label="Líder Geral"
                value={matches.length ? stats.lead.name : '?'}
                icon={<Trophy className="h-3.5 w-3.5" />}
                accent="amarelo"
              />
              <StatTile
                delay={0.3}
                label="Rei da Semana"
                value={
                  Object.values(stats.weekWins).some((v) => v > 0)
                    ? stats.weekLead.name
                    : '?'
                }
                icon={<Crown className="h-3.5 w-3.5" />}
                accent="amarelo"
              />
              <StatTile
                delay={0.4}
                label="Sequência"
                value={
                  stats.streaks[stats.topStreak.id] > 0
                    ? `${stats.topStreak.name}  -  ${stats.streaks[stats.topStreak.id]}`
                    : '?'
                }
                icon={<Flame className="h-3.5 w-3.5" />}
                accent="vermelho"
              />
            </div>
          </div>
        </motion.header>

        {/* ===== AÇÕES RÁPIDAS ===== */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-3 sm:gap-4">
          <ActionCard
            delay={0.15}
            isDesktop={isDesktop}
            icon={<Plus className="h-5 w-5" strokeWidth={2.5} />}
            tint="oklch(0.63 0.24 27)"
            kicker="Anfitrião"
            title="Criar Sala"
            desc="Abra uma mesa e convide o grupo com um código."
            onClick={() => navigate('/jogo')}
          />
          <ActionCard
            delay={0.25}
            isDesktop={isDesktop}
            icon={<KeyRound className="h-5 w-5" strokeWidth={2.5} />}
            tint="oklch(0.6 0.22 255)"
            kicker="Convidado"
            title="Entrar em Sala"
            desc="Recebeu um código? Entre direto na mesa."
            onClick={() => navigate('/jogo')}
          />
          <ActionCard
            delay={0.35}
            isDesktop={isDesktop}
            icon={<User className="h-5 w-5" strokeWidth={2.5} />}
            tint="oklch(0.86 0.17 85)"
            kicker="Sua conta"
            title="Meu Perfil"
            desc="Estatísticas completas, duelos e histórico."
            onClick={() => navigate('/perfil')}
          />
        </div>

        {/* ===== PAINEL DO HUB: PERFIL RÁPIDO / RANKING / ATIVIDADE ===== */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">

          {/* --- Perfil rápido --- */}
          {user && myStats && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-3xl uno-card-surface p-5 sm:p-6"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-25"
                style={{
                  background: `radial-gradient(ellipse at center top, ${COLOR_STYLES[user.color]?.hex ?? 'oklch(0.86 0.17 85)'} 0%, transparent 65%)`,
                }}
              />
              <PanelTitle icon={<User className="h-3.5 w-3.5" />} title="Perfil Rápido" />
              <div className="relative mt-4 flex items-center gap-4">
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -inset-2 rounded-full opacity-50 blur-xl"
                    style={{ background: COLOR_STYLES[user.color]?.hex }}
                  />
                  <div className="relative scale-110">
                    {playerData ? (
                      <UnoChip color={playerData.color} label={user.name[0]} />
                    ) : (
                      <UnoChip color="red" label={user.name[0]} />
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                    <Sparkles className="h-3 w-3 text-[oklch(0.86_0.17_85)]" />
                    {myStats.rankLabel}
                  </p>
                  <p className="truncate font-display text-3xl leading-none sm:text-4xl" translate="no">
                    {user.name}
                  </p>
                  {myStats.rankPos && (
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
                      #{myStats.rankPos} no ranking
                    </p>
                  )}
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-3 gap-2">
                <MiniStat label="Vitórias" value={<CountUp value={myStats.vitorias} />} tint="oklch(0.86 0.17 85)" />
                <MiniStat label="Partidas" value={<CountUp value={myStats.partidas} />} tint="oklch(0.6 0.22 255)" />
                <MiniStat label="Taxa" value={<span className="font-score">{myStats.winRate}%</span>} tint="oklch(0.68 0.2 152)" />
              </div>

              {myStats.sequencia > 0 && (
                <div className="relative mt-3 flex items-center gap-2 rounded-xl bg-[oklch(0.63_0.24_27)]/15 px-3 py-2 ring-1 ring-[oklch(0.63_0.24_27)]/30">
                  <Flame className="h-3.5 w-3.5 text-[oklch(0.78_0.2_27)]" />
                  <p className="text-xs font-bold text-[oklch(0.85_0.18_27)]">
                    Em sequência de {myStats.sequencia} vitória{myStats.sequencia > 1 ? 's' : ''}!
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate('/perfil')}
                className="group relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
              >
                Ver perfil completo
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.section>
          )}

          {/* --- Ranking rápido --- */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="relative overflow-hidden rounded-3xl uno-card-surface p-5 sm:p-6"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[oklch(0.86_0.17_85)]/15 blur-3xl" />
            <PanelTitle icon={<Medal className="h-3.5 w-3.5" />} title="Ranking" hint="Top 3" />
            <div className="relative mt-4 space-y-2.5">
              {ranking.slice(0, 3).map((p, i) => {
                const isTop = i === 0 && stats.wins[p.id] > 0;
                const isYou = user && p.id === user.id;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    whileHover={isDesktop ? { x: 3 } : {}}
                    className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${
                      isTop
                        ? 'bg-[oklch(0.86_0.17_85)]/10 ring-1 ring-[oklch(0.86_0.17_85)]/40'
                        : 'bg-[oklch(0.22_0.035_265)]/60 ring-1 ring-white/5 hover:ring-white/15'
                    }`}
                  >
                    <span className={`w-6 text-center font-display text-lg ${isTop ? 'text-[oklch(0.86_0.17_85)]' : 'text-zinc-500'}`}>
                      {i + 1}º
                    </span>
                    <UnoChip color={p.color} label={p.name[0]} sm />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" translate="no">
                        {p.name}
                        {isYou && <span className="ml-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Você</span>}
                        {isTop && <Crown className="ml-1.5 inline h-3.5 w-3.5 text-[oklch(0.86_0.17_85)]" />}
                      </p>
                    </div>
                    <p className="font-display text-2xl leading-none">
                      <span className="font-score">{stats.wins[p.id]}</span>
                      <span className="ml-1 text-xs text-zinc-500">V</span>
                    </p>
                  </motion.div>
                );
              })}
            </div>
            <button
              onClick={() => scrollTo('placar')}
              className="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
            >
              Ver placar completo
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.section>

          {/* --- Atividade recente --- */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="relative overflow-hidden rounded-3xl uno-card-surface p-5 sm:p-6"
          >
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[oklch(0.6_0.22_255)]/15 blur-3xl" />
            <PanelTitle icon={<TrendingUp className="h-3.5 w-3.5" />} title="Atividade Recente" />
            <div className="relative mt-4 space-y-2.5">
              {loading ? (
                <div className="flex flex-col items-center py-8 text-zinc-400">
                  <History className="mb-2 h-8 w-8 animate-pulse opacity-60" />
                  <p className="text-xs uppercase tracking-widest">Carregando...</p>
                </div>
              ) : atividadeRecente.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center text-zinc-400">
                  <Target className="mb-2 h-8 w-8 opacity-60" />
                  <p className="text-sm font-medium">Nenhuma partida ainda</p>
                  <p className="text-xs text-zinc-500">Bora inaugurar a mesa!</p>
                </div>
              ) : (
                atividadeRecente.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="rounded-2xl bg-[oklch(0.22_0.035_265)]/60 p-3 ring-1 ring-white/5 transition hover:ring-white/15"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      {m.winners.map((wId) => {
                        const w = pById(wId);
                        if (!w) return null;
                        return (
                          <span
                            key={wId}
                            className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.86_0.17_85)]/15 px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.88_0.16_85)]"
                            translate="no"
                          >
                            <Crown className="h-3 w-3" />
                            {w.name}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {m.played.map((id) => {
                          const p = pById(id);
                          if (!p) return null;
                          return <span key={id} className={`h-2 w-2 rounded-full ${COLOR_STYLES[p.color].dot}`} title={p.name} />;
                        })}
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {new Date(m.ts).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            {atividadeRecente.length > 0 && (
              <button
                onClick={() => scrollTo('historico')}
                className="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
              >
                Ver histórico
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </motion.section>
        </div>

        {/* ===== PLACAR ===== */}
        <div id="placar" className="scroll-mt-6">
          <Section title="Placar" eyebrow="Classificação">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-5 grid w-full grid-cols-3 bg-[oklch(0.22_0.035_265)]/70 p-1">
                <TabsTrigger value="geral" className="text-xs sm:text-sm">Geral</TabsTrigger>
                <TabsTrigger value="semana" className="text-xs sm:text-sm">Semana</TabsTrigger>
                <TabsTrigger value="grafico" className="text-xs sm:text-sm">Gráfico</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-3">
                {matches.length > 0 && <Podium ranking={ranking} wins={stats.wins} />}
                {ranking.map((p, i) => (
                  <PlayerRow key={p.id} player={p} wins={stats.wins[p.id]} rank={i} index={i} isDesktop={isDesktop} />
                ))}
              </TabsContent>

              <TabsContent value="semana" className="space-y-3">
                {[...PLAYERS]
                  .sort((a, b) => stats.weekWins[b.id] - stats.weekWins[a.id])
                  .map((p, i) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      wins={stats.weekWins[p.id]}
                      rank={i}
                      index={i}
                      label="Semana atual"
                      isDesktop={isDesktop}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="grafico">
                <div className="rounded-2xl uno-card-surface p-4 sm:p-6">
                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                        <YAxis stroke="#a1a1aa" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'oklch(0.22 0.035 265)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            color: 'white',
                          }}
                        />
                        <Bar dataKey="Vitórias" fill="oklch(0.63 0.24 27)" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Semana" fill="oklch(0.6 0.22 255)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Section>
        </div>

        {/* ===== RIVALIDADES ===== */}
        <Section title="Rivalidades" eyebrow="Duelos" icon={<Swords className="h-5 w-5 sm:h-6 sm:w-6" />}>
          <div className="rounded-2xl uno-card-surface p-4 sm:p-6">
            {rivalries.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-zinc-400">
                <Swords className="mb-3 h-10 w-10 opacity-60" />
                <p className="font-medium">Sem dados suficientes ainda.</p>
                <p className="text-sm">Joguem mais para as rivalidades aparecerem!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rivalries.map((r, idx) => {
                  const a = pById(r.a);
                  const b = pById(r.b);
                  const aLead = r.aWins >= r.bWins;
                  return (
                    <motion.div
                      key={`${r.a}-${r.b}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-[oklch(0.22_0.035_265)]/60 p-3 ring-1 ring-white/5 sm:gap-3 sm:p-4"
                    >
                      <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
                        <div className="min-w-0 text-right">
                          <p className="truncate text-sm font-semibold sm:text-base" translate="no">{a.name}</p>
                          <p
                            className={`text-xl font-bold sm:text-2xl ${
                              aLead ? 'text-[oklch(0.86_0.17_85)]' : 'text-zinc-500'
                            }`}
                          >
                            {r.aWins}
                          </p>
                        </div>
                        <UnoChip color={a.color} label={a.name[0]} sm />
                      </div>
                      <div className="text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400 sm:text-xs">
                        <Swords className="mx-auto h-4 w-4 sm:h-5 sm:w-5" />
                        {r.total} jogos
                      </div>
                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <UnoChip color={b.color} label={b.name[0]} sm />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold sm:text-base" translate="no">{b.name}</p>
                          <p
                            className={`text-xl font-bold sm:text-2xl ${
                              !aLead ? 'text-[oklch(0.86_0.17_85)]' : 'text-zinc-500'
                            }`}
                          >
                            {r.bWins}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

        {/* ===== REGISTRAR ===== */}
        <div id="registrar" className="scroll-mt-6">
          <Section title="Registrar" eyebrow="Nova Partida">
            <div className="rounded-2xl uno-card-surface p-4 sm:p-8">
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-zinc-400">
                  Quem jogou?
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PLAYERS.map((p) => {
                    const active = selectedPlayed.includes(p.id);
                    return (
                      <motion.button
                        key={p.id}
                        whileHover={isDesktop ? { y: -2 } : {}}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => togglePlayed(p.id)}
                        className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? `border-transparent bg-white/10 ring-2 ring-offset-2 ring-offset-[oklch(0.16_0.03_265)] ${COLOR_STYLES[p.color].ring}`
                            : 'border-white/10 bg-[oklch(0.22_0.035_265)]/60 hover:bg-[oklch(0.22_0.035_265)]'
                        }`}
                      >
                        <span className={`h-3 w-3 rounded-full ${COLOR_STYLES[p.color].dot}`} />
                        <span className="font-medium" translate="no">{p.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-zinc-400">
                  Quem ganhou?
                </label>
                {selectedPlayed.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-[oklch(0.22_0.035_265)]/40 px-4 py-3 text-sm text-zinc-400">
                    Selecione os jogadores primeiro
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayed.map((id) => {
                      const p = pById(id);
                      const active = selectedWinners.includes(id);
                      return (
                        <motion.button
                          key={id}
                          whileHover={isDesktop ? { scale: 1.04 } : {}}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleWinner(id)}
                          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            active
                              ? `${COLOR_STYLES[p.color].bg} ${
                                  p.color === 'white' ? 'text-[oklch(0.2_0.04_265)]' : 'text-white'
                                } shadow-lg`
                              : 'bg-[oklch(0.22_0.035_265)]/60 text-zinc-200 hover:bg-[oklch(0.22_0.035_265)]'
                          }`}
                        >
                          {active && <Crown className="h-3.5 w-3.5" />}
                          <span translate="no">{p.name}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-zinc-400">
                  Observação (opcional)
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Algum detalhe sobre essa partida?"
                  className="min-h-[80px] border-white/10 text-zinc-100 placeholder:text-zinc-500"
                  style={{ background: 'oklch(0.22 0.035 265 / 0.6)' }}
                />
              </div>

              <motion.div whileHover={isDesktop ? { scale: 1.005 } : {}} whileTap={{ scale: 0.99 }}>
                <Button
                  onClick={submit}
                  disabled={submitting || selectedPlayed.length < 2 || selectedWinners.length === 0}
                  className="h-12 w-full bg-[oklch(0.63_0.24_27)] hover:bg-[oklch(0.68_0.24_27)] text-base font-bold uppercase tracking-wider text-white shadow-[0_10px_30px_-10px_oklch(0.63_0.24_27/0.7)] disabled:opacity-40"
                >
                  {submitting ? 'Salvando...' : 'Registrar Vitória'}
                </Button>
              </motion.div>
              {error && (
                <p className="mt-3 rounded-md bg-[oklch(0.63_0.24_27)]/15 px-3 py-2 text-sm text-[oklch(0.85_0.18_27)]">
                  {error}
                </p>
              )}
            </div>
          </Section>
        </div>

        {/* ===== HISTÓRICO ===== */}
        <div id="historico" className="scroll-mt-6">
          <Section title="Histórico" eyebrow="Memória da Semana">
            <div className="rounded-2xl uno-card-surface p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center py-10 text-center text-zinc-400">
                  <History className="mb-3 h-10 w-10 opacity-60 animate-pulse" />
                  <p className="font-medium">Carregando histórico...</p>
                </div>
              ) : historicoSemana.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center text-zinc-400">
                  <History className="mb-3 h-10 w-10 opacity-60" />
                  <p className="font-medium">Nenhuma partida esta semana ainda!</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {historicoSemana.map((m) => (
                      <motion.li
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="group rounded-xl bg-[oklch(0.22_0.035_265)]/60 p-4 ring-1 ring-white/5 transition hover:ring-white/15"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                              {m.winners.map((wId) => {
                                const w = pById(wId);
                                return (
                                  <span
                                    key={wId}
                                    className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.86_0.17_85)]/15 px-2 py-0.5 text-xs font-semibold text-[oklch(0.88_0.16_85)]"
                                    translate="no"
                                  >
                                    <Crown className="h-3 w-3" />
                                    {w.name}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                              <span>Jogaram:</span>
                              {m.played.map((id) => {
                                const p = pById(id);
                                return (
                                  <span key={id} className="inline-flex items-center gap-1" translate="no">
                                    <span className={`h-2 w-2 rounded-full ${COLOR_STYLES[p.color].dot}`} />
                                    {p.name}
                                  </span>
                                );
                              })}
                            </div>
                            {m.note && (
                              <p className="mt-2 text-sm italic text-zinc-400">
                                "{m.note}"
                              </p>
                            )}
                            <p className="mt-2 text-[11px] uppercase tracking-wider text-zinc-500">
                              {new Date(m.ts).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <button
                            onClick={() => removeMatch(m.id)}
                            className="shrink-0 rounded-lg p-2 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-[oklch(0.63_0.24_27)]/20 hover:text-[oklch(0.78_0.2_27)]"
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </Section>
        </div>

        <footer className="mt-16 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
          <span>Inimigos do Uno</span>
          <span className="text-zinc-700">·</span>
          <span>Desenvolvido por <span className="font-semibold text-zinc-200">Peixe</span></span>
        </footer>
      </main>
    </div>
  );
}

/* ============================================================
 * COMPONENTES VISUAIS DO HUB
 * ============================================================ */

const ACCENT_MAP = {
  amarelo: { bar: 'bg-[oklch(0.86_0.17_85)]', badge: 'bg-[oklch(0.86_0.17_85)]/15 text-[oklch(0.86_0.17_85)]' },
  vermelho: { bar: 'bg-[oklch(0.63_0.24_27)]', badge: 'bg-[oklch(0.63_0.24_27)]/15 text-[oklch(0.75_0.2_27)]' },
  azul: { bar: 'bg-[oklch(0.6_0.22_255)]', badge: 'bg-[oklch(0.6_0.22_255)]/15 text-[oklch(0.68_0.2_255)]' },
  verde: { bar: 'bg-[oklch(0.68_0.2_152)]', badge: 'bg-[oklch(0.68_0.2_152)]/15 text-[oklch(0.72_0.18_152)]' },
};

function StatTile({ label, value, icon, delay = 0, accent = 'amarelo' }) {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.amarelo;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl bg-white/[0.04] p-3 pl-4 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/[0.06] sm:p-4 sm:pl-5"
    >
      <span className={`absolute left-0 top-0 h-full w-[3px] ${a.bar} opacity-70`} />
      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 sm:text-[10px]">
        {icon && (
          <span className={`flex h-4 w-4 items-center justify-center rounded-full ${a.badge}`}>
            {icon}
          </span>
        )}
        {label}
      </p>
      <p className="mt-1.5 truncate font-display text-xl leading-none sm:text-2xl" translate="no">{value}</p>
    </motion.div>
  );
}

// Card de ação rápida do hub — profundidade, glow na cor e hover elegante
function ActionCard({ icon, tint, kicker, title, desc, onClick, delay = 0, isDesktop = true }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={isDesktop ? { y: -5 } : {}}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl uno-card-surface p-5 text-left transition sm:p-6"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25"
        style={{ background: tint }}
      />
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
          style={{
            background: `linear-gradient(140deg, ${tint}, color-mix(in oklab, ${tint} 60%, black))`,
            boxShadow: `0 10px 26px -10px ${tint}`,
          }}
        >
          {icon}
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-600 transition-all duration-300 group-hover:translate-x-1 group-hover:text-zinc-300" />
      </div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">{kicker}</p>
      <h3 className="mt-1 font-display text-2xl leading-none sm:text-3xl">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 sm:text-sm">{desc}</p>
    </motion.button>
  );
}

// Título dos painéis do hub
function PanelTitle({ icon, title, hint }) {
  return (
    <div className="relative flex items-center justify-between">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-zinc-300">
          {icon}
        </span>
        {title}
      </p>
      {hint && (
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 ring-1 ring-white/10">
          {hint}
        </span>
      )}
    </div>
  );
}

// Mini-estatística do perfil rápido
function MiniStat({ label, value, tint }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[oklch(0.22_0.035_265)]/60 p-2.5 text-center ring-1 ring-white/5 transition hover:ring-white/15">
      <span className="absolute inset-x-0 top-0 h-[2px] opacity-60" style={{ background: tint }} />
      <p className="font-display text-xl leading-none sm:text-2xl">{value}</p>
      <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500 sm:text-[9px]">{label}</p>
    </div>
  );
}

function Section({ title, eyebrow, icon, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.4 }}
      className="mt-8 sm:mt-12"
    >
      <div className="mb-3 flex items-end justify-between sm:mb-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400 sm:text-[11px] sm:tracking-[0.35em]">
            <span className="h-px w-4 bg-[oklch(0.63_0.24_27)]/70 sm:w-5" />
            {eyebrow}
          </p>
          <h2 className="font-display text-2xl flex items-center gap-2 sm:text-4xl sm:gap-3">
            {icon}
            {title}
          </h2>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function PlayerRow({ player, wins, rank, label, index = 0, isDesktop = true }) {
  const medals = ['1o', '2o', '3o'];
  const isTop = rank === 0 && wins > 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={isDesktop ? { x: 4, y: -1 } : {}}
      className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden rounded-2xl p-3 transition-colors sm:gap-4 sm:p-4 ${
        isTop
          ? 'uno-card-surface pulse-gold ring-1 ring-[oklch(0.86_0.17_85)]/50'
          : 'bg-[oklch(0.22_0.035_265)]/50 ring-1 ring-white/5 hover:ring-white/15'
      }`}
    >
      {isTop && <span className="absolute left-0 top-0 h-full w-[3px] bg-[oklch(0.86_0.17_85)]" />}
      <div className="flex items-center gap-2 sm:gap-3">
        <UnoChip color={player.color} label={player.name[0]} sm />
        <span className="w-7 text-center font-display text-base text-zinc-400 sm:w-8 sm:text-lg">
          {medals[rank] ?? `${rank + 1}o`}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-sm sm:text-base" translate="no">
          {player.name}
          {isTop && (
            <Crown className="ml-2 inline h-4 w-4 text-[oklch(0.86_0.17_85)]" />
          )}
        </p>
        {label && (
          <p className="truncate text-[10px] text-zinc-400 sm:text-xs">{label}</p>
        )}
      </div>
      <div className="text-right">
        <p className="font-display text-2xl leading-none sm:text-3xl">
          <span className="font-score">{wins}</span>
        </p>
        <p className="text-[9px] uppercase tracking-widest text-zinc-500 sm:text-[10px]">
          vitória{wins === 1 ? '' : 's'}
        </p>
      </div>
    </motion.div>
  );
}
