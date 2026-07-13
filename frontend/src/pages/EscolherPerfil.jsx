import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, PROFILES } from '../context/AuthContext';
import { useLoadingExperience } from '../components/LoadingExperience';
import { COLOR_STYLES } from '../data/players';
import UnoChip from '../components/UnoChip';
import { ChevronRight } from 'lucide-react';

// Valores OKLCH crus (sem o wrapper oklch()) para poder compor alpha dinamicamente por perfil
const ACCENT = {
  vermelho: '0.63 0.24 27',
  azul: '0.6 0.22 255',
  verde: '0.68 0.2 152',
  amarelo: '0.85 0.18 90',
};

const EASE_PREMIUM = [0.16, 1, 0.3, 1];

export default function EscolherPerfil() {
  const { escolherPerfil } = useAuth();
  const navigate = useNavigate();
  const { withLoading } = useLoadingExperience();

  async function entrar(profile) {
    await withLoading(
      async () => {
        escolherPerfil(profile);

        // Pequena pausa para a animação ficar natural
        await new Promise(resolve => setTimeout(resolve, 300));

        navigate('/');
      },
      {
        title: 'INIMIGOS DO UNO',
        tips: [
          'Embaralhando as cartas...',
          'Preparando a mesa...',
          'Chamando os jogadores...',
          'Preparando sua próxima vitória...',
        ],
      }
    );
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: 'radial-gradient(ellipse 140% 85% at 50% -8%, oklch(0.2 0.015 264) 0%, oklch(0.08 0.008 264) 55%, oklch(0.035 0.004 264) 100%)' }}
    >
      {/* Mesa desfocada ao fundo - sugestao de feltro/madeira escura vista de cima */}
      <div
        className="pointer-events-none absolute left-1/2 top-[56%] h-[70%] w-[135%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-3xl"
        style={{ background: 'radial-gradient(ellipse, oklch(0.17 0.025 145 / 0.55) 0%, transparent 70%)' }}
      />

      {/* Cartas atmosfericas */}
      <div
        className="pointer-events-none absolute -left-12 top-[12%] hidden h-40 w-28 rotate-[-16deg] rounded-2xl opacity-[0.055] blur-md sm:block"
        style={{ background: `linear-gradient(150deg, oklch(${ACCENT.vermelho}) 0%, oklch(0.3 0.12 27) 100%)` }}
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-[10%] hidden h-36 w-24 rotate-[14deg] rounded-2xl opacity-[0.05] blur-md sm:block"
        style={{ background: `linear-gradient(150deg, oklch(${ACCENT.azul}) 0%, oklch(0.28 0.1 255) 100%)` }}
      />

      {/* Vinheta */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 42%, transparent 40%, oklch(0.02 0 0 / 0.7) 100%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: EASE_PREMIUM }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.03] px-7 py-9 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:px-10 sm:py-11">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[oklch(0.63_0.24_27)]/10 blur-3xl" />

          <div className="relative mb-9 text-center sm:mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 170, damping: 15 }}
              className="relative mx-auto mb-6 flex h-16 w-14 items-center justify-center rounded-xl border border-white/20"
              style={{
                background: `linear-gradient(150deg, oklch(0.68 0.23 27) 0%, oklch(0.46 0.21 27) 100%)`,
                boxShadow: '0 16px 36px -12px oklch(0.63 0.24 27 / 0.6)',
              }}
            >
              <div
                className="absolute inset-[16%] opacity-35"
                style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '50% / 60%', transform: 'rotate(-20deg)' }}
              />
              <span className="relative font-display text-2xl text-white">U</span>
            </motion.div>

            <p className="mb-2 flex items-center justify-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.45em] text-zinc-500">
              <span className="h-px w-4 bg-white/15" />
              Bem-vindo
              <span className="h-px w-4 bg-white/15" />
            </p>

            <h1 className="font-display text-4xl leading-none sm:text-[2.75rem]">
              <span className="foil-text">Inimigos do Uno</span>
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Escolha seu perfil para entrar
            </p>
          </div>

          <div className="relative space-y-2.5">
            {PROFILES.map((profile, i) => {
              const c = COLOR_STYLES[profile.color];
              const accent = ACCENT[profile.color];

              return (
                <motion.button
                  key={profile.id}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07, duration: 0.5, ease: EASE_PREMIUM }}
                  whileHover={{ x: 4, scale: 1.012 }}
                  whileTap={{ scale: 0.975 }}
                  onClick={() => entrar(profile)}
                  className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.02] px-5 py-4 text-left transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_14px_38px_-12px_var(--accent-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.86_0.17_85)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  style={{ '--accent-shadow': `oklch(${accent} / 0.5)` }}
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(160px circle at 14% 50%, oklch(${accent} / 0.16), transparent 72%)` }}
                  />

                  <UnoChip color={profile.color} label={profile.name[0]} sm />

                  <div className="relative flex-1">
                    <p className="font-display text-2xl leading-none text-white" translate="no">
                      {profile.name}
                    </p>
                  </div>

                  <span className={`relative h-2 w-2 rounded-full ${c.dot}`} />

                  <ChevronRight className="relative h-4 w-4 text-zinc-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-zinc-300" />
                </motion.button>
              );
            })}
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-zinc-600">
          Desenvolvido por <span className="text-zinc-400 font-semibold">Peixe</span>
        </p>
      </motion.div>
    </div>
  );
}