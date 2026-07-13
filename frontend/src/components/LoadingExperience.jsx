// ============================================================
// LoadingExperience.jsx — EXPERIÊNCIA DE CARREGAMENTO PREMIUM
//
// "O jogador não está esperando. Está sendo transportado
//  para a mesa de jogo."
//
// ▸ Provider global + hook — um único sistema para todo o app
// ▸ Elemento central exclusivo: ORBITAL DE CARTAS
//   4 cartas (vermelho/azul/verde/amarelo) orbitam e se
//   embaralham em torno de um núcleo luminoso com o logo foil
// ▸ Dicas rotativas com crossfade suave
// ▸ Duração mínima garantida (nunca corta a animação no meio)
// ▸ Loop orgânico (nunca parece repetitivo em esperas longas)
// ▸ Respeita prefers-reduced-motion
// ▸ 100% transform/opacity — leve, GPU-friendly
//
// COMO USAR — ver COMO-USAR.md nesta pasta.
// Requer: framer-motion + loading-experience.css importado.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// ------------------------------------------------------------
// Identidade visual — mesmas cores das cartas do restante do jogo
// (idênticas às usadas na Home, Mesa e Sala de Espera)
// ------------------------------------------------------------
const CARD_COLORS = [
  { name: 'vermelho', bg: 'oklch(0.63 0.24 27)' },
  { name: 'azul', bg: 'oklch(0.6 0.22 255)' },
  { name: 'verde', bg: 'oklch(0.68 0.2 152)' },
  { name: 'amarelo', bg: 'oklch(0.85 0.18 90)' },
];

const DEFAULT_TIPS = [
  'Embaralhando as cartas...',
  'Preparando a mesa...',
  'Chamando os jogadores...',
  'Organizando a partida...',
  'Conferindo as regras...',
  'Preparando sua próxima vitória...',
];

// Duração mínima que a camada fica visível (ms).
// Garante que a coreografia de entrada + 1 ciclo do orbital
// sempre completem antes da saída — nunca corta no meio.
const MIN_VISIBLE_MS = 2000;
// Duração de 1 ciclo do orbital — a saída só acontece em
// múltiplos aproximados disso, para fechar o movimento com elegância.
const ORBIT_CYCLE_MS = 2400;

// ------------------------------------------------------------
// Easing assinatura do projeto — desaceleração natural
// ------------------------------------------------------------
const EASE_OUT = [0.22, 1, 0.36, 1];
const EASE_IN_OUT = [0.65, 0, 0.35, 1];

