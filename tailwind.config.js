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
          50: '#f0f4ff',
          100: '#e0e8f7',
          200: '#c8d4ec',
          700: '#2c3a5c',
          800: '#1a2644',
          850: '#142038',
          900: '#0e142c',
          950: '#080c1c',
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
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'check-bounce': 'checkBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'threat-pulse': 'threatPulse 2s ease-in-out infinite',
        'nav-indicator': 'navIndicatorSlide 0.25s ease-out',
        'page-enter': 'pageEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'bar-grow': 'barGrow 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-ring': 'pulseRing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float-subtle': 'floatSubtle 4s ease-in-out infinite',
        'ripple': 'ripple 1s ease-out',
        'gauge-pulse': 'gaugeArcPulse 3s ease-in-out infinite',
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
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        checkBounce: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.3)' },
          '60%': { transform: 'scale(0.85)' },
          '80%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 4px currentColor', opacity: '1' },
          '50%': { boxShadow: '0 0 14px currentColor', opacity: '0.7' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        threatPulse: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        navIndicatorSlide: {
          '0%': { opacity: '0', transform: 'scaleY(0.5)' },
          '100%': { opacity: '1', transform: 'scaleY(1)' },
        },
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        barGrow: {
          '0%': { width: '0%' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        gaugeArcPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px var(--gauge-color, #10b981))' },
          '50%': { filter: 'drop-shadow(0 0 14px var(--gauge-color, #10b981))' },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
