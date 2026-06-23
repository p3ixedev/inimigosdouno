import React from 'react';
import { COLOR_STYLES } from '../data/players';

export default function UnoChip({ color, label, sm = false }) {
  const isWhite = color === 'white';
  return (
    <span
      className={`uno-chip ${sm ? 'uno-chip-sm' : ''} ${COLOR_STYLES[color].bg} ${
        isWhite ? 'text-[oklch(0.2_0.04_265)]' : 'text-white'
      }`}
    >
      <span className="relative font-display font-extrabold">{label}</span>
    </span>
  );
}
