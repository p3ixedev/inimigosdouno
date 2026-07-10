import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import {
  Crown, Trophy, Swords, Flame, History, ChevronDown, Trash2,
  User, LogOut, X, Gamepad2, Zap, BarChart2, PlusCircle, Medal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { PLAYERS, COLOR_STYLES, startOfWeek } from '../data/players';
import { getChannel } from '../api/pusher';
import { fetchMatches, createMatch, deleteMatch } from '../api/matches';
import UnoChip from '../components/UnoChip';
import FloatingCards from '../components/FloatingCards';
import Podium from '../components/Podium';

const PLAYER_HEX = {
  red: '#dc3730', blue: '#3b82f6', green: '#22c55e',
  yellow: '#f59e0b', white: '#c8ccd8',
};

function useIsDesktop() {
  const [ok, setOk] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const h = (e) => setOk(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return ok;
}

/* ══ Custom recharts tooltip ══ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl px-4 py-3 text-sm"
      style={{
        background: 'rgba(10,11,20,0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 48px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
      }}>
      <p className="font-semibold text-white mb-1" translate="no">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2" style={{ color: p.fill }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          {p.name}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
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
    const wins = {}, weekWins = {};
    const weekStart = startOfWeek();
    PLAYERS.forEach((p) => { wins[p.id] = 0; weekWins[p.id] = 0; });
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
    return Object.values(pairs).filter((p) => p.total >= 2).sort((x, y) => y.total - x.total).slice(0, 3);
  }, [matches]);

  const ranking = useMemo(() => [...PLAYERS].sort((a, b) => stats.wins[b.id] - stats.wins[a.id]), [stats]);

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
    setSelectedWinners((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const submit = async () => {
    if (selectedPlayed.length < 2 || selectedWinners.length === 0) return;
    setSubmitting(true); setError(null);
    try {
      const newMatch = await createMatch({ played: selectedPlayed, winners: selectedWinners, note: note.trim() || null, ts: Date.now() });
      setMatches((prev) => [newMatch, ...prev]);
      setSelectedPlayed([]); setSelectedWinners([]); setNote('');
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Erro ao salvar partida');
    } finally { setSubmitting(false); }
  };

  const removeMatch = async (id) => {
    const prev = matches;
    setMatches((p) => p.filter((m) => m.id !== id));
    try { await deleteMatch(id); }
    catch { setMatches(prev); setError('Falha ao remover partida'); }
  };

  const pById = (id) => PLAYERS.find((p) => p.id === id);
  const chartData = ranking.map((p) => ({
    name: p.name,
    'Vitórias': stats.wins[p.id],
    'Semana': stats.weekWins[p.id],
    color: PLAYER_HEX[p.color],
  }));

  return (
    <div className="uno-bg relative min-h-screen">
      <FloatingCards />

      {/* ── ROOM NOTIFICATION ── */}
      <AnimatePresence>
        {notificacaoSala && (
          <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <motion.div
              initial={{ y: -60, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -60, opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="w-full max-w-sm"
            >
              <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,55,48,0.97), rgba(160,20,20,0.97))',
                  boxShadow: '0 24px 64px -12px rgba(220,55,48,0.7), inset 0 1px 0 rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(12px)',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate" translate="no">{notificacaoSala.criadorNome}</p>
                  <p className="text-xs text-white/70">criou uma sala — bora jogar!</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => navigate(`/jogo/${notificacaoSala.codigo}`)}
                    className="rounded-xl bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wider hover:bg-white/90 transition"
                    style={{ color: '#dc3730' }}>
                    Entrar
                  </button>
                  <button onClick={() => setNotificacaoSala(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition"
                    aria-label="Fechar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto max-w-5xl px-3 pb-24 pt-4 sm:px-5 sm:pt-6">

        {/* ── NAVBAR ── */}
        {user && (
          <nav className="mb-6 flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              {/* Logo mark */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-xl blur-md scale-150"
                  style={{ background: 'rgba(220,55,48,0.5)' }} />
                <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, #dc3730, #8b1515)',
                    boxShadow: '0 4px 16px -4px rgba(220,55,48,0.7), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}>
                  <span className="font-display text-white text-sm tracking-wide">U</span>
                </div>
              </div>
              <span className="font-display text-xl text-white hidden sm:block tracking-wide">Inimigos do Uno</span>
            </div>

            <div className="flex items-center gap-1.5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/jogo')}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider"
              >
                <Gamepad2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Jogar</span>
              </motion.button>
              <button onClick={() => navigate('/perfil')}
                className="btn-secondary flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline" translate="no">{user.name}</span>
              </button>
              <button onClick={() => { logout(); navigate('/entrar'); }}
                className="btn-secondary flex items-center justify-center w-9 h-9 rounded-xl"
                aria-label="Sair">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </nav>
        )}

        {/* ── HERO SECTION ── */}
        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8 overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 32px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          {/* Top accent */}
          <div className="h-px w-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(220,55,48,0.7), rgba(59,130,246,0.5), transparent)' }} />

          {/* Internal glows */}
          <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(220,55,48,0.18) 0%, transparent 65%)' }} />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 65%)' }} />

          <div className="relative px-5 py-8 sm:px-10 sm:py-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] sm:text-xs"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              Placar Oficial · {new Date().getFullYear()}
            </p>

            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 120 }}
              className="mt-2 font-display text-gradient-uno leading-none"
              style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}
            >
              Inimigos do Uno
            </motion.h1>
            <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              O Grupo dos Impossíveis
            </p>

            {/* Stats grid */}
            <div className="mt-7 grid grid-cols-2 gap-2 sm:mt-9 sm:gap-3 sm:grid-cols-4">
              <StatTile delay={0.1} label="Partidas" value={matches.length.toString()} />
              <StatTile delay={0.2} label="Líder Geral"
                value={matches.length ? stats.lead.name : '—'}
                icon={<Trophy className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />}
                highlight />
              <StatTile delay={0.3} label="Rei da Semana"
                value={Object.values(stats.weekWins).some((v) => v > 0) ? stats.weekLead.name : '—'}
                icon={<Crown className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />}
                highlight />
              <StatTile delay={0.4} label="Sequência"
                value={stats.streaks[stats.topStreak.id] > 0
                  ? `${stats.topStreak.name} ×${stats.streaks[stats.topStreak.id]}` : '—'}
                icon={<Flame className="h-3.5 w-3.5" style={{ color: '#dc3730' }} />} />
            </div>

            {/* Player chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {PLAYERS.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 14, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.07, type: 'spring' }}
                  whileHover={isDesktop ? { y: -6, rotate: -5, scale: 1.08 } : {}}>
                  <UnoChip color={p.color} label={p.name[0]} sm />
                </motion.div>
              ))}
            </div>

            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
              Role para ver o placar
            </div>
          </div>
        </motion.header>

        {/* ── PLACAR ── */}
        <Section title="Placar" eyebrow="Classificação"
          icon={<Trophy className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#f59e0b' }} />}>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-5 grid w-full grid-cols-3 p-1 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
              {['geral', 'semana', 'grafico'].map((t) => (
                <TabsTrigger key={t} value={t} className="rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
                  style={{ letterSpacing: '0.02em' }}>
                  {t === 'grafico' ? (
                    <span className="flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5" />Gráfico
                    </span>
                  ) : t === 'geral' ? 'Geral' : 'Semana'}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="geral" className="space-y-2.5">
              {matches.length > 0 && <Podium ranking={ranking} wins={stats.wins} />}
              {ranking.map((p, i) => (
                <PlayerRow key={p.id} player={p} wins={stats.wins[p.id]} rank={i} index={i} isDesktop={isDesktop} />
              ))}
            </TabsContent>

            <TabsContent value="semana" className="space-y-2.5">
              {[...PLAYERS].sort((a, b) => stats.weekWins[b.id] - stats.weekWins[a.id]).map((p, i) => (
                <PlayerRow key={p.id} player={p} wins={stats.weekWins[p.id]} rank={i} index={i}
                  label="Esta semana" isDesktop={isDesktop} />
              ))}
            </TabsContent>

            <TabsContent value="grafico">
              <div className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                <div className="h-72 w-full">
                  <ResponsiveContainer>
                    <BarChart data={chartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={12} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.25)" fontSize={12} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="Vitórias" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                        ))}
                      </Bar>
                      <Bar dataKey="Semana" fill="rgba(255,255,255,0.15)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 text-center text-[10px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Barras coloridas = total geral · Barras brancas = semana atual
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ── RIVALIDADES ── */}
        <Section title="Rivalidades" eyebrow="Duelos Históricos"
          icon={<Swords className="h-5 w-5 sm:h-6 sm:w-6" />}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {rivalries.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Swords className="h-7 w-7" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Sem dados suficientes ainda.
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Joguem mais para as rivalidades aparecerem!
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                {rivalries.map((r, idx) => {
                  const a = pById(r.a), b = pById(r.b);
                  const aLead = r.aWins >= r.bWins;
                  const total = r.aWins + r.bWins;
                  const aPct = total > 0 ? (r.aWins / total) * 100 : 50;
                  return (
                    <motion.div key={`${r.a}-${r.b}`}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
                      {/* Player A */}
                      <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0">
                        <div className="text-right min-w-0">
                          <p className="text-sm font-semibold truncate" translate="no">{a?.name}</p>
                          <p className={`font-display text-2xl sm:text-3xl leading-none ${aLead ? 'text-gradient-gold' : ''}`}
                            style={!aLead ? { color: 'rgba(255,255,255,0.35)' } : {}}>
                            {r.aWins}
                          </p>
                        </div>
                        <UnoChip color={a?.color} label={a?.name[0]} sm />
                      </div>

                      {/* Center */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                          <Swords className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.45)' }} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {r.total} jogos
                        </p>
                        {/* Progress bar */}
                        <div className="w-14 h-1.5 rounded-full overflow-hidden flex"
                          style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${aPct}%`, background: PLAYER_HEX[a?.color] || '#dc3730' }} />
                        </div>
                      </div>

                      {/* Player B */}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <UnoChip color={b?.color} label={b?.name[0]} sm />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" translate="no">{b?.name}</p>
                          <p className={`font-display text-2xl sm:text-3xl leading-none ${!aLead ? 'text-gradient-gold' : ''}`}
                            style={aLead ? { color: 'rgba(255,255,255,0.35)' } : {}}>
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

        {/* ── REGISTRAR ── */}
        <Section title="Registrar" eyebrow="Nova Partida"
          icon={<PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />}>
          <div className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
            {/* Top accent bar */}
            <div className="h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(220,55,48,0.6), rgba(59,130,246,0.4), transparent)' }} />

            <div className="p-5 sm:p-8">
              {/* Quem jogou */}
              <div className="mb-7">
                <label className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span className="w-4 h-4 rounded-md flex items-center justify-center text-xs"
                    style={{ background: 'rgba(220,55,48,0.2)', color: '#dc3730' }}>1</span>
                  Quem jogou?
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PLAYERS.map((p) => {
                    const active = selectedPlayed.includes(p.id);
                    const hex = PLAYER_HEX[p.color] || '#dc3730';
                    return (
                      <motion.button key={p.id}
                        whileHover={isDesktop ? { y: -1, scale: 1.01 } : {}}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => togglePlayed(p.id)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150"
                        style={{
                          background: active ? `${hex}14` : 'rgba(255,255,255,0.03)',
                          border: active ? `1.5px solid ${hex}55` : '1px solid rgba(255,255,255,0.07)',
                          boxShadow: active ? `0 0 20px -6px ${hex}50` : 'none',
                        }}>
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 transition-all"
                          style={{ background: hex, boxShadow: active ? `0 0 8px ${hex}` : 'none' }} />
                        <span className="font-semibold text-sm" translate="no">{p.name}</span>
                        {active && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: `${hex}20`, color: hex }}>
                            OK
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Quem ganhou */}
              <div className="mb-7">
                <label className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span className="w-4 h-4 rounded-md flex items-center justify-center text-xs"
                    style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>2</span>
                  Quem ganhou?
                </label>
                {selectedPlayed.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-4 text-sm"
                    style={{
                      border: '1.5px dashed rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)',
                    }}>
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
                        <motion.button key={id}
                          whileHover={isDesktop ? { scale: 1.04 } : {}}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleWinner(id)}
                          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150"
                          style={{
                            background: active ? hex : 'rgba(255,255,255,0.05)',
                            color: active ? (p.color === 'white' ? '#1a1d2e' : 'white') : 'rgba(255,255,255,0.6)',
                            border: active ? `1px solid ${hex}` : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: active ? `0 4px 20px -4px ${hex}60` : 'none',
                          }}>
                          {active && <Crown className="h-3.5 w-3.5" />}
                          <span translate="no">{p.name}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Observação */}
              <div className="mb-7">
                <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span className="w-4 h-4 rounded-md flex items-center justify-center text-xs"
                    style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>3</span>
                  Observação (opcional)
                </label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Algum detalhe épico sobre essa partida?"
                  className="min-h-[80px] text-foreground placeholder:text-muted-foreground/40 resize-none rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }} />
              </div>

              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={submit}
                disabled={submitting || selectedPlayed.length < 2 || selectedWinners.length === 0}
                className="btn-primary w-full h-12 rounded-xl font-bold text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                {submitting ? 'Salvando...' : 'Registrar Vitória'}
              </motion.button>

              {error && (
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl px-4 py-3 text-sm text-center"
                  style={{ background: 'rgba(220,55,48,0.1)', color: '#fca5a5', border: '1px solid rgba(220,55,48,0.25)' }}>
                  {error}
                </motion.p>
              )}
            </div>
          </div>
        </Section>

        {/* ── HISTÓRICO ── */}
        <Section title="Histórico" eyebrow="Memória da Semana"
          icon={<History className="h-5 w-5 sm:h-6 sm:w-6" />}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {loading ? (
              <div className="flex flex-col items-center py-14 gap-3 text-center"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                <History className="h-10 w-10 opacity-30 animate-pulse" />
                <p className="text-sm font-medium animate-pulse">Carregando histórico...</p>
              </div>
            ) : historicoSemana.length === 0 ? (
              <div className="flex flex-col items-center py-14 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <History className="h-7 w-7" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Nenhuma partida esta semana ainda!
                </p>
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <AnimatePresence initial={false}>
                  {historicoSemana.map((m) => (
                    <motion.li key={m.id} layout
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 48 }}
                      className="group px-4 py-4 sm:px-5 sm:py-5 transition-colors hover:bg-white/[0.02]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Winners */}
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {m.winners.map((wId) => {
                              const w = pById(wId);
                              return (
                                <span key={wId}
                                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                                  style={{
                                    background: 'rgba(245,158,11,0.12)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                  }}
                                  translate="no">
                                  <Crown className="h-3 w-3" />
                                  {w?.name}
                                </span>
                              );
                            })}
                          </div>
                          {/* Players */}
                          <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <span className="font-medium">Jogaram:</span>
                            {m.played.map((id) => {
                              const p = pById(id);
                              const hex = PLAYER_HEX[p?.color] || '#dc3730';
                              return (
                                <span key={id} className="inline-flex items-center gap-1" translate="no">
                                  <span className="h-2 w-2 rounded-full" style={{ background: hex }} />
                                  {p?.name}
                                </span>
                              );
                            })}
                          </div>
                          {m.note && (
                            <p className="mt-1.5 text-xs italic"
                              style={{ color: 'rgba(255,255,255,0.3)' }}>
                              &ldquo;{m.note}&rdquo;
                            </p>
                          )}
                          <p className="mt-2 text-[10px] uppercase tracking-wider"
                            style={{ color: 'rgba(255,255,255,0.2)' }}>
                            {new Date(m.ts).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <button onClick={() => removeMatch(m.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: 'rgba(255,255,255,0.35)', background: 'transparent' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(220,55,48,0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
                          aria-label="Remover">
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

        <footer className="mt-20 text-center text-xs"
          style={{ color: 'rgba(255,255,255,0.18)' }}>
          Desenvolvido por{' '}
          <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Peixe</span>
        </footer>
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function StatTile({ label, value, icon, delay = 0, highlight = false }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-xl p-3 sm:p-4"
      style={{
        background: highlight ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)',
        border: highlight ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.07)',
      }}>
      <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest mb-1 sm:text-[10px]"
        style={{ color: highlight ? 'rgba(245,158,11,0.8)' : 'rgba(255,255,255,0.35)' }}>
        {icon}{label}
      </p>
      <p className="font-display text-xl sm:text-2xl truncate" translate="no"
        style={{ color: highlight ? '#fbbf24' : 'rgba(255,255,255,0.9)' }}>
        {value}
      </p>
    </motion.div>
  );
}

function Section({ title, eyebrow, icon, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.04 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 sm:mt-14"
    >
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] sm:text-[11px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            {eyebrow}
          </p>
          <h2 className="font-display flex items-center gap-2 sm:gap-3 text-2xl sm:text-4xl" style={{ color: 'rgba(255,255,255,0.95)' }}>
            {icon}{title}
          </h2>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function PlayerRow({ player, wins, rank, label, index = 0, isDesktop = true }) {
  const rankLabel = ['1°', '2°', '3°'][rank] ?? `${rank + 1}°`;
  const isTop = rank === 0 && wins > 0;
  const hex = PLAYER_HEX[player.color] || '#dc3730';
  const rankColors = ['#f59e0b', '#94a3b8', '#cd7c3e'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={isDesktop ? { x: 5 } : {}}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-3 sm:gap-4 sm:p-4 transition-all group"
      style={{
        background: isTop ? `${hex}0d` : 'rgba(255,255,255,0.025)',
        border: isTop ? `1px solid ${hex}30` : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isTop ? `0 0 32px -10px ${hex}30` : 'none',
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <UnoChip color={player.color} label={player.name[0]} sm />
        <span className="w-6 text-center font-display text-lg sm:text-xl"
          style={{ color: rankColors[rank] ?? 'rgba(255,255,255,0.35)' }}>
          {rankLabel}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-sm sm:text-base" translate="no">
          {player.name}
          {isTop && <Crown className="ml-2 inline h-4 w-4" style={{ color: '#f59e0b' }} />}
        </p>
        {label && <p className="truncate text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>}
      </div>
      <div className="text-right">
        <p className="font-display text-2xl leading-none sm:text-3xl"
          style={{ color: isTop ? '#f59e0b' : 'rgba(255,255,255,0.85)' }}>
          {wins}
        </p>
        <p className="text-[9px] uppercase tracking-widest sm:text-[10px]"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          vitórias
        </p>
      </div>
    </motion.div>
  );
}
