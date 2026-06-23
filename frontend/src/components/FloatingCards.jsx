import React from 'react';

const CARDS = [
  { color: 'oklch(0.63 0.24 27)',  top: '8%',  left: '4%',  anim: 'anim-float-1', label: '7' },
  { color: 'oklch(0.6 0.22 255)',  top: '18%', right: '6%', anim: 'anim-float-2', label: '+4' },
  { color: 'oklch(0.68 0.2 152)',  top: '55%', left: '3%',  anim: 'anim-float-3', label: '3' },
  { color: 'oklch(0.85 0.18 90)',  top: '72%', right: '4%', anim: 'anim-float-1', label: '5' },
  { color: 'oklch(0.63 0.24 27)',  top: '88%', left: '12%', anim: 'anim-float-2', label: '+2' },
  { color: 'oklch(0.6 0.22 255)',  top: '38%', right: '12%',anim: 'anim-float-3', label: '9' },
];

export default function FloatingCards() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 hidden lg:block">
      {CARDS.map((c, i) => (
        <div
          key={i}
          className={`floating-card ${c.anim}`}
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            background: c.color,
          }}
        >
          <span
            className="absolute inset-0 flex items-center justify-center font-display text-2xl text-white/90"
            style={{ transform: 'rotate(-22deg)' }}
          >
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
