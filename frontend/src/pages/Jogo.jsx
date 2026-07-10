import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PLAYERS } from '../data/players';
import UnoChip from '../components/UnoChip';
import { LogOut, Plus, ArrowRight, Home, Gamepad2, Hash, Users } from 'lucide-react';

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

export default function Jogo() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('criar');

  const playerData = PLAYERS.find((p) => p.id === user?.id);

  async function criarSala() {
    setErro('');
    setLoading(true);
    try {
      const { codigo: cod } = await apiCriar(user.id, user.name);
      navigate(`/jogo/${cod}`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function entrarSala() {
    if (codigo.trim().length < 4) return setErro('Código inválido');
    setErro('');
    setLoading(true);
    try {
      await apiEntrar(codigo.trim().toUpperCase(), user.id, user.name);
      navigate(`/jogo/${codigo.trim().toUpperCase()}`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="uno-bg relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,55,48,0.15) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Top navigation */}
        <div className="mb-6 flex items-center justify-between">
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

        {/* Player card */}
        <div
          className="rounded-2xl px-5 py-4 mb-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4)',
          }}
        >
          {playerData && <UnoChip color={playerData.color} label={user.name[0]} sm />}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Jogando como</p>
            <p className="font-display text-2xl leading-none" translate="no">{user?.name}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
            <span className="status-online h-1.5 w-1.5 rounded-full flex-shrink-0" />
            Online
          </div>
        </div>

        {/* Main card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 24px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          {/* Tab switcher */}
          <div className="flex p-2 gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { id: 'criar',  label: 'Criar sala',      icon: <Plus className="h-3.5 w-3.5" /> },
              { id: 'entrar', label: 'Entrar em sala',   icon: <ArrowRight className="h-3.5 w-3.5" /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setAba(t.id); setErro(''); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200"
                style={
                  aba === t.id
                    ? {
                        background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                        color: 'white',
                        boxShadow: '0 4px 16px -4px rgba(220,55,48,0.5)',
                      }
                    : {
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.45)',
                      }
                }
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {aba === 'criar' ? (
                <motion.div
                  key="criar"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-start gap-3 mb-5 p-3.5 rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Gamepad2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Cria uma nova sala e manda o código pros amigos entrarem.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={criarSala}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                      boxShadow: loading ? 'none' : '0 8px 24px -8px rgba(220,55,48,0.6)',
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {loading ? 'Criando...' : 'Criar Nova Sala'}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="entrar"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-start gap-3 mb-5 p-3.5 rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Hash className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Digite o código de 4 caracteres da sala.
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
                      className="w-full rounded-xl px-4 py-4 text-center text-3xl font-display tracking-[0.6em] text-white placeholder:text-muted-foreground/30 outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: codigo.length === 4
                          ? '2px solid #dc3730'
                          : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: codigo.length === 4 ? '0 0 20px -4px rgba(220,55,48,0.4)' : 'none',
                        letterSpacing: '0.6em',
                      }}
                    />
                    {codigo.length === 4 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: '#22c55e' }}
                      >
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={entrarSala}
                    disabled={loading || codigo.length < 4}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                      boxShadow: loading || codigo.length < 4 ? 'none' : '0 8px 24px -8px rgba(220,55,48,0.6)',
                    }}
                  >
                    <Users className="h-4 w-4" />
                    {loading ? 'Entrando...' : 'Entrar na Sala'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {erro && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 rounded-xl px-4 py-3 text-sm text-center"
                  style={{ background: 'rgba(220,55,48,0.12)', color: '#fca5a5', border: '1px solid rgba(220,55,48,0.25)' }}
                >
                  {erro}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          Desenvolvido por <span className="font-semibold text-muted-foreground">Peixe</span>
        </p>
      </motion.div>
    </div>
  );
}
