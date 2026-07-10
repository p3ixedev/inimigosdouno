import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, PROFILES } from '../context/AuthContext';
import UnoChip from '../components/UnoChip';
import { ChevronRight, Zap } from 'lucide-react';

const PLAYER_COLORS = {
  red:    { hex: '#dc3730', glow: 'rgba(220,55,48,0.5)',  label: 'Vermelho', dark: 'rgba(220,55,48,0.12)' },
  blue:   { hex: '#3b82f6', glow: 'rgba(59,130,246,0.5)', label: 'Azul',    dark: 'rgba(59,130,246,0.12)' },
  green:  { hex: '#22c55e', glow: 'rgba(34,197,94,0.5)',  label: 'Verde',   dark: 'rgba(34,197,94,0.12)'  },
  yellow: { hex: '#f59e0b', glow: 'rgba(245,158,11,0.5)', label: 'Amarelo', dark: 'rgba(245,158,11,0.12)' },
  white:  { hex: '#c8ccd8', glow: 'rgba(200,204,216,0.4)',label: 'Branco',  dark: 'rgba(200,204,216,0.08)'},
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } },
};
const itemVariants = {
  hidden:  { opacity: 0, x: -32, scale: 0.94 },
  visible: { opacity: 1, x: 0,   scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

export default function EscolherPerfil() {
  const { escolherPerfil } = useAuth();
  const navigate = useNavigate();

  function entrar(profile) {
    escolherPerfil(profile);
    navigate('/');
  }

  return (
    <div className="uno-bg relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">

      {/* Grid pattern overlay */}
      <div className="pointer-events-none fixed inset-0 grid-pattern z-0 opacity-100" aria-hidden="true" />

      {/* Large ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-64 -right-64 w-[680px] h-[680px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,55,48,0.14) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-64 -left-64 w-[680px] h-[680px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 65%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* ── LOGO HEADER ── */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.05 }}
            className="inline-block mb-6"
          >
            <div className="relative">
              {/* Glow behind logo */}
              <div className="absolute inset-0 rounded-3xl blur-2xl scale-150"
                style={{ background: 'rgba(220,55,48,0.5)' }} />
              {/* Logo card */}
              <div
                className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #dc3730 0%, #8b1515 100%)',
                  boxShadow: '0 12px 40px -8px rgba(220,55,48,0.8), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -3px 0 rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {/* Inner oval */}
                <div className="absolute inset-[18%] rounded-[50%_/_58%] rotate-[-20deg]"
                  style={{ background: 'rgba(255,255,255,0.18)' }} />
                <span className="relative font-display text-white text-4xl tracking-wider z-10">UNO</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
          >
            <h1 className="font-display text-gradient-uno leading-none mb-1"
              style={{ fontSize: 'clamp(2.8rem, 10vw, 4.5rem)' }}>
              Inimigos do Uno
            </h1>
            <p className="text-sm font-medium tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: '0.3em' }}>
              Selecione seu perfil
            </p>
          </motion.div>
        </div>

        {/* ── PROFILE LIST ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {PROFILES.map((profile) => {
            const colorData = PLAYER_COLORS[profile.color] || PLAYER_COLORS.red;
            return (
              <motion.button
                key={profile.id}
                variants={itemVariants}
                whileHover={{ x: 8, scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => entrar(profile)}
                className="group w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200 cursor-pointer relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 20px -6px rgba(0,0,0,0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${colorData.dark}, rgba(255,255,255,0.02))`;
                  e.currentTarget.style.border = `1px solid ${colorData.hex}55`;
                  e.currentTarget.style.boxShadow = `0 8px 32px -8px ${colorData.glow}, 0 0 0 1px ${colorData.hex}28`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))';
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                  e.currentTarget.style.boxShadow = '0 4px 20px -6px rgba(0,0,0,0.5)';
                }}
              >
                {/* Left color accent */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: colorData.hex }} />

                <UnoChip color={profile.color} label={profile.name[0]} sm />

                <div className="flex-1 min-w-0">
                  <p className="font-display text-[1.75rem] leading-none text-white" translate="no">
                    {profile.name}
                  </p>
                  <p className="text-xs mt-0.5 font-semibold tracking-wider uppercase"
                    style={{ color: colorData.hex }}>
                    {colorData.label}
                  </p>
                </div>

                {/* Hover arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  className="flex items-center justify-center w-8 h-8 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{ background: `${colorData.hex}22` }}
                >
                  <ChevronRight className="h-4 w-4" style={{ color: colorData.hex }} />
                </motion.div>

                {/* Color indicator dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 group-hover:scale-125"
                  style={{
                    background: colorData.hex,
                    boxShadow: `0 0 10px ${colorData.hex}`,
                  }}
                />
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex items-center justify-center gap-3 text-xs"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Desenvolvido por <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>Peixe</span></span>
          <Zap className="h-3.5 w-3.5" />
        </motion.div>
      </motion.div>
    </div>
  );
}
