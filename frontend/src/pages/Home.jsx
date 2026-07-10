import React, { useEffect, useMemo, useState } from 'react';
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
  ChevronDown,
  Trash2,
  User,
  LogOut,
  X,
  Gamepad2,
  Zap,
  BarChart2,
  PlusCircle,
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

const PLAYER_HEX = {
  red:    '#dc3730',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#f59e0b',
  white:  '#e2e8f0',
};

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

  return (
    <div className="uno-bg relative min-h-screen">
      <FloatingCards />

      {/* Room notification toast */}
      <AnimatePresence>
        {notificacaoSala && (
          <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <motion.div
              initial={{ y: -48, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -48, opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-sm"
            >
              <div
                className="relative flex items-center gap-4 rounded-2xl px-5 py-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,55,48,0.95), rgba(185,28,28,0.95))',
                  boxShadow: '0 20px 60px -12px rgba(220,55,48,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate" translate="no">
                    {notificacaoSala.criadorNome}
                  </p>
                  <p className="text-xs text-white/75">criou uma sala — bora jogar!</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/jogo/${notificacaoSala.codigo}`)}
                    className="rounded-xl bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wider transition hover:bg-white/90"
                    style={{ color: '#dc3730' }}
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => setNotificacaoSala(null)}
                    className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto max-w-5xl px-3 pb-20 pt-5 sm:px-5 sm:pb-28 sm:pt-8">

        {/* ===== NAVBAR ===== */}
        {user && (
          <nav className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #dc3730, #b91c1c)', boxShadow: '0 4px 12px -4px rgba(220,55,48,0.6)' }}>
                <span className="font-display text-xs text-white">UNO</span>
              </div>
              <span className="font-display text-lg text-foreground hidden sm:block">Inimigos do Uno</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/jogo')}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white uppercase tracking-wider transition btn-primary-glow"
                style={{ background: 'linear-gradient(135deg, #dc3730, #b91c1c)' }}
              >
                <Gamepad2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Jogar</span>
              </motion.button>
              <button
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline" translate="no">{user.name}</span>
              </button>
              <button
                onClick={() => { logout(); navigate('/entrar'); }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                aria-label="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </nav>
        )}

        {/* ===== HERO ===== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-6 overflow-hidden rounded-3xl sm:mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          {/* Glow orbs inside hero */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(220,55,48,0.2) 0%, transparent 70%)' }} />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />

          <div className="relative px-5 py-8 sm:px-10 sm:py-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground sm:text-xs">
              Placar Oficial
            </p>
            <motion.h1
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 120 }}
              className="mt-2 font-display text-[2.8rem] leading-[0.95] sm:text-7xl text-gradient-uno"
            >
              Inimigos do Uno
            </motion.h1>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">O Grupo dos Impossíveis</p>

            {/* Stats grid */}
            <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 sm:grid-cols-4">
              <StatTile delay={0.1} label="Partidas" value={matches.length.toString()} />
              <StatTile
                delay={0.2}
                label="Líder Geral"
                value={matches.length ? stats.lead.name : '—'}
                icon={<Trophy className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />}
              />
              <StatTile
                delay={0.3}
                label="Rei da Semana"
                value={Object.values(stats.weekWins).some((v) => v > 0) ? stats.weekLead.name : '—'}
                icon={<Crown className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />}
              />
              <StatTile
                delay={0.4}
                label="Sequência"
                value={
                  stats.streaks[stats.topStreak.id] > 0
                    ? `${stats.topStreak.name} ×${stats.streaks[stats.topStreak.id]}`
                    : '—'
                }
                icon={<Flame className="h-3.5 w-3.5" style={{ color: '#dc3730' }} />}
              />
            </div>

            {/* Player chips row */}
            <div className="mt-5 flex flex-wrap items-center gap-1.5 sm:mt-6 sm:gap-2">
              {PLAYERS.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12, rotate: -8 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.45 + i * 0.07, type: 'spring' }}
                  whileHover={isDesktop ? { y: -5, rotate: -4 } : {}}
                >
                  <UnoChip color={p.color} label={p.name[0]} sm />
                </motion.div>
              ))}
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
              Role para ver o placar
            </div>
          </div>
        </motion.header>

        {/* ===== RANKING ===== */}
        <Section title="Placar" eyebrow="Classificação" icon={<Trophy className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#f59e0b' }} />}>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-5 grid w-full grid-cols-3 p-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <TabsTrigger value="geral" className="text-xs sm:text-sm rounded-lg">Geral</TabsTrigger>
              <TabsTrigger value="semana" className="text-xs sm:text-sm rounded-lg">Semana</TabsTrigger>
              <TabsTrigger value="grafico" className="text-xs sm:text-sm rounded-lg">
                <BarChart2 className="h-3.5 w-3.5 mr-1.5 inline" />
                Gráfico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-2.5">
              {matches.length > 0 && <Podium ranking={ranking} wins={stats.wins} />}
              {ranking.map((p, i) => (
                <PlayerRow key={p.id} player={p} wins={stats.wins[p.id]} rank={i} index={i} isDesktop={isDesktop} />
              ))}
            </TabsContent>

            <TabsContent value="semana" className="space-y-2.5">
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
              <div className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                <div className="h-72 w-full">
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(14,16,28,0.95)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 12,
                          color: 'white',
                          boxShadow: '0 16px 40px -8px rgba(0,0,0,0.8)',
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="Vitórias" fill="#dc3730" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Semana"   fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ===== RIVALIDADES ===== */}
        <Section title="Rivalidades" eyebrow="Duelos" icon={<Swords className="h-5 w-5 sm:h-6 sm:w-6" />}>
          <div className="rounded-2xl p-4 sm:p-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
            {rivalries.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <Swords className="mb-3 h-10 w-10 opacity-30" />
                <p className="font-semibold text-foreground/70">Sem dados suficientes ainda.</p>
                <p className="text-sm mt-1">Joguem mais para as rivalidades aparecerem!</p>
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
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl p-3 sm:gap-4 sm:p-4"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
                        <div className="min-w-0 text-right">
                          <p className="truncate text-sm font-semibold sm:text-base" translate="no">{a.name}</p>
                          <p className={`text-xl font-display sm:text-2xl ${aLead ? 'text-[#f59e0b]' : 'text-muted-foreground'}`}>
                            {r.aWins}
                          </p>
                        </div>
                        <UnoChip color={a.color} label={a.name[0]} sm />
                      </div>

                      <div className="text-center text-muted-foreground">
                        <Swords className="mx-auto h-4 w-4 mb-1 sm:h-5 sm:w-5" />
                        <p className="text-[10px] font-semibold uppercase tracking-widest">{r.total} jogos</p>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <UnoChip color={b.color} label={b.name[0]} sm />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold sm:text-base" translate="no">{b.name}</p>
                          <p className={`text-xl font-display sm:text-2xl ${!aLead ? 'text-[#f59e0b]' : 'text-muted-foreground'}`}>
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
        <Section title="Registrar" eyebrow="Nova Partida" icon={<PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />}>
          <div className="rounded-2xl p-5 sm:p-8"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>

            {/* Quem jogou */}
            <div className="mb-6">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Quem jogou?
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PLAYERS.map((p) => {
                  const active = selectedPlayed.includes(p.id);
                  const hex = PLAYER_HEX[p.color] || '#dc3730';
                  return (
                    <motion.button
                      key={p.id}
                      whileHover={isDesktop ? { y: -1 } : {}}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => togglePlayed(p.id)}
                      className="group flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200"
                      style={{
                        background: active ? `${hex}18` : 'rgba(255,255,255,0.03)',
                        border: active ? `1px solid ${hex}55` : '1px solid rgba(255,255,255,0.07)',
                        boxShadow: active ? `0 0 16px -4px ${hex}40` : 'none',
                      }}
                    >
                      <span className="h-3 w-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: hex, boxShadow: active ? `0 0 8px ${hex}` : 'none' }} />
                      <span className="font-medium text-sm" translate="no">{p.name}</span>
                      {active && (
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: `${hex}25`, color: hex }}
                        >
                          OK
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Quem ganhou */}
            <div className="mb-6">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Quem ganhou?
              </label>
              {selectedPlayed.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl px-4 py-4 text-sm text-muted-foreground"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Zap className="h-4 w-4 opacity-50" />
                  Selecione os jogadores primeiro
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedPlayed.map((id) => {
                    const p = pById(id);
                    const active = selectedWinners.includes(id);
                    const hex = PLAYER_HEX[p.color] || '#dc3730';
                    return (
                      <motion.button
                        key={id}
                        whileHover={isDesktop ? { scale: 1.04 } : {}}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => toggleWinner(id)}
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200"
                        style={{
                          background: active ? hex : 'rgba(255,255,255,0.05)',
                          color: active ? (p.color === 'white' ? '#1a1d2e' : 'white') : 'rgba(255,255,255,0.7)',
                          border: active ? `1px solid ${hex}` : '1px solid rgba(255,255,255,0.1)',
                          boxShadow: active ? `0 4px 16px -4px ${hex}55` : 'none',
                        }}
                      >
                        {active && <Crown className="h-3.5 w-3.5" />}
                        <span translate="no">{p.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Observação */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Observação (opcional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Algum detalhe sobre essa partida?"
                className="min-h-[80px] text-foreground placeholder:text-muted-foreground/50 resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={submit}
              disabled={submitting || selectedPlayed.length < 2 || selectedWinners.length === 0}
              className="w-full h-12 rounded-xl font-bold text-base uppercase tracking-wider text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                boxShadow: submitting || selectedPlayed.length < 2 || selectedWinners.length === 0
                  ? 'none'
                  : '0 8px 24px -8px rgba(220,55,48,0.6)',
              }}
            >
              {submitting ? 'Salvando...' : 'Registrar Vitória'}
            </motion.button>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(220,55,48,0.12)', color: '#fca5a5', border: '1px solid rgba(220,55,48,0.25)' }}
              >
                {error}
              </motion.p>
            )}
          </div>
        </Section>

        {/* ===== HISTÓRICO ===== */}
        <Section title="Histórico" eyebrow="Memória da Semana" icon={<History className="h-5 w-5 sm:h-6 sm:w-6" />}>
          <div className="rounded-2xl p-4 sm:p-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
            {loading ? (
              <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <History className="mb-3 h-10 w-10 opacity-30 animate-pulse" />
                <p className="font-medium">Carregando histórico...</p>
              </div>
            ) : historicoSemana.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <History className="mb-3 h-10 w-10 opacity-30" />
                <p className="font-semibold text-foreground/60">Nenhuma partida esta semana ainda!</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {historicoSemana.map((m) => (
                    <motion.li
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 48 }}
                      className="group rounded-xl p-4 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Winners */}
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            {m.winners.map((wId) => {
                              const w = pById(wId);
                              return (
                                <span
                                  key={wId}
                                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                                  style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}
                                  translate="no"
                                >
                                  <Crown className="h-3 w-3" />
                                  {w.name}
                                </span>
                              );
                            })}
                          </div>
                          {/* Players */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-medium">Jogaram:</span>
                            {m.played.map((id) => {
                              const p = pById(id);
                              const hex = PLAYER_HEX[p.color] || '#dc3730';
                              return (
                                <span key={id} className="inline-flex items-center gap-1" translate="no">
                                  <span className="h-2 w-2 rounded-full" style={{ background: hex }} />
                                  {p.name}
                                </span>
                              );
                            })}
                          </div>
                          {m.note && (
                            <p className="mt-2 text-xs italic text-muted-foreground/70">
                              &ldquo;{m.note}&rdquo;
                            </p>
                          )}
                          <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground/50">
                            {new Date(m.ts).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => removeMatch(m.id)}
                          className="shrink-0 rounded-lg p-2 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
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

        <footer className="mt-16 text-center text-xs text-muted-foreground/50">
          Desenvolvido por <span className="font-semibold text-muted-foreground">Peixe</span>
        </footer>
      </main>
    </div>
  );
}

/* ---- Sub-components ---- */

function StatTile({ label, value, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl p-3 sm:p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate font-display text-xl sm:text-2xl" translate="no">{value}</p>
    </motion.div>
  );
}

function Section({ title, eyebrow, icon, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.4 }}
      className="mt-8 sm:mt-12"
    >
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:text-[11px]">
            {eyebrow}
          </p>
          <h2 className="font-display text-2xl flex items-center gap-2 sm:text-4xl sm:gap-3 text-foreground">
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
  const medals = ['1°', '2°', '3°'];
  const isTop = rank === 0 && wins > 0;
  const hex = PLAYER_HEX[player.color] || '#dc3730';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={isDesktop ? { x: 4 } : {}}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-3 transition-all sm:gap-4 sm:p-4"
      style={{
        background: isTop ? `${hex}0f` : 'rgba(255,255,255,0.03)',
        border: isTop ? `1px solid ${hex}35` : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isTop ? `0 0 24px -8px ${hex}35` : 'none',
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <UnoChip color={player.color} label={player.name[0]} sm />
        <span className="w-6 text-center font-display text-base text-muted-foreground sm:w-8 sm:text-lg">
          {medals[rank] ?? `${rank + 1}°`}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-sm sm:text-base" translate="no">
          {player.name}
          {isTop && (
            <Crown className="ml-2 inline h-4 w-4" style={{ color: '#f59e0b' }} />
          )}
        </p>
        {label && (
          <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{label}</p>
        )}
      </div>
      <div className="text-right">
        <p className="font-display text-2xl leading-none sm:text-3xl">{wins}</p>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground sm:text-[10px]">vitórias</p>
      </div>
    </motion.div>
  );
}
