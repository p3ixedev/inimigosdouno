import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PLAYERS } from '../data/players';
import UnoChip from '../components/UnoChip';
import { LogOut, Plus, ArrowRight, Home, Gamepad2, Hash, Users, ChevronLeft } from 'lucide-react';

async function apiCriar(criadorId, criadorNome) {
  const res = await fetch('/api/jogo/criar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ criadorId, criadorNome }),
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

const PLAYER_HEX = {
  red: '#dc3730', blue: '#3b82f6', green: '#22c55e',
  yellow: '#f59e0b', white: '#c8ccd8',
};

export default function Jogo() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('criar');

  const playerData = PLAYERS.find((p) => p.id === user?.id);
  const playerHex = playerData ? (PLAYER_HEX[playerData.color] || '#dc3730') : '#dc3730';

  async function criarSala() {
    setErro(''); setLoading(true);
    try {
      const { codigo: cod } = await apiCriar(user.id, user.name);
      navigate(`/jogo/${cod}`);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  }

  async function entrarSala() {
    if (codigo.trim().length < 4) return setErro('Código inválido');
    setErro(''); setLoading(true);
    try {
      await apiEntrar(codigo.trim().toUpperCase(), user.id, user.name);
      navigate(`/jogo/${codigo.trim().toUpperCase()}`);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="uno-bg relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">

      {/* Grid pattern */}
      <div className="pointer-events-none fixed inset-0 grid-pattern opacity-100 z-0" aria-hidden="true" />

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,55,48,0.14) 0%, transparent 60%)' }} />
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 60%)' }} />
        {/* Player color glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(circle, ${playerHex}10 0%, transparent 60%)` }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* ── NAV ── */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:text-white"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <ChevronLeft className="h-4 w-4" />
            Início
          </button>
          <button onClick={() => { logout(); navigate('/entrar'); }}
            className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:text-red-400"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>

        {/* ── PLAYER CARD ── */}
        <div className="rounded-2xl px-5 py-4 mb-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)',
            border: `1px solid ${playerHex}30`,
            boxShadow: `0 8px 32px -8px ${playerHex}20, inset 0 1px 0 rgba(255,255,255,0.07)`,
          }}>
          {/* Left accent */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
            style={{ background: playerHex, boxShadow: `0 0 8px ${playerHex}` }} />
          {playerData && <UnoChip color={playerData.color} label={user.name[0]} sm />}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] mb-0.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}>Jogando como</p>
            <p className="font-display text-2xl leading-none text-white" translate="no">{user?.name}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
            <span className="status-online w-1.5 h-1.5 rounded-full flex-shrink-0" />
            Online
          </div>
        </div>

        {/* ── MAIN CARD ── */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 32px 80px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}>

          {/* Top accent */}
          <div className="h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(220,55,48,0.7), rgba(59,130,246,0.4), transparent)' }} />

          {/* Tab switcher */}
          <div className="flex p-2 gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { id: 'criar',  label: 'Nova Sala',    icon: <Plus className="h-3.5 w-3.5" /> },
              { id: 'entrar', label: 'Entrar em Sala', icon: <ArrowRight className="h-3.5 w-3.5" /> },
            ].map((t) => (
              <button key={t.id}
                onClick={() => { setAba(t.id); setErro(''); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold transition-all duration-200"
                style={
                  aba === t.id
                    ? {
                        background: 'linear-gradient(135deg, #dc3730, #a81c1c)',
                        color: 'white',
                        boxShadow: '0 4px 20px -4px rgba(220,55,48,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
                      }
                    : {
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.38)',
                      }
                }>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {aba === 'criar' ? (
                <motion.div key="criar"
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}
                  transition={{ duration: 0.18 }}>
                  <div className="flex items-start gap-3 mb-5 p-4 rounded-2xl"
                    style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Gamepad2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Cria uma nova sala e manda o código pros amigos entrarem. Você controla o início do jogo.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={criarSala}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2.5 py-3.5 text-sm uppercase tracking-wider rounded-2xl"
                  >
                    <Plus className="h-4 w-4" />
                    {loading ? 'Criando...' : 'Criar Nova Sala'}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="entrar"
                  initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.18 }}>
                  <div className="flex items-start gap-3 mb-5 p-4 rounded-2xl"
                    style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Hash className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Digite o código de 4 caracteres da sala que você recebeu.
                    </p>
                  </div>

                  {/* Code input */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && entrarSala()}
                      placeholder="_ _ _ _"
                      maxLength={4}
                      className="w-full rounded-2xl px-4 py-4 text-center text-4xl font-display text-white placeholder:text-white/20 outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: codigo.length === 4
                          ? '2px solid rgba(220,55,48,0.7)'
                          : '1px solid rgba(255,255,255,0.09)',
                        boxShadow: codigo.length === 4 ? '0 0 28px -6px rgba(220,55,48,0.45)' : 'none',
                        letterSpacing: '0.7em',
                      }}
                    />
                    <AnimatePresence>
                      {codigo.length === 4 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.6)' }}>
                          <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={entrarSala}
                    disabled={loading || codigo.length < 4}
                    className="btn-primary w-full flex items-center justify-center gap-2.5 py-3.5 text-sm uppercase tracking-wider rounded-2xl"
                  >
                    <Users className="h-4 w-4" />
                    {loading ? 'Entrando...' : 'Entrar na Sala'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {erro && (
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-3 rounded-2xl px-4 py-3 text-sm text-center"
                  style={{ background: 'rgba(220,55,48,0.1)', color: '#fca5a5', border: '1px solid rgba(220,55,48,0.25)' }}>
                  {erro}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Desenvolvido por{' '}
          <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Peixe</span>
        </p>
      </motion.div>
    </div>
  );
}
