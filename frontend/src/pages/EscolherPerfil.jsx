import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, PROFILES } from '../context/AuthContext';
import { COLOR_STYLES } from '../data/players';
import UnoChip from '../components/UnoChip';

export default function EscolherPerfil() {
  const { escolherPerfil } = useAuth();
  const navigate = useNavigate();

  function entrar(profile) {
    escolherPerfil(profile);
    navigate('/');
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
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[oklch(0.63_0.24_27)] shadow-[0_8px_30px_-8px_oklch(0.63_0.24_27)]">
            <span className="font-display text-2xl text-white">UNO</span>
          </div>
          <h1 className="font-display text-4xl text-white">Inimigos do Uno</h1>
          <p className="mt-1 text-sm text-zinc-400">Quem é você?</p>
        </div>

        {/* Perfis */}
        <div className="space-y-3">
          {PROFILES.map((profile, i) => {
            const c = COLOR_STYLES[profile.color];
            return (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => entrar(profile)}
                className="w-full flex items-center gap-4 uno-card-surface rounded-2xl px-5 py-4 transition hover:ring-1 hover:ring-white/20 text-left"
              >
                <UnoChip color={profile.color} label={profile.name[0]} sm />
                <div className="flex-1">
                  <p className="font-display text-2xl leading-none" translate="no">
                    {profile.name}
                  </p>
                </div>
                <div className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              </motion.button>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Desenvolvido por <span className="text-zinc-300 font-semibold">Peixe</span>
        </p>
      </motion.div>
    </div>
  );
}
