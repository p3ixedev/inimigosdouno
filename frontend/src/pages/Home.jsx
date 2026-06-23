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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';

import { PLAYERS, COLOR_STYLES, startOfWeek } from '../data/players';
import { fetchMatches, createMatch, deleteMatch } from '../api/matches';
import UnoChip from '../components/UnoChip';
import FloatingCards from '../components/FloatingCards';
import Podium from '../components/Podium';

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
    <div className="uno-bg relative">
      <FloatingCards />
      <main className="relative z-10 mx-auto max-w-5xl px-3 pb-16 pt-6 sm:px-4 sm:pb-24 sm:pt-12">

        {/* ===== NAVBAR ===== */}
        {user && (
          <div className="mb-4 flex items-center justify-end gap-2">
            <button
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 rounded-xl bg-[oklch(0.22_0.035_265)]/60 px-3 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-white/10 transition hover:ring-white/25"
            >
              <User className="h-3.5 w-3.5" />
              <span translate="no">{user.name}</span>
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-1.5 rounded-xl bg-[oklch(0.22_0.035_265)]/60 px-3 py-2 text-xs text-zinc-400 ring-1 ring-white/10 transition hover:text-[oklch(0.78_0.2_27)] hover:ring-white/25"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        )}

        {/* ===== HERO ===== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative mb-8 overflow-hidden rounded-3xl uno-card-surface px-5 py-8 sm:mb-10 sm:px-10 sm:py-14"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[oklch(0.63_0.24_27)]/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-[oklch(0.6_0.22_255)]/40 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.68_0.2_152)]/15 blur-3xl" />

          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400 sm:text-xs sm:tracking-[0.4em]">
              Placar Oficial
            </p>
            <motion.h1
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 110 }}
              className="mt-2 font-display text-[2.5rem] leading-[0.95] sm:mt-3 sm:text-7xl"
            >
              <span className="bg-gradient-to-r from-[oklch(0.78_0.2_27)] via-[oklch(0.85_0.18_90)] to-[oklch(0.7_0.22_255)] bg-clip-text text-transparent">
                Inimigos do Uno
              </span>
            </motion.h1>
            <p className="mt-2 text-xs text-zinc-400 sm:mt-3 sm:text-sm">O Grupo dos Impossíveis</p>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 sm:grid-cols-4">
              <StatTile delay={0.1} label="Partidas" value={matches.length.toString()} />
              <StatTile
                delay={0.2}
                label="Líder Geral"
                value={matches.length ? stats.lead.name : '—'}
                icon={<Trophy className="h-4 w-4 text-[oklch(0.86_0.17_85)]" />}
              />
              <StatTile
                delay={0.3}
                label="Rei da Semana"
                value={
                  Object.values(stats.weekWins).some((v) => v > 0)
                    ? stats.weekLead.name
                    : '—'
                }
                icon={<Crown className="h-4 w-4 text-[oklch(0.86_0.17_85)]" />}
              />
              <StatTile
                delay={0.4}
                label="Sequência"
                value={
                  stats.streaks[stats.topStreak.id] > 0
                    ? `${stats.topStreak.name} · ${stats.streaks[stats.topStreak.id]}`
                    : '—'
                }
                icon={<Flame className="h-4 w-4 text-[oklch(0.63_0.24_27)]" />}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-1.5 sm:mt-8 sm:gap-2">
              {PLAYERS.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 14, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.08, type: 'spring' }}
                  whileHover={isDesktop ? { y: -6, rotate: -5 } : {}}
                >
                  <UnoChip color={p.color} label={p.name[0]} sm />
                </motion.div>
              ))}
            </div>

            <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
              role para ver
            </div>
          </div>
        </motion.header>

        {/* ===== PLACAR ===== */}
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

        {/* ===== HISTÓRICO ===== */}
        <Section title="Histórico" eyebrow="Memória">
          <div className="rounded-2xl uno-card-surface p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center py-10 text-center text-zinc-400">
                <History className="mb-3 h-10 w-10 opacity-60 animate-pulse" />
                <p className="font-medium">Carregando histórico...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-zinc-400">
                <History className="mb-3 h-10 w-10 opacity-60" />
                <p className="font-medium">Nenhuma partida ainda!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {matches.map((m) => (
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
                            <span>jogaram:</span>
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

        <footer className="mt-16 text-center text-xs text-zinc-500">
          Desenvolvido por <span className="font-semibold text-zinc-200">Peixe</span>
        </footer>
      </main>
    </div>
  );
}

function StatTile({ label, value, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10 backdrop-blur sm:p-4"
    >
      <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 sm:gap-1.5 sm:text-[10px]">
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.4 }}
      className="mt-8 sm:mt-12"
    >
      <div className="mb-3 flex items-end justify-between sm:mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400 sm:text-[11px] sm:tracking-[0.35em]">
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
  const medals = ['1º', '2º', '3º'];
  const isTop = rank === 0 && wins > 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={isDesktop ? { x: 4 } : {}}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl p-3 transition-colors sm:gap-4 sm:p-4 ${
        isTop
          ? 'uno-card-surface ring-1 ring-[oklch(0.86_0.17_85)]/50'
          : 'bg-[oklch(0.22_0.035_265)]/50 ring-1 ring-white/5 hover:ring-white/15'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <UnoChip color={player.color} label={player.name[0]} sm />
        <span className="w-7 text-center font-display text-base text-zinc-400 sm:w-8 sm:text-lg">
          {medals[rank] ?? `${rank + 1}º`}
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
        <p className="font-display text-2xl leading-none sm:text-3xl">{wins}</p>
        <p className="text-[9px] uppercase tracking-widest text-zinc-400 sm:text-[10px]">vitórias</p>
      </div>
    </motion.div>
  );
}
