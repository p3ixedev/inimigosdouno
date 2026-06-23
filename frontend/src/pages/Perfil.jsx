import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Trophy, Flame, Swords, History, LogOut, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMatches } from '../api/matches';
import { PLAYERS, COLOR_STYLES, startOfWeek } from '../data/players';
import UnoChip from '../components/UnoChip';

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

    // sequência atual
    const sorted = [...matches].sort((a, b) => b.ts - a.ts);
    let sequencia = 0;
    for (const m of sorted) {
      if (!m.played.includes(id)) continue;
      if (m.winners.includes(id)) sequencia++;
      else break;
    }

    // rivalidades pessoais
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
      rivalidades,
      historico: minhasPartidas.sort((a, b) => b.ts - a.ts).slice(0, 10),
    };
  }, [matches, user]);

  const pById = (id) => PLAYERS.find((p) => p.id === id);
  const colorStyle = user ? COLOR_STYLES[user.color] : null;

  return (
    <div className="uno-bg relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[oklch(0.63_0.24_27)]/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.6_0.22_255)]/25 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-2xl px-3 pb-16 pt-6 sm:px-4 sm:pt-10">
        {/* Header do perfil */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="uno-card-surface mb-6 rounded-3xl px-5 py-6 sm:px-8 sm:py-8"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
            >
              <Home className="h-3.5 w-3.5" />
              Início
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[oklch(0.78_0.2_27)] transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>

          <div className="flex items-center gap-4">
            {user && <UnoChip color={user.color} label={user.name[0]} />}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Meu Perfil</p>
              <h1 className="font-display text-4xl sm:text-5xl" translate="no">{user?.name}</h1>
              <p className="text-xs text-zinc-500 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400">
            <p className="animate-pulse">Carregando seus dados...</p>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <StatCard label="Partidas" value={stats.totalPartidas} />
              <StatCard label="Vitórias" value={stats.totalVitorias} icon={<Trophy className="h-4 w-4 text-[oklch(0.86_0.17_85)]" />} />
              <StatCard label="Semana" value={stats.vitoriasSemana} icon={<Crown className="h-4 w-4 text-[oklch(0.86_0.17_85)]" />} />
              <StatCard label="Sequência" value={stats.sequencia} icon={<Flame className="h-4 w-4 text-[oklch(0.63_0.24_27)]" />} highlight={stats.sequencia > 0} />
            </motion.div>

            {/* Rivalidades */}
            {stats.rivalidades.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <SectionTitle icon={<Swords className="h-4 w-4" />} title="Meus Duelos" />
                <div className="uno-card-surface rounded-2xl p-4 sm:p-5 space-y-3">
                  {stats.rivalidades.map(({ rival, total, minhasVitorias, vitoriasRival }) => {
                    if (!rival) return null;
                    const euLido = minhasVitorias >= vitoriasRival;
                    return (
                      <div key={rival.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-[oklch(0.22_0.035_265)]/60 p-3 ring-1 ring-white/5">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="text-right">
                            <p className="text-xs font-semibold" translate="no">{user?.name}</p>
                            <p className={`text-2xl font-bold ${euLido ? 'text-[oklch(0.86_0.17_85)]' : 'text-zinc-500'}`}>{minhasVitorias}</p>
                          </div>
                          <UnoChip color={user?.color} label={user?.name[0]} sm />
                        </div>
                        <div className="text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                          <Swords className="mx-auto h-4 w-4 mb-0.5" />
                          {total}
                        </div>
                        <div className="flex items-center gap-2">
                          <UnoChip color={rival.color} label={rival.name[0]} sm />
                          <div>
                            <p className="text-xs font-semibold" translate="no">{rival.name}</p>
                            <p className={`text-2xl font-bold ${!euLido ? 'text-[oklch(0.86_0.17_85)]' : 'text-zinc-500'}`}>{vitoriasRival}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Histórico */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SectionTitle icon={<History className="h-4 w-4" />} title="Minhas Partidas" />
              <div className="uno-card-surface rounded-2xl p-4 sm:p-5">
                {stats.historico.length === 0 ? (
                  <p className="text-center py-8 text-zinc-400 text-sm">Nenhuma partida ainda!</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.historico.map((m) => {
                      const ganhei = m.winners.includes(user?.id);
                      return (
                        <li key={m.id} className="flex items-center justify-between rounded-xl bg-[oklch(0.22_0.035_265)]/60 px-4 py-3 ring-1 ring-white/5">
                          <div className="flex items-center gap-3">
                            <span className={`text-lg ${ganhei ? '' : 'grayscale opacity-40'}`}>
                              {ganhei ? '🏆' : '💀'}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-zinc-200">
                                {ganhei ? 'Vitória' : 'Derrota'}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {m.played.map((id) => pById(id)?.name).join(', ')}
                              </p>
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-500 text-right">
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

function StatCard({ label, value, icon, highlight }) {
  return (
    <div className={`uno-card-surface rounded-2xl p-4 ${highlight ? 'ring-1 ring-[oklch(0.63_0.24_27)]/50' : ''}`}>
      <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-zinc-400">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-zinc-400">
      {icon}
      <p className="text-xs font-semibold uppercase tracking-widest">{title}</p>
    </div>
  );
}
