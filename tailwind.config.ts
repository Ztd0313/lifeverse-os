import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          soft: 'var(--bg-soft)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
        },
        border: {
          DEFAULT: 'var(--border)',
          soft: 'var(--border-soft)',
        },
        text: {
          DEFAULT: 'var(--text)',
          soft: 'var(--text-soft)',
          dim: 'var(--text-dim)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          soft: 'var(--gold-soft)',
          dim: 'var(--gold-dim)',
        },
        red: 'var(--red)',
        blue: 'var(--blue)',
        green: 'var(--green)',
        orange: 'var(--orange)',
        cyan: 'var(--cyan, #5de8e8)',
        purple: 'var(--purple, #b8a0c8)',
      },
      fontFamily: {
        serif: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Work Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 168, 76, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
