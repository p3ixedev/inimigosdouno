// Players for Inimigos do Uno
export const PLAYERS = [
  { id: 'emanuel',  name: 'Emanuel',  color: 'green'  },
  { id: 'jacyane',  name: 'Jaciany',  color: 'white'  },
  { id: 'mayara',   name: 'Mayara',   color: 'yellow' },
  { id: 'renan',    name: 'Renan',    color: 'red'    },
  { id: 'stephane', name: 'Stephane', color: 'blue'   },
];

export const COLOR_STYLES = {
  red: {
    bg:   'bg-[oklch(0.63_0.24_27)]',
    text: 'text-[oklch(0.63_0.24_27)]',
    ring: 'ring-[oklch(0.63_0.24_27)]',
    dot:  'bg-[oklch(0.63_0.24_27)]',
    hex:  'oklch(0.63 0.24 27)',
  },
  blue: {
    bg:   'bg-[oklch(0.6_0.22_255)]',
    text: 'text-[oklch(0.7_0.18_255)]',
    ring: 'ring-[oklch(0.6_0.22_255)]',
    dot:  'bg-[oklch(0.6_0.22_255)]',
    hex:  'oklch(0.6 0.22 255)',
  },
  green: {
    bg:   'bg-[oklch(0.68_0.2_152)]',
    text: 'text-[oklch(0.75_0.18_152)]',
    ring: 'ring-[oklch(0.68_0.2_152)]',
    dot:  'bg-[oklch(0.68_0.2_152)]',
    hex:  'oklch(0.68 0.2 152)',
  },
  yellow: {
    bg:   'bg-[oklch(0.85_0.18_90)]',
    text: 'text-[oklch(0.88_0.16_90)]',
    ring: 'ring-[oklch(0.85_0.18_90)]',
    dot:  'bg-[oklch(0.85_0.18_90)]',
    hex:  'oklch(0.85 0.18 90)',
  },
  white: {
    bg:   'bg-[oklch(0.92_0.01_250)]',
    text: 'text-[oklch(0.92_0.01_250)]',
    ring: 'ring-[oklch(0.92_0.01_250)]',
    dot:  'bg-[oklch(0.92_0.01_250)]',
    hex:  'oklch(0.92 0.01 250)',
  },
};

export const STORAGE_KEY = 'uno-placar-matches-v1';

export function loadMatches() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMatches(matches) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  } catch (e) {
    // ignore
  }
}

export function startOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const s = new Date(d);
  s.setDate(d.getDate() - diff);
  s.setHours(0, 0, 0, 0);
  return s.getTime();
}
