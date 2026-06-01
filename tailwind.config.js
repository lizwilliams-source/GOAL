/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        pitch: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#2e7d32',
          600: '#1b5e20',
          700: '#155218',
          800: '#0d3b11',
          900: '#071f09',
        },
        gold: {
          100: '#fff9c4',
          300: '#fff176',
          400: '#ffee58',
          500: '#f9a825',
          600: '#e65100',
        }
      },
      animation: {
        'ball-bounce': 'ballBounce 0.6s ease-in-out',
        'goal-flash': 'goalFlash 1s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'progress-fill': 'progressFill 1s ease-out forwards',
        'wave': 'wave 2s ease-in-out infinite',
        'net-shake': 'netShake 0.5s ease-out',
      },
      keyframes: {
        ballBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2) rotate(180deg)' },
          '100%': { transform: 'scale(1) rotate(360deg)' },
        },
        goalFlash: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progressFill: {
          '0%': { width: '0%' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.05)' },
        },
        netShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        }
      }
    },
  },
  plugins: [],
}
