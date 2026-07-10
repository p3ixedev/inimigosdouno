import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Trophy, Flame, Swords, History, LogOut, Home, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMatches } from '../api/matches';
import { PLAYERS, startOfWeek } from '../data/players';
import UnoChip from '../components/UnoChip';

const PLAYER_HEX = {
  red:    '#dc3730',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#f59e0b',
  white:  '#e2e8f0',
};

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches()
      .then(setMatches)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!user) return null;
    const id = user.id;
    const weekStart = startOfWeek();

    const minhasPartidas = matches.filter((m) => m.played.includes(id));
    const minhasVitorias = matches.filter((m) => m.winners.includes(id));
    const vitoriasSemana = matches.filter((m) => m.winners.includes(id) && m.ts >= weekStart);

    const sorted = [...matches].sort((a, b) => b.ts - a.ts);
    let sequencia = 0;
    for (const m of sorted) {
      if (!m.played.includes(id)) continue;
      if (m.winners.includes(id)) sequencia++;
      else break;
    }

    const taxaVitoria = minhasPartidas.length > 0
      ? Math.round((minhasVitorias.length / minhasPartidas.length) * 100)
      : 0;

    const rivais = {};
    minhasPartidas.forEach((m) => {
      m.played.forEach((oId) => {
        if (oId === id) return;
        if (!rivais[oId]) rivais[oId] = { total: 0, minhasVitorias: 0, vitoriasRival: 0 };
        rivais[oId].total++;
        if (m.winners.includes(id)) rivais[oId].minhasVitorias++;
        if (m.winners.includes(oId)) rivais[oId].vitoriasRival++;
      });
    });

    const rivalidades = Object.entries(rivais)
      .filter(([, r]) => r.total >= 1)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 4)
      .map(([rivalId, r]) => ({
        rival: PLAYERS.find((p) => p.id === rivalId),
        ...r,
      }));

    return {
      totalPartidas: minhasPartidas.length,
      totalVitorias: minhasVitorias.length,
      vitoriasSemana: vitoriasSemana.length,
      sequencia,
      taxaVitoria,
      rivalidades,
      historico: minhasPartidas.sort((a, b) => b.ts - a.ts).slice(0, 10),
    };
  }, [matches, user]);

  const pById = (id) => PLAYERS.find((p) => p.id === id);
  const userHex = user ? (PLAYER_HEX[user.color] || '#dc3730') : '#dc3730';

  return (
    <div className="uno-bg relative min-h-screen">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full"
          style={{ background: `radial-gradient(circle, ${userHex}18 0%, transparent 70%)` }} />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }} />
      </div>

      <main className="relative z-10 mx-auto max-w-2xl px-3 pb-16 pt-5 sm:px-5 sm:pt-8">

        {/* Profile header card */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: `1px solid ${userHex}30`,
            boxShadow: `0 0 40px -12px ${userHex}25, 0 16px 48px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${userHex}, transparent)` }} />

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            {/* Nav */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <Home className="h-3.5 w-3.5" />
                Início
              </button>
              <button
                onClick={() => { logout(); navigate('/entrar'); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>

            {/* Profile info */}
            <div className="flex items-center gap-4">
              {user && <UnoChip color={user.color} label={user.name[0]} />}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground mb-1">
                  Meu Perfil
                </p>
                <h1 className="font-display leading-none truncate" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', color: userHex }} translate="no">
                  {user?.name}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center py-20 text-center text-muted-foreground gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-8 h-8 border-2 rounded-full"
              style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: userHex }}
            />
            <p className="text-sm animate-pulse">Carregando seus dados...</p>
          </div>
        ) : stats && (
          <>
            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            >
              <StatCard
                label="Partidas"
                value={stats.totalPartidas}
                icon={<History className="h-4 w-4" />}
                color="rgba(255,255,255,0.5)"
              />
              <StatCard
                label="Vitórias"
                value={stats.totalVitorias}
                icon={<Trophy className="h-4 w-4" />}
                color="#f59e0b"
                highlight
                highlightColor="#f59e0b"
              />
              <StatCard
                label="Esta semana"
                value={stats.vitoriasSemana}
                icon={<Crown className="h-4 w-4" />}
                color="#f59e0b"
              />
              <StatCard
                label="Sequência"
                value={stats.sequencia}
                icon={<Flame className="h-4 w-4" />}
                color={stats.sequencia > 0 ? userHex : 'rgba(255,255,255,0.5)'}
                highlight={stats.sequencia > 0}
                highlightColor={userHex}
              />
            </motion.div>

            {/* Win rate bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-5 rounded-2xl p-4 sm:p-5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Taxa de Vitória
                </div>
                <span className="font-display text-2xl" style={{ color: userHex }}>{stats.taxaVitoria}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.taxaVitoria}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${userHex}, ${userHex}aa)`,
                    boxShadow: `0 0 8px ${userHex}60`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.totalVitorias} vitória{stats.totalVitorias !== 1 ? 's' : ''} em {stats.totalPartidas} partida{stats.totalPartidas !== 1 ? 's' : ''}
              </p>
            </motion.div>

            {/* Rivalidades */}
            {stats.rivalidades.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-5"
              >
                <SectionTitle icon={<Swords className="h-4 w-4" />} title="Meus Duelos" />
                <div className="rounded-2xl p-4 sm:p-5 space-y-2.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {stats.rivalidades.map(({ rival, total, minhasVitorias, vitoriasRival }) => {
                    if (!rival) return null;
                    const euLido = minhasVitorias >= vitoriasRival;
                    const rivalHex = PLAYER_HEX[rival.color] || '#dc3730';
                    const totalGames = minhasVitorias + vitoriasRival;
                    const myPct = totalGames > 0 ? (minhasVitorias / totalGames) * 100 : 50;

                    return (
                      <div key={rival.id}
                        className="rounded-xl p-3 sm:p-4"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 mb-2">
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-right">
                              <p className="text-xs font-semibold" translate="no">{user?.name}</p>
                              <p className={`text-2xl font-display ${euLido ? '' : 'text-muted-foreground'}`}
                                style={euLido ? { color: '#f59e0b' } : {}}>
                                {minhasVitorias}
                              </p>
                            </div>
                            <UnoChip color={user?.color} label={user?.name[0]} sm />
                          </div>
                          <div className="text-center text-muted-foreground">
                            <Swords className="mx-auto h-4 w-4 mb-0.5" />
                            <p className="text-[10px] font-semibold">{total}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <UnoChip color={rival.color} label={rival.name[0]} sm />
                            <div>
                              <p className="text-xs font-semibold" translate="no">{rival.name}</p>
                              <p className={`text-2xl font-display ${!euLido ? '' : 'text-muted-foreground'}`}
                                style={!euLido ? { color: '#f59e0b' } : {}}>
                                {vitoriasRival}
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Progress bar showing win ratio */}
                        <div className="h-1.5 rounded-full overflow-hidden flex gap-0.5"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${myPct}%`, background: userHex }} />
                          <div className="h-full flex-1 rounded-full"
                            style={{ background: rivalHex, opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Match history */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SectionTitle icon={<History className="h-4 w-4" />} title="Minhas Partidas" />
              <div className="rounded-2xl p-4 sm:p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {stats.historico.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center text-muted-foreground gap-2">
                    <History className="h-10 w-10 opacity-25" />
                    <p className="text-sm">Nenhuma partida ainda!</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {stats.historico.map((m) => {
                      const ganhei = m.winners.includes(user?.id);
                      return (
                        <li key={m.id}
                          className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{
                            background: ganhei ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
                            border: ganhei ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.06)',
                          }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: ganhei ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                                border: ganhei ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                              }}>
                              {ganhei
                                ? <Trophy className="h-4 w-4" style={{ color: '#f59e0b' }} />
                                : <span className="text-sm text-muted-foreground/50 font-bold">✗</span>
                              }
                            </div>
                            <div>
                              <p className="text-xs font-semibold" style={{ color: ganhei ? '#fbbf24' : 'rgba(255,255,255,0.6)' }}>
                                {ganhei ? 'Vitória' : 'Derrota'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {m.played.map((id) => pById(id)?.name).join(', ')}
                              </p>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 text-right flex-shrink-0">
                            {new Date(m.ts).toLocaleDateString('pt-BR')}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color, highlight, highlightColor }) {
  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: highlight ? `${highlightColor}0c` : 'rgba(255,255,255,0.03)',
        border: highlight ? `1px solid ${highlightColor}30` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: highlight ? `0 0 20px -8px ${highlightColor}30` : 'none',
      }}
    >
      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color }}>
        {icon}
        {label}
      </p>
      <p className="font-display text-3xl leading-none" style={highlight ? { color: highlightColor } : {}}>
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-muted-foreground">
      {icon}
      <p className="text-[10px] font-semibold uppercase tracking-widest">{title}</p>
    </div>
  );
}