// ============================================================
// CARTA DO ORBITAL
// Cada carta percorre uma elipse e, no ponto mais alto, "salta"
// para a frente do baralho (escala + z visual) — sensação de
// embaralhamento contínuo e orgânico.
// ============================================================
function OrbitCard({ color, index, total, reduced }) {
  // Distribui as cartas uniformemente na órbita
  const phase = index / total;

  if (reduced) {
    // Modo reduzido: leque estático elegante, sem órbita
    const spread = (index - (total - 1) / 2) * 22;
    return (
      <div
        className="lx-card"
        style={{
          background: color.bg,
          transform: `translate(-50%, -50%) rotate(${spread}deg) translateY(-8px)`,
        }}
      >
        <div className="lx-card-ellipse" />
      </div>
    );
  }

  return (
    <div
      className="lx-orbit-track"
      style={{
        animationDelay: `${-phase * ORBIT_CYCLE_MS}ms`,
        animationDuration: `${ORBIT_CYCLE_MS}ms`,
      }}
    >
      <div className="lx-orbit-arm">
        <div
          className="lx-orbit-counter"
          style={{
            animationDelay: `${-phase * ORBIT_CYCLE_MS}ms`,
            animationDuration: `${ORBIT_CYCLE_MS}ms`,
          }}
        >
          <div
            className="lx-card lx-card-orbit"
            style={{
              background: color.bg,
              animationDelay: `${-phase * ORBIT_CYCLE_MS}ms`,
              animationDuration: `${ORBIT_CYCLE_MS}ms`,
            }}
          >
            <div className="lx-card-ellipse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DICAS ROTATIVAS — crossfade suave, troca a cada 2.4s
// ============================================================
function RotatingTips({ tips }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % tips.length);
    }, 2400);
    return () => clearInterval(t);
  }, [tips.length]);

  return (
    <div className="relative h-6 w-full overflow-visible">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
          transition={{ duration: 0.45, ease: EASE_IN_OUT }}
          className="absolute inset-x-0 text-center text-sm font-medium tracking-wide text-white/60"
        >
          {tips[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// OVERLAY — a cena completa
// ============================================================
function LoadingOverlay({ tips, title }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      key="lx-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55, ease: EASE_IN_OUT } }}
      transition={{ duration: 0.45, ease: EASE_IN_OUT }}
      className="lx-overlay"
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      {/* ---- Fundo: profundidade, luz e mesa ---- */}
      <div className="lx-bg" aria-hidden="true">
        <div className="lx-bg-aurora lx-bg-aurora-1" />
        <div className="lx-bg-aurora lx-bg-aurora-2" />
        <div className="lx-bg-spotlight" />
        <div className="lx-bg-vignette" />
      </div>

      {/* ---- Cena central ---- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 1.06,
          filter: 'blur(6px)',
          transition: { duration: 0.5, ease: EASE_IN_OUT },
        }}
        transition={{ duration: 0.65, ease: EASE_OUT, delay: 0.08 }}
        className="relative flex flex-col items-center px-6"
      >
        {/* Orbital de cartas */}
        <div className="lx-stage" aria-hidden="true">
          {/* Halo pulsante atrás do núcleo */}
          <div className="lx-core-glow" />

          {/* Anel sutil da órbita */}
          <div className="lx-orbit-ring" />

          {/* As 4 cartas — entram "distribuídas" com stagger */}
          {CARD_COLORS.map((color, i) => (
            <motion.div
              key={color.name}
              className="lx-orbit-origin"
              initial={{ opacity: 0, scale: 0.4, y: -60 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.18 + i * 0.09,
                type: 'spring',
                stiffness: 150,
                damping: 16,
              }}
            >
              <OrbitCard
                color={color}
                index={i}
                total={CARD_COLORS.length}
                reduced={reduced}
              />
            </motion.div>
          ))}

          {/* Núcleo: logotipo foil */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: EASE_OUT }}
            className="lx-core"
          >
            <span className="font-display lx-foil-text">
              {title || 'INIMIGOS DO UNO'}
            </span>
          </motion.div>
        </div>

        {/* Dicas rotativas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 w-64 sm:w-80"
        >
          <RotatingTips tips={tips} />

          {/* Fio de energia — indicador vivo, não uma barra de progresso */}
          <div className="lx-energy mt-5" aria-hidden="true">
            <div className="lx-energy-sweep" />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// PROVIDER + HOOK
// ============================================================
const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [state, setState] = useState({ visible: false, tips: DEFAULT_TIPS, title: null });
  const shownAtRef = useRef(0);
  const counterRef = useRef(0); // suporta chamadas concorrentes

  const show = useCallback((options = {}) => {
    counterRef.current += 1;
    if (counterRef.current === 1) {
      shownAtRef.current = Date.now();
      setState({
        visible: true,
        tips: options.tips && options.tips.length ? options.tips : DEFAULT_TIPS,
        title: options.title || null,
      });
    }
  }, []);

  const hide = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current > 0) return Promise.resolve();

    const elapsed = Date.now() - shownAtRef.current;
    // Espera o mínimo E alinha a saída ao fim do ciclo do orbital,
    // para o movimento nunca ser interrompido no meio.
    const minWait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const total = elapsed + minWait;
    const toCycleEnd = (ORBIT_CYCLE_MS - (total % ORBIT_CYCLE_MS)) % ORBIT_CYCLE_MS;
    // Só alinha ao ciclo se o ajuste for pequeno (evita esperas longas)
    const wait = minWait + (toCycleEnd < 700 ? toCycleEnd : 0);

    return new Promise((resolve) => {
      setTimeout(() => {
        if (counterRef.current === 0) {
          setState((s) => ({ ...s, visible: false }));
        }
        resolve();
      }, wait);
    });
  }, []);

  /**
   * Envolve qualquer ação assíncrona com a experiência de carregamento.
   *
   *   const { withLoading } = useLoadingExperience();
   *   const sala = await withLoading(() => createMatch(payload), {
   *     tips: ['Preparando a mesa...', 'Distribuindo as cartas...'],
   *   });
   */
  const withLoading = useCallback(
    async (action, options = {}) => {
      show(options);
      try {
        const result = await action();
        await hide();
        return result;
      } catch (err) {
        await hide();
        throw err;
      }
    },
    [show, hide],
  );

  const value = useMemo(
    () => ({ show, hide, withLoading, isLoading: state.visible }),
    [show, hide, withLoading, state.visible],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {state.visible && <LoadingOverlay tips={state.tips} title={state.title} />}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}

export function useLoadingExperience() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoadingExperience deve ser usado dentro de <LoadingProvider>');
  }
  return ctx;
}

export default LoadingProvider;
