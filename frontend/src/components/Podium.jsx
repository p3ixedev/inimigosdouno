import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import UnoChip from './UnoChip';

export default function Podium({ ranking, wins }) {
  const top3 = ranking.slice(0, 3).filter((p) => wins[p.id] > 0);
  if (top3.length === 0) return null;

  const podiumSlots = [];
  if (top3.length >= 2) podiumSlots.push({ player: top3[1], pos: 2 });
  podiumSlots.push({ player: top3[0], pos: 1 });
  if (top3.length >= 3) podiumSlots.push({ player: top3[2], pos: 3 });

  const heights = { 1: 'h-44 sm:h-56', 2: 'h-32 sm:h-40', 3: 'h-24 sm:h-32' };
  const glows = {
    1: 'shadow-[0_0_40px_-8px_oklch(0.82_0.16_85/0.7)] pulse-gold',
    2: 'shadow-[0_0_30px_-8px_oklch(0.72_0.02_260/0.5)]',
    3: 'shadow-[0_0_30px_-8px_oklch(0.72_0.02_260/0.5)]',
  };
  const barColors = {
    1: 'bg-gradient-to-b from-[oklch(0.86_0.17_85)] to-[oklch(0.65_0.14_70)]',
    2: 'bg-gradient-to-b from-[oklch(0.78_0.02_260)] to-[oklch(0.5_0.02_260)]',
    3: 'bg-gradient-to-b from-[oklch(0.68_0.14_45)] to-[oklch(0.46_0.1_40)]',
  };

  return (
    <div className="mb-6 rounded-2xl uno-card-surface p-3 sm:p-6">
      <div className="mb-3 text-center sm:mb-4">
        <h3 className="font-display text-xl tracking-wider text-zinc-300 sm:text-2xl">Pódio</h3>
      </div>
      <div className="flex items-end justify-center gap-2 sm:gap-6">
        {podiumSlots.map(({ player, pos }, idx) => {
          const isFirst = pos === 1;
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * idx, type: 'spring', stiffness: 110, damping: 14 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className={`mb-2 ${isFirst ? 'scale-125' : 'scale-100'}`}
                whileHover={{ rotate: -8, scale: isFirst ? 1.35 : 1.1 }}
              >
                <UnoChip color={player.color} label={player.name[0]} sm={!isFirst} />
              </motion.div>
              <p className={`mb-1 text-center font-semibold ${isFirst ? 'text-base' : 'text-sm'}`} translate="no">
                {player.name}
              </p>
              <p
                className={`mb-3 font-display ${
                  isFirst ? 'text-3xl text-[oklch(0.86_0.17_85)]' : 'text-xl text-zinc-400'
                }`}
              >
                {wins[player.id]}
              </p>
              <div
                className={`relative flex w-20 items-center justify-center rounded-t-xl sm:w-24 ${heights[pos]} ${barColors[pos]} ${glows[pos]}`}
              >
                <span className="absolute bottom-2 font-display text-2xl text-white/90">
                  {pos}º
                </span>
                {isFirst && (
                  <Crown className="absolute -top-5 h-8 w-8 text-[oklch(0.86_0.17_85)] drop-shadow-lg" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
