/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          850: '#162032',
          900: '#0f172a',
          950: '#020617',
        },
        th: {
          page: 'rgb(var(--c-page) / <alpha-value>)',
          card: 'rgb(var(--c-card) / <alpha-value>)',
          'card-alt': 'rgb(var(--c-card-alt) / <alpha-value>)',
          input: 'rgb(var(--c-input) / <alpha-value>)',
          heading: 'rgb(var(--c-heading) / <alpha-value>)',
          body: 'rgb(var(--c-body) / <alpha-value>)',
          muted: 'rgb(var(--c-muted) / <alpha-value>)',
          faint: 'rgb(var(--c-faint) / <alpha-value>)',
          border: 'rgb(var(--c-border) / <alpha-value>)',
          'border-alt': 'rgb(var(--c-border-alt) / <alpha-value>)',
        },
      },
      animation: {
        'score-fill': 'scoreFill 1.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        scoreFill: {
          '0%': { strokeDashoffset: '440' },
          '100%': { strokeDashoffset: 'var(--score-offset)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
