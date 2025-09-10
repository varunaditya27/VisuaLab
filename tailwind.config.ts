import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
        screens: { lg: '1120px', xl: '1280px' },
      },
      fontFamily: {
        display: ['Orbitron', 'var(--font-geist)', 'ui-sans-serif', 'system-ui'],
        heading: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Legacy brand colors (keep for backward compatibility)
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
        // Aurora Spectrum - Revolutionary Color System
        'electric-blue': '#00d4ff',
        'cyber-purple': '#8b5cf6',
        'neon-pink': '#f471b5',
        'plasma-green': '#10b981',
        'solar-orange': '#f59e0b',
        'cosmic-violet': '#7c3aed',
        'void-black': '#0a0a0f',
        'space-gray': '#1a1a2e',
        'glass-white': 'rgba(255,255,255,0.1)',
        'hologram-base': 'rgba(255,255,255,0.05)',
        ink: '#0b1020',
        aurora: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00d4ff',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        cyber: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d946ef',
          400: '#c084fc',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        neon: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#f471b5',
          600: '#ec4899',
          700: '#db2777',
          800: '#be185d',
          900: '#9d174d',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(17,24,39,0.05), 0 10px 25px -5px rgba(43,132,255,0.35)',
        'aurora-glow': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)',
        'neon-glow': '0 0 20px rgba(244, 113, 181, 0.4), 0 0 40px rgba(244, 113, 181, 0.2)',
        'cosmic-glow': '0 0 20px rgba(124, 58, 237, 0.3), 0 0 40px rgba(124, 58, 237, 0.1)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      backdropBlur: {
        'glass': '12px',
        'heavy': '20px',
      },
      keyframes: {
        // Legacy animations
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Aurora Spectrum animations
        'aurora-shift': {
          '0%': { 
            backgroundPosition: '0% 50%',
            transform: 'rotate(0deg)',
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            transform: 'rotate(180deg)',
          },
          '100%': { 
            backgroundPosition: '0% 50%',
            transform: 'rotate(360deg)',
          },
        },
        'particle-float': {
          '0%, 100%': { 
            transform: 'translateY(0px) translateX(0px) scale(1)',
            opacity: '0.7',
          },
          '33%': { 
            transform: 'translateY(-10px) translateX(5px) scale(1.1)',
            opacity: '1',
          },
          '66%': { 
            transform: 'translateY(5px) translateX(-5px) scale(0.9)',
            opacity: '0.8',
          },
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 5px currentColor',
            filter: 'brightness(1)',
          },
          '50%': { 
            boxShadow: '0 0 20px currentColor, 0 0 30px currentColor',
            filter: 'brightness(1.2)',
          },
        },
        'hologram-flicker': {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '0.7' },
        },
        'quantum-hover': {
          '0%': { 
            transform: 'scale(1) rotateZ(0deg)',
            filter: 'hue-rotate(0deg)',
          },
          '100%': { 
            transform: 'scale(1.02) rotateZ(1deg)',
            filter: 'hue-rotate(5deg)',
          },
        },
        'cosmic-entrance': {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.8) rotate(-5deg)',
            filter: 'blur(10px)',
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1) rotate(0deg)',
            filter: 'blur(0px)',
          },
        },
        'neural-response': {
          '0%': { 
            transform: 'scale(1)',
            background: 'radial-gradient(circle, transparent 0%, transparent 100%)',
          },
          '50%': { 
            transform: 'scale(1.05)',
            background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)',
          },
          '100%': { 
            transform: 'scale(1)',
            background: 'radial-gradient(circle, transparent 0%, transparent 100%)',
          },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'magnetic-hover': {
          '0%': { transform: 'translateY(0px) scale(1)' },
          '100%': { transform: 'translateY(-2px) scale(1.02)' },
        },
      },
      animation: {
        // Legacy animations
        float: 'float 6s ease-in-out infinite',
        fadeInUp: 'fadeInUp 600ms ease-out both',
        // Aurora Spectrum animations
        'aurora-shift': 'aurora-shift 20s ease-in-out infinite',
        'particle-float': 'particle-float 8s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'hologram-flicker': 'hologram-flicker 3s ease-in-out infinite',
        'quantum-hover': 'quantum-hover 200ms ease-out forwards',
        'cosmic-entrance': 'cosmic-entrance 800ms cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'neural-response': 'neural-response 300ms ease-out',
        'gradient-x': 'gradient-x 3s ease infinite',
        'magnetic-hover': 'magnetic-hover 200ms ease-out forwards',
      },
      backgroundImage: {
        'aurora-primary': 'linear-gradient(135deg, #00d4ff, #8b5cf6, #f471b5)',
        'sunset-burst': 'linear-gradient(135deg, #f59e0b, #f471b5, #7c3aed)',
        'ocean-dream': 'linear-gradient(135deg, #00d4ff, #10b981, #8b5cf6)',
        'cosmic-fire': 'linear-gradient(135deg, #7c3aed, #f471b5, #f59e0b)',
        'holographic': 'linear-gradient(45deg, rgba(0,212,255,0.1), rgba(139,92,246,0.1), rgba(244,113,181,0.1))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, #00d4ff33 0px, transparent 50%), radial-gradient(at 80% 0%, #8b5cf633 0px, transparent 50%), radial-gradient(at 0% 50%, #f471b533 0px, transparent 50%), radial-gradient(at 80% 50%, #10b98133 0px, transparent 50%), radial-gradient(at 0% 100%, #f59e0b33 0px, transparent 50%), radial-gradient(at 80% 100%, #7c3aed33 0px, transparent 50%), radial-gradient(at 0% 0%, #00d4ff33 0px, transparent 50%)',
      },
      transitionTimingFunction: {
        'organic': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    }
  },
  plugins: [
    require('@tailwindcss/typography'), 
    require('@tailwindcss/forms'), 
    require('tailwindcss-animate')
  ]
} satisfies Config
