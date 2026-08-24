/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        chiti: {
          bg: '#030108',
          mid: '#0D0A1E',
          card: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(124, 58, 237, 0.25)',
          accent: '#7C3AED',
          accentGlow: 'rgba(124, 58, 237, 0.4)',
          gold: '#F59E0B',
          emerald: '#10B981',
          rose: '#F43F5E',
          text: '#E2D9F3',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        display: ['Outfit', 'Cinzel', 'serif'],
        editorial: ['Cinzel', 'Outfit', 'serif'],
        body: ['Inter', 'Lato', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        'mono-data': ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        chiti: '16px',
      },
    },
  },
  plugins: [],
};
