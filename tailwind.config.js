/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome first — the brand is black, white, and grey.
        ink: '#0a0a0b',
        panel: '#0a0a0b',
        panel2: '#111111',
        // Card surfaces sit in grey, a clear step above the black page.
        card: '#14161d',
        card2: '#1c2030',
        line: 'rgba(255,255,255,0.10)',
        // Amber — used to flag actions that need attention (KYC, pending).
        warn: '#f2953b',
        // Vivid accent system — the "mission control" palette.
        azure: '#4f8bff',
        cyan: '#25d6e6',
        violet: '#a274ff',
        plasma: '#ff7a45',
        // SpaceX grey used for body copy.
        grey: {
          100: '#f2f2f2',
          300: '#c8cacc',
          400: '#a7a9ac',
          500: '#7d8083',
          600: '#54585b',
        },
        // The blue from the SpaceX mark — used sparingly, never as a UI wash.
        spx: '#005288',
        spxLight: '#0b7fd4',
        gain: '#34d399',
        loss: '#f87171',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Roboto', 'Arial', 'Verdana', 'sans-serif'],
        display: ['var(--font-display)', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['var(--font-sans)', 'Roboto', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        wider2: '0.05em',
        widest2: '0.09em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'slow-zoom': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        marquee: 'marquee 45s linear infinite',
        'slow-zoom': 'slow-zoom 20s ease-out both',
      },
    },
  },
  plugins: [],
};
