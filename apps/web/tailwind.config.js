/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {

      // ── Colors ─────────────────────────────────────────────────────
      colors: {
        brand: {
          50:  '#e6f1fb',
          100: '#b5d4f4',
          200: '#85b7eb',
          300: '#5b9fe2',
          400: '#378add',
          500: '#2574c4',
          600: '#185fa5',
          700: '#124d87',
          800: '#0c447c',
          900: '#042c53',
        },
        teal: {
          50:  '#e1f5ee',
          100: '#9fe1cb',
          200: '#5dcaa5',
          400: '#1d9e75',
          600: '#0f6e56',
          800: '#085041',
          900: '#04342c',
        },
        // Keep Tailwind defaults for amber, red, green, purple, blue, gray
      },

      // ── Typography ──────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      // ── Border radius ───────────────────────────────────────────────
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      // ── Box shadows ─────────────────────────────────────────────────
      boxShadow: {
        'card':       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 16px 0 rgb(0 0 0 / 0.10)',
        'modal':      '0 20px 60px -10px rgb(0 0 0 / 0.25)',
        'brand':      '0 4px 14px 0 rgb(24 95 165 / 0.35)',
        'teal':       '0 4px 14px 0 rgb(15 110 86 / 0.35)',
        'inner-brand':'inset 0 2px 4px 0 rgb(24 95 165 / 0.1)',
      },

      // ── Spacing ─────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '92': '23rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },

      // ── Max width ───────────────────────────────────────────────────
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // ── Animations ──────────────────────────────────────────────────
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
        'scale-in':  'scaleIn 0.15s ease-out',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'bounce-sm': 'bounceSm 0.6s ease-in-out',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
      },

      // ── Transitions ─────────────────────────────────────────────────
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },

      // ── Background image ────────────────────────────────────────────
      backgroundImage: {
        'hero-gradient': 'linear-gradient(160deg, #f0f7ff 0%, #f8fafc 60%)',
        'brand-gradient': 'linear-gradient(135deg, #185fa5 0%, #0c447c 100%)',
        'teal-gradient':  'linear-gradient(135deg, #0f6e56 0%, #085041 100%)',
        'grid-pattern': `
          linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
        `,
      },

      backgroundSize: {
        'grid': '20px 20px',
      },
    },
  },

  plugins: [
    // Uncomment if installed:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/line-clamp'),
  ],
};