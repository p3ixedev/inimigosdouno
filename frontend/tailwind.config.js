/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        surface:     'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        'surface-3': 'hsl(var(--surface-3))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          light:      'hsl(var(--primary-light))',
          dark:       'hsl(var(--primary-dark))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        ring:    'hsl(var(--ring))',
        gold:    'hsl(var(--gold))',
        'uno-red':    'hsl(var(--uno-red))',
        'uno-blue':   'hsl(var(--uno-blue))',
        'uno-green':  'hsl(var(--uno-green))',
        'uno-yellow': 'hsl(var(--uno-yellow))',
      },
      boxShadow: {
        'glow-red':    '0 0 24px -4px rgba(220,55,50,0.5)',
        'glow-blue':   '0 0 24px -4px rgba(50,110,220,0.5)',
        'glow-green':  '0 0 24px -4px rgba(34,197,94,0.5)',
        'glow-yellow': '0 0 24px -4px rgba(251,191,36,0.5)',
        'glow-gold':   '0 0 32px -4px rgba(251,191,36,0.6)',
        'card-sm':     '0 4px 16px -4px rgba(0,0,0,0.5)',
        'card-md':     '0 8px 32px -8px rgba(0,0,0,0.6)',
        'card-lg':     '0 16px 48px -12px rgba(0,0,0,0.7)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'inner-dark':  'inset 0 -2px 0 rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'gradient-uno':    'linear-gradient(135deg, hsl(10,82%,56%), hsl(220,80%,56%))',
        'gradient-gold':   'linear-gradient(135deg, hsl(44,88%,58%), hsl(38,78%,42%))',
        'gradient-surface':'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        'noise':           "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.4s ease-out both',
        'scale-in':       'scale-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-up':       'slide-up 0.5s ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
