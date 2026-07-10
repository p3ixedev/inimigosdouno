import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import UnoChip from './UnoChip';

const POS_CONFIG = {
  1: {
    height: 'h-44 sm:h-52',
    barClass: 'rank-bar-1',
    nameSize: 'text-base sm:text-lg',
    scoreSize: 'text-3xl sm:text-4xl',
    scoreColor: '#f59e0b',
    pulseClass: 'pulse-gold',
    shadow: '0 0 40px -8px rgba(245,158,11,0.6)',
  },
  2: {
    height: 'h-32 sm:h-40',
    barClass: 'rank-bar-2',
    nameSize: 'text-sm sm:text-base',
    scoreSize: 'text-2xl sm:text-3xl',
    scoreColor: 'rgba(255,255,255,0.7)',
    pulseClass: '',
    shadow: '0 0 20px -8px rgba(200,200,220,0.3)',
  },
  3: {
    height: 'h-24 sm:h-32',
    barClass: 'rank-bar-3',
    nameSize: 'text-sm sm:text-base',
    scoreSize: 'text-2xl sm:text-3xl',
    scoreColor: 'rgba(255,255,255,0.5)',
    pulseClass: '',
    shadow: '0 0 20px -8px rgba(180,120,80,0.3)',
  },
};

export default function Podium({ ranking, wins }) {
  const top3 = ranking.slice(0, 3).filter((p) => wins[p.id] > 0);
  if (top3.length === 0) return null;

  // Order: 2nd, 1st, 3rd
  const podiumSlots = [];
  if (top3.length >= 2) podiumSlots.push({ player: top3[1], pos: 2 });
  podiumSlots.push({ player: top3[0], pos: 1 });
  if (top3.length >= 3) podiumSlots.push({ player: top3[2], pos: 3 });

  return (
    <div className="mb-6 rounded-2xl uno-card-surface p-4 sm:p-6">
      <div className="mb-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground mb-1">
          Classificação
        </p>
        <h3 className="font-display text-2xl sm:text-3xl tracking-wider" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Pódio
        </h3>
      </div>

      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {podiumSlots.map(({ player, pos }, idx) => {
          const cfg = POS_CONFIG[pos];
          const isFirst = pos === 1;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, type: 'spring', stiffness: 120, damping: 16 }}
              className="flex flex-col items-center"
            >
              {/* Crown above 1st place */}
              {isFirst && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 12 }}
                  className="mb-1"
                >
                  <Crown className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.8))' }} />
                </motion.div>
              )}

              {/* Player chip */}
              <motion.div
                className={`mb-2 ${isFirst ? 'scale-110 sm:scale-125' : 'scale-100'}`}
                whileHover={{ rotate: -6, scale: isFirst ? 1.2 : 1.08 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <UnoChip color={player.color} label={player.name[0]} sm={!isFirst} />
              </motion.div>

              {/* Name */}
              <p className={`mb-0.5 font-semibold text-center leading-tight ${cfg.nameSize}`} translate="no">
                {player.name}
              </p>

              {/* Score */}
              <p className={`mb-3 font-display leading-none ${cfg.scoreSize}`} style={{ color: cfg.scoreColor }}>
                {wins[player.id]}
              </p>

              {/* Podium bar */}
              <div
                className={`relative flex w-20 sm:w-24 items-end justify-center rounded-t-xl pb-2 ${cfg.height} ${cfg.barClass} ${cfg.pulseClass}`}
                style={{ boxShadow: cfg.shadow }}
              >
                <span className="font-display text-xl sm:text-2xl text-white/80">
                  {pos}
                  <span className="text-sm sm:text-base align-super">º</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
