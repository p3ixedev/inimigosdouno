import React from 'react';

const COLOR_MAP = {
  red:    { cls: 'uno-color-red',    text: 'text-white' },
  blue:   { cls: 'uno-color-blue',   text: 'text-white' },
  green:  { cls: 'uno-color-green',  text: 'text-white' },
  yellow: { cls: 'uno-color-yellow', text: 'text-white' },
  white:  { cls: 'uno-color-white',  text: 'text-[#1a1d2e]' },
};

export default function UnoChip({ color = 'red', label, sm = false }) {
  const { cls, text } = COLOR_MAP[color] || COLOR_MAP.red;
  return (
    <span className={`uno-chip ${sm ? 'uno-chip-sm' : ''} ${cls} ${text}`}>
      <span className="font-display font-extrabold select-none">{label}</span>
    </span>
  );
}
