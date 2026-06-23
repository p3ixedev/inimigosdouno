import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const ok = login(email.trim(), senha);
    if (ok) {
      navigate('/');
    } else {
      setErro('Email ou senha incorretos.');
    }
    setLoading(false);
  };

  return (
    <div className="uno-bg relative min-h-screen flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[oklch(0.63_0.24_27)]/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.6_0.22_255)]/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[oklch(0.63_0.24_27)] shadow-[0_8px_30px_-8px_oklch(0.63_0.24_27)]">
            <span className="font-display text-2xl text-white">UNO</span>
          </div>
          <h1 className="font-display text-4xl text-white">Inimigos do Uno</h1>
          <p className="mt-1 text-sm text-zinc-400">Entra pra ver seu painel</p>
        </div>

        <div className="uno-card-surface rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@uno.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-[oklch(0.22_0.035_265)]/60 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[oklch(0.63_0.24_27)] focus:ring-1 focus:ring-[oklch(0.63_0.24_27)] transition [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-[oklch(0.22_0.035_265)]/60 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[oklch(0.63_0.24_27)] focus:ring-1 focus:ring-[oklch(0.63_0.24_27)] transition [color-scheme:dark]"
              />
            </div>

            {erro && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-[oklch(0.63_0.24_27)]/15 px-4 py-2.5 text-sm text-[oklch(0.85_0.18_27)]"
              >
                {erro}
              </motion.p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[oklch(0.63_0.24_27)] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_-8px_oklch(0.63_0.24_27/0.8)] transition hover:bg-[oklch(0.68_0.24_27)] disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Desenvolvido por <span className="text-zinc-300 font-semibold">Peixe</span>
        </p>
      </motion.div>
    </div>
  );
}
