import React from 'react';

const CARDS = [
  { color: '#dc3730', top: '7%',   left:  '3%',   anim: 'anim-float-1', label: '7',  rotate: '-14deg' },
  { color: '#3b82f6', top: '16%',  right: '5%',   anim: 'anim-float-2', label: '+4', rotate:  '10deg' },
  { color: '#22c55e', top: '52%',  left:  '2%',   anim: 'anim-float-3', label: '3',  rotate: '-8deg'  },
  { color: '#f59e0b', top: '70%',  right: '4%',   anim: 'anim-float-1', label: '5',  rotate:  '13deg' },
  { color: '#dc3730', top: '86%',  left:  '10%',  anim: 'anim-float-2', label: '+2', rotate: '-18deg' },
  { color: '#3b82f6', top: '36%',  right: '11%',  anim: 'anim-float-3', label: '9',  rotate:  '8deg'  },
  { color: '#22c55e', top: '44%',  left:  '8%',   anim: 'anim-float-2', label: '0',  rotate: '-5deg'  },
  { color: '#f59e0b', top: '28%',  left:  '18%',  anim: 'anim-float-1', label: 'S',  rotate:  '16deg' },
];

export default function FloatingCards() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 hidden lg:block" aria-hidden="true">
      {CARDS.map((c, i) => (
        <div
          key={i}
          className={`floating-card ${c.anim}`}
          style={{
            top:       c.top,
            left:      c.left,
            right:     c.right,
            background: c.color,
            transform: `rotate(${c.rotate})`,
          }}
        >
          {/* Authentic UNO oval highlight */}
          <span
            className="absolute inset-0 flex items-center justify-center font-display text-2xl text-white/90"
          >
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
