import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
        screens: { lg: '1120px', xl: '1280px' },
      },
      fontFamily: {
        display: ['var(--font-geist)', 'ui-sans-serif', 'system-ui'],
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular'],
      },
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#b9dcff',
          300: '#8ac4ff',
          400: '#58a4ff',
          500: '#2b84ff',
          600: '#1768e0',
          700: '#124fb0',
          800: '#123f89',
          900: '#13356f',
        },
        ink: '#0b1020',
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(17,24,39,0.05), 0 10px 25px -5px rgba(43,132,255,0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        fadeInUp: 'fadeInUp 600ms ease-out both',
      },
    }
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms'), require('tailwindcss-animate')]
} satisfies Config
