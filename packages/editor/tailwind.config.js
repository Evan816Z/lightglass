/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F5F7FB',
          100: '#E6EAF2',
          200: '#C2CADB',
          300: '#9AA5BD',
          400: '#6B7793',
          500: '#3D475E',
          600: '#252D40',
          700: '#181E2D',
          800: '#101523',
          900: '#0B0F1A',
          950: '#06080F',
        },
        violet: {
          DEFAULT: '#7C5CFF',
        },
        mint: {
          DEFAULT: '#36E0C7',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 1px 0 rgba(255,255,255,.08) inset, 0 8px 32px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.04)',
        'glass-lg': '0 1px 0 rgba(255,255,255,.1) inset, 0 24px 64px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06)',
        glow: '0 0 32px rgba(124,92,255,.45)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 6s linear infinite',
        floatIn: 'floatIn .25s ease-out both',
      },
    },
  },
  plugins: [],
};
