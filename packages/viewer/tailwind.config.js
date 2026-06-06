/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F5F7FB', 100: '#E6EAF2', 200: '#C2CADB', 300: '#9AA5BD', 400: '#6B7793',
          500: '#3D475E', 600: '#252D40', 700: '#181E2D', 800: '#101523', 900: '#0B0F1A', 950: '#06080F',
        },
        violet: { DEFAULT: '#7C5CFF' },
        mint: { DEFAULT: '#36E0C7' },
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
