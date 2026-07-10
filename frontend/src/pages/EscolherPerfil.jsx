import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, PROFILES } from '../context/AuthContext';
import { COLOR_STYLES } from '../data/players';
import UnoChip from '../components/UnoChip';
import { ChevronRight } from 'lucide-react';

const PLAYER_COLORS = {
  red:    { hex: '#dc3730', glow: 'rgba(220,55,48,0.35)', label: 'Vermelho' },
  blue:   { hex: '#3b82f6', glow: 'rgba(59,130,246,0.35)', label: 'Azul' },
  green:  { hex: '#22c55e', glow: 'rgba(34,197,94,0.35)',  label: 'Verde' },
  yellow: { hex: '#f59e0b', glow: 'rgba(245,158,11,0.35)', label: 'Amarelo' },
  white:  { hex: '#e2e8f0', glow: 'rgba(226,232,240,0.25)', label: 'Branco' },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden:  { opacity: 0, x: -24, scale: 0.96 },
  visible: { opacity: 1, x: 0,   scale: 1, transition: { type: 'spring', stiffness: 180, damping: 20 } },
};

export default function EscolherPerfil() {
  const { escolherPerfil } = useAuth();
  const navigate = useNavigate();

  function entrar(profile) {
    escolherPerfil(profile);
    navigate('/');
  }

  return (
    <div className="uno-bg relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">

      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,55,48,0.18) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Decorative grid lines */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]" aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/header */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
            className="mb-6 inline-flex"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl"
                style={{ background: 'rgba(220,55,48,0.5)', transform: 'scale(1.3)' }} />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #dc3730, #b91c1c)',
                  boxShadow: '0 8px 32px -8px rgba(220,55,48,0.8), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}>
                <span className="font-display text-3xl text-white tracking-wider">UNO</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-display text-5xl sm:text-6xl text-gradient-uno leading-none mb-2">
              Inimigos do Uno
            </h1>
            <p className="text-sm text-muted-foreground font-medium tracking-wide">
              Selecione seu perfil para continuar
            </p>
          </motion.div>
        </div>

        {/* Profile list */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          {PROFILES.map((profile) => {
            const colorData = PLAYER_COLORS[profile.color] || PLAYER_COLORS.red;
            return (
              <motion.button
                key={profile.id}
                variants={itemVariants}
                whileHover={{ x: 6, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => entrar(profile)}
                className="group w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 16px -4px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = `1px solid ${colorData.hex}55`;
                  e.currentTarget.style.boxShadow = `0 4px 24px -4px ${colorData.glow}, 0 0 0 1px ${colorData.hex}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                  e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0,0,0,0.4)';
                }}
              >
                {/* Avatar chip */}
                <UnoChip color={profile.color} label={profile.name[0]} sm />

                {/* Name & color */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-2xl leading-none text-foreground" translate="no">
                    {profile.name}
                  </p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: colorData.hex }}>
                    {colorData.label}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                  style={{ background: `${colorData.hex}22` }}>
                  <ChevronRight className="h-4 w-4" style={{ color: colorData.hex }} />
                </div>

                {/* Color dot */}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform"
                  style={{
                    background: colorData.hex,
                    boxShadow: `0 0 8px ${colorData.hex}`,
                  }} />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-center text-xs text-muted-foreground"
        >
          Desenvolvido por{' '}
          <span className="font-semibold text-foreground">Peixe</span>
        </motion.p>
      </motion.div>
    </div>
  );
}
