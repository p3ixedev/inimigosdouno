// ============================================================
// Perfil.jsx - Redesign AAA da tela de perfil
//
// IMPORTANTE: 100% da lógica original foi preservada:
//  - useAuth, useNavigate, fetchMatches
//  - Todo o useMemo de stats (partidas, vitórias, semana,
//    sequência, rivalidades, histórico)
//  - Ações: voltar para Início, sair (logout + navigate)
//  - Estados: matches, loading
//  - Nenhum comportamento, cálculo ou fluxo foi alterado.
//
// Apenas a camada visual (JSX + classes) foi refeita para
// alinhar com a linguagem do Lobby, Sala e Mesa.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown,
  Trophy,
  Flame,
  Swords,
  History,
  LogOut,
  Home,
  Target,
  Sparkles,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLoadingExperience } from '../components/LoadingExperience';
import { fetchMatches } from '../api/matches';
import { PLAYERS, COLOR_STYLES, startOfWeek } from '../data/players';
import UnoChip from '../components/UnoChip';

export default function Perfil() {
  const { user, logout } = useAuth();
  const { withLoading } = useLoadingExperience();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    withLoading(
      () => fetchMatches(),
      {
        tips: [
          'Consultando estatisticas...',
          'Calculando vitorias...',
          'Carregando perfil...',
        ],
      }
    )
      .then(setMatches)
      .finally(() => setLoading(false));
    // Ignora o aviso do ESLint: withLoading nao precisa estar nas dependencias aqui
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const corHex = colorStyle?.hex ?? 'oklch(0.86 0.17 85)';

  const winRate = stats && stats.totalPartidas > 0
    ? Math.round((stats.totalVitorias / stats.totalPartidas) * 100)
    : 0;
  const derrotas = stats ? stats.totalPartidas - stats.totalVitorias : 0;

  // Título/rank simbólico baseado em vitórias - puramente visual, sem efeito no backend
  const rankLabel =
    !stats ? 'Jogador' :
    stats.totalVitorias >= 30 ? 'Lenda da Mesa' :
    stats.totalVitorias >= 15 ? 'Mestre do Baralho' :
    stats.totalVitorias >= 5  ? 'Veterano' :
    stats.totalVitorias >= 1  ? 'Desafiante' :
    'Novato';

  return (
    <div className="uno-bg relative min-h-screen">
      {/* Halos de fundo - mesma linguagem do lobby / mesa */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
          style={{ background: `${corHex}`, opacity: 0.18 }}
        />
        <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.6_0.22_255)]/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[oklch(0.86_0.17_85)]/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        {/* Barra de navegação */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
          >
            <Home className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Início
          </button>
          <button
            onClick={() => { logout(); navigate('/entrar'); }}
            className="group flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-300 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-[oklch(0.63_0.24_27)]/20 hover:text-[oklch(0.82_0.18_27)] hover:ring-[oklch(0.63_0.24_27)]/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </motion.div>

        {/* HERO - avatar em destaque, nome com foil, taxa de vitória */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="uno-card-surface relative mb-6 overflow-hidden rounded-[2rem] px-5 py-8 sm:px-10 sm:py-10"
        >
          {/* Faixa de cor do jogador atrás do avatar */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-30"
            style={{
              background: `radial-gradient(ellipse at center top, ${corHex} 0%, transparent 65%)`,
            }}
          />
          {/* Cartas decorativas de fundo */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-16 rotate-12 rounded-xl border border-white/10 bg-white/[0.02]" />
          <div className="pointer-events-none absolute -right-2 top-4 h-24 w-16 -rotate-6 rounded-xl border border-white/10 bg-white/[0.03]" />

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            {/* Avatar gigante com anel na cor do jogador + glow */}
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-3 rounded-full opacity-70 blur-2xl"
                style={{ background: corHex }}
              />
              <div
                className="relative rounded-[1.6rem] p-1.5 ring-1 ring-white/10"
                style={{
                  background: `linear-gradient(140deg, ${corHex}, oklch(0.24 0.04 265))`,
                  boxShadow:
                    '0 22px 50px -18px rgba(0,0,0,0.65), 0 0 0 1px oklch(1 0 0 / 0.06) inset',
                }}
              >
                <div className="rounded-[1.25rem] bg-[oklch(0.16_0.03_265)] p-3">
                  {user && (
                    <div className="scale-[1.7] transform-gpu p-2 transition-transform duration-500 hover:scale-[1.85] hover:rotate-[-4deg]">
                      <UnoChip color={user.color} label={user.name[0]} />
                    </div>
                  )}
                </div>
              </div>
              {stats && stats.sequencia >= 3 && (
                <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[oklch(0.63_0.24_27)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg ring-2 ring-[oklch(0.16_0.03_265)]">
                  <Flame className="h-3 w-3" /> {stats.sequencia} SEG
                </div>
              )}
            </div>

            {/* Nome + rank + winrate ring */}
            <div className="flex-1 text-center sm:text-left">
              <p className="mb-1 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500 sm:justify-start">
                <Sparkles className="h-3 w-3 text-[oklch(0.86_0.17_85)]" />
                {rankLabel}
              </p>
              <h1
                className="font-display foil-text text-5xl leading-none sm:text-7xl"
                translate="no"
              >
                {user?.name}
              </h1>
              <p className="mt-2 text-xs text-zinc-500">{user?.email}</p>

              {stats && stats.totalPartidas > 0 && (
                <div className="mt-5 flex items-center justify-center gap-4 sm:justify-start">
                  <WinRateRing rate={winRate} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                      Taxa de Vitória
                    </p>
                    <p className="font-display text-3xl leading-none text-white">
                      <span className="font-score">{winRate}</span>
                      <span className="text-xl text-zinc-500">%</span>
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      <span className="font-score text-[oklch(0.86_0.17_85)]">{stats.totalVitorias}V</span>
                      <span className="mx-1.5 text-zinc-600">·</span>
                      <span className="font-score text-zinc-400">{derrotas}D</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-400">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[oklch(0.63_0.24_27)]" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[oklch(0.86_0.17_85)]" style={{ animationDelay: '120ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[oklch(0.68_0.2_152)]" style={{ animationDelay: '240ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[oklch(0.6_0.22_255)]" style={{ animationDelay: '360ms' }} />
            </div>
            <p className="text-xs uppercase tracking-widest">Carregando seus dados</p>
          </div>
        ) : (
          <>
            {/* Grade de estatísticas premium */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
            >
              <StatCard
                icon={<Target className="h-4 w-4" />}
                label="Partidas"
                value={stats.totalPartidas}
                tint="oklch(0.6 0.22 255)"
              />
              <StatCard
                icon={<Trophy className="h-4 w-4" />}
                label="Vitórias"
                value={stats.totalVitorias}
                tint="oklch(0.86 0.17 85)"
                accent
              />
              <StatCard
                icon={<Calendar className="h-4 w-4" />}
                label="Na Semana"
                value={stats.vitoriasSemana}
                tint="oklch(0.68 0.2 152)"
              />
              <StatCard
                icon={<Flame className="h-4 w-4" />}
                label="Sequência"
                value={stats.sequencia}
                tint="oklch(0.63 0.24 27)"
                highlight={stats.sequencia > 0}
              />
            </motion.div>

            {/* Duelos / Rivalidades */}
            {stats.rivalidades.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45 }}
                className="mb-8"
              >
                <SectionTitle
                  icon={<Swords className="h-4 w-4" />}
                  title="Meus Duelos"
                  hint={`${stats.rivalidades.length} rival${stats.rivalidades.length > 1 ? 'es' : ''}`}
                />
                <div className="uno-card-surface rounded-3xl p-4 sm:p-6">
                  <div className="grid gap-3">
                    {stats.rivalidades.map(({ rival, total, minhasVitorias, vitoriasRival }) => {
                      if (!rival) return null;
                      const euLido = minhasVitorias >= vitoriasRival;
                      const rivalStyle = COLOR_STYLES[rival.color];
                      const totalDuel = minhasVitorias + vitoriasRival || 1;
                      const meuPct = (minhasVitorias / totalDuel) * 100;
                      return (
                        <div
                          key={rival.id}
                          className="group relative overflow-hidden rounded-2xl bg-[oklch(0.18_0.03_265)]/70 p-4 ring-1 ring-white/[0.06] transition duration-300 hover:ring-white/[0.12]"
                        >
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            {/* Eu */}
                            <div className="flex items-center gap-3 justify-end text-right">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Você</p>
                                <p
                                  className={`font-display text-4xl leading-none font-score ${
                                    euLido ? 'text-[oklch(0.86_0.17_85)]' : 'text-zinc-500'
                                  }`}
                                >
                                  {minhasVitorias}
                                </p>
                              </div>
                              {user && <UnoChip color={user.color} label={user.name[0]} sm />}
                            </div>

                            {/* Total no meio */}
                            <div className="flex flex-col items-center gap-1 px-1">
                              <div className="rounded-full bg-white/5 p-1.5 ring-1 ring-white/10">
                                <Swords className="h-3.5 w-3.5 text-zinc-400" />
                              </div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                {total} <span className="text-zinc-600">jogos</span>
                              </p>
                            </div>

                            {/* Rival */}
                            <div className="flex items-center gap-3">
                              <UnoChip color={rival.color} label={rival.name[0]} sm />
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500" translate="no">
                                  {rival.name}
                                </p>
                                <p
                                  className={`font-display text-4xl leading-none font-score ${
                                    !euLido ? 'text-[oklch(0.86_0.17_85)]' : 'text-zinc-500'
                                  }`}
                                >
                                  {vitoriasRival}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Barra de domínio */}
                          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full transition-[width] duration-700"
                              style={{
                                width: `${meuPct}%`,
                                background: colorStyle?.hex ?? 'oklch(0.86 0.17 85)',
                              }}
                            />
                            <div
                              className="h-full transition-[width] duration-700"
                              style={{
                                width: `${100 - meuPct}%`,
                                background: rivalStyle?.hex ?? 'oklch(0.4 0.02 265)',
                                opacity: 0.75,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Timeline de histórico */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
            >
              <SectionTitle
                icon={<History className="h-4 w-4" />}
                title="Últimas Partidas"
                hint={stats.historico.length > 0 ? `${stats.historico.length} recentes` : null}
              />
              <div className="uno-card-surface rounded-3xl p-4 sm:p-6">
                {stats.historico.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="rounded-full bg-white/5 p-4 ring-1 ring-white/10">
                      <TrendingUp className="h-5 w-5 text-zinc-500" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-300">Nenhuma partida ainda</p>
                    <p className="text-xs text-zinc-500">Bora jogar uma?</p>
                  </div>
                ) : (
                  <ol className="relative space-y-2">
                    {/* Linha vertical da timeline */}
                    <span className="pointer-events-none absolute left-[22px] top-4 bottom-4 w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
                    {stats.historico.map((m, idx) => {
                      const ganhei = m.winners.includes(user?.id);
                      const oponentes = m.played
                        .filter((id) => id !== user?.id)
                        .map((id) => pById(id))
                        .filter(Boolean);
                      const data = new Date(m.ts);
                      const hoje = new Date();
                      const isHoje = data.toDateString() === hoje.toDateString();
                      return (
                        <motion.li
                          key={m.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + idx * 0.04 }}
                          className="relative flex items-center gap-4 rounded-2xl bg-[oklch(0.18_0.03_265)]/70 p-3 pl-4 ring-1 ring-white/[0.06] transition duration-300 hover:bg-[oklch(0.2_0.035_265)]/80 hover:ring-white/[0.12]"
                        >
                          {/* Nó da timeline */}
                          <div
                            className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-2 ${
                              ganhei
                                ? 'bg-[oklch(0.86_0.17_85)]/15 ring-[oklch(0.86_0.17_85)]/50'
                                : 'bg-white/5 ring-white/10'
                            }`}
                          >
                            {ganhei ? (
                              <Crown className="h-4 w-4 text-[oklch(0.86_0.17_85)]" />
                            ) : (
                              <span className="text-xs font-black text-zinc-500">L</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-xs font-black uppercase tracking-widest ${
                                  ganhei ? 'text-[oklch(0.86_0.17_85)]' : 'text-zinc-400'
                                }`}
                              >
                                {ganhei ? 'Vitória' : 'Derrota'}
                              </p>
                              {isHoje && (
                                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-300">
                                  hoje
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              {oponentes.slice(0, 4).map((op) => (
                                <span
                                  key={op.id}
                                  className={`h-4 w-4 rounded-full ring-1 ring-black/40 ${COLOR_STYLES[op.color].bg}`}
                                  title={op.name}
                                />
                              ))}
                              <p className="ml-1 truncate text-[11px] text-zinc-500" translate="no">
                                vs {oponentes.map((o) => o.name).join(', ')}
                              </p>
                            </div>
                          </div>

                          {/* Data */}
                          <div className="shrink-0 text-right">
                            <p className="font-score text-[11px] font-semibold text-zinc-300">
                              {data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="font-score text-[10px] text-zinc-500">
                              {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </motion.section>
          </>
        )}
      </main>
    </div>
  );
}

// ------------------------------------------------------------
// Card premium de estatística
// ------------------------------------------------------------
function StatCard({ icon, label, value, tint, highlight, accent }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      className={`uno-card-surface group relative overflow-hidden rounded-2xl p-4 sm:p-5 ${
        highlight ? 'ring-1 ring-[oklch(0.63_0.24_27)]/50' : ''
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30 transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: tint }}
      />
      <div
        className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-white/10"
        style={{
          background: `linear-gradient(140deg, ${tint}22, oklch(0.22 0.035 265) 80%)`,
          color: tint,
        }}
      >
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p
        className={`mt-0.5 font-display font-score text-4xl leading-none sm:text-5xl ${
          accent ? 'text-[oklch(0.86_0.17_85)]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </motion.div>
  );
}

// ------------------------------------------------------------
// Título de seção
// ------------------------------------------------------------
function SectionTitle({ icon, title, hint }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <div className="flex items-center gap-2 text-zinc-300">
        <span className="text-[oklch(0.86_0.17_85)]">{icon}</span>
        <p className="text-[11px] font-black uppercase tracking-[0.22em]">{title}</p>
      </div>
      {hint && (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Ring circular de taxa de vitória
// ------------------------------------------------------------
function WinRateRing({ rate }) {
  const size = 68;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (rate / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-white/10"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          stroke="url(#winRateGradient)"
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ strokeDasharray: c }}
        />
        <defs>
          <linearGradient id="winRateGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.86 0.17 85)" />
            <stop offset="100%" stopColor="oklch(0.72 0.21 27)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Crown className="h-5 w-5 text-[oklch(0.86_0.17_85)]" />
      </div>
    </div>
  );
}
