import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { COLOR_STYLES, PLAYERS } from '../data/players';
import UnoChip from '../components/UnoChip';
import { LogOut, Plus, ArrowRight, Home } from 'lucide-react';

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
  const [aba, setAba] = useState('criar'); // criar | entrar

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
    <div className="uno-bg relative min-h-screen flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[oklch(0.63_0.24_27)]/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.6_0.22_255)]/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
          >
            <Home className="h-3.5 w-3.5" />
            Início
          </button>
          <button
            onClick={() => { logout(); navigate('/entrar'); }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[oklch(0.78_0.2_27)] transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>

        {/* Perfil do jogador */}
        <div className="uno-card-surface rounded-3xl p-5 mb-4 flex items-center gap-4">
          {playerData && <UnoChip color={playerData.color} label={user.name[0]} sm />}
          <div>
            <p className="text-xs text-zinc-400">Jogando como</p>
            <p className="font-display text-2xl" translate="no">{user?.name}</p>
          </div>
        </div>

        {/* Abas */}
        <div className="uno-card-surface rounded-3xl p-5">
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setAba('criar')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                aba === 'criar'
                  ? 'bg-[oklch(0.63_0.24_27)] text-white'
                  : 'bg-[oklch(0.22_0.035_265)]/60 text-zinc-400 hover:text-white'
              }`}
            >
              Criar sala
            </button>
            <button
              onClick={() => setAba('entrar')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                aba === 'entrar'
                  ? 'bg-[oklch(0.63_0.24_27)] text-white'
                  : 'bg-[oklch(0.22_0.035_265)]/60 text-zinc-400 hover:text-white'
              }`}
            >
              Entrar numa sala
            </button>
          </div>

          {aba === 'criar' ? (
            <div>
              <p className="text-sm text-zinc-400 mb-4">
                Cria uma nova sala e manda o código pros amigos entrarem.
              </p>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={criarSala}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[oklch(0.63_0.24_27)] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_-8px_oklch(0.63_0.24_27/0.8)] transition hover:bg-[oklch(0.68_0.24_27)] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {loading ? 'Criando...' : 'Criar sala'}
              </motion.button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-zinc-400 mb-4">
                Digite o código de 4 letras da sala.
              </p>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="EX: AB3C"
                maxLength={4}
                className="w-full rounded-xl border border-white/10 bg-[oklch(0.22_0.035_265)]/60 px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-white placeholder:text-zinc-600 outline-none focus:border-[oklch(0.63_0.24_27)] transition [color-scheme:dark] mb-4"
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={entrarSala}
                disabled={loading || codigo.length < 4}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[oklch(0.63_0.24_27)] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_-8px_oklch(0.63_0.24_27/0.8)] transition hover:bg-[oklch(0.68_0.24_27)] disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" />
                {loading ? 'Entrando...' : 'Entrar'}
              </motion.button>
            </div>
          )}

          {erro && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 rounded-xl bg-[oklch(0.63_0.24_27)]/15 px-4 py-2.5 text-sm text-[oklch(0.85_0.18_27)]"
            >
              {erro}
            </motion.p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Desenvolvido por <span className="text-zinc-300 font-semibold">Peixe</span>
        </p>
      </motion.div>
    </div>
  );
}
