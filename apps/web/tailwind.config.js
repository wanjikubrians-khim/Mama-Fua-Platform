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
        // Primary brand — electric blue (modern, trustworthy)
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        // Text / surface — slate (replaces broken ink-* classes)
        ink: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },

        // Success / M-Pesa green (replaces broken mint-* classes)
        mint: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },

        // Neutral surfaces
        surface: {
          0:   '#ffffff',
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
        },

        // Keep Tailwind defaults: amber, red, green, purple, blue, gray, slate
      },

      // ── Typography ──────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs':   ['0.625rem',  { lineHeight: '1rem' }],
        '4.5xl': ['2.625rem',  { lineHeight: '1.1' }],
        '5.5xl': ['3.375rem',  { lineHeight: '1.05' }],
        '6.5xl': ['4.125rem',  { lineHeight: '1' }],
        '7xl':   ['4.5rem',    { lineHeight: '1' }],
        '8xl':   ['6rem',      { lineHeight: '1' }],
      },

      // ── Border radius ───────────────────────────────────────────────
      borderRadius: {
        'sm':  '0.375rem',
        'md':  '0.5rem',
        'lg':  '0.625rem',
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.75rem',
        '5xl': '2rem',
      },

      // ── Box shadows ─────────────────────────────────────────────────
      boxShadow: {
        'xs':    '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'soft':  '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card':  '0 2px 8px 0 rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 24px 0 rgb(0 0 0 / 0.10), 0 0 0 1px rgb(0 0 0 / 0.04)',
        'md':    '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        'lg':    '0 8px 24px 0 rgb(0 0 0 / 0.10)',
        'xl':    '0 20px 40px 0 rgb(0 0 0 / 0.12)',
        'modal': '0 25px 60px -10px rgb(0 0 0 / 0.30)',
        'brand': '0 4px 16px 0 rgb(37 99 235 / 0.35)',
        'mint':  '0 4px 16px 0 rgb(5 150 105 / 0.35)',
        'glow':  '0 0 20px 4px rgb(5 150 105 / 0.25)',
        'dark':  '0 0 0 1px rgb(255 255 255 / 0.06)',
        'inset': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
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
        '144': '36rem',
      },

      // ── Max width ───────────────────────────────────────────────────
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // ── Animations ──────────────────────────────────────────────────
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'ping-slow':  'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'shimmer':    'shimmer 1.5s linear infinite',
        'float':      'float 3s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },

      // ── Transitions ─────────────────────────────────────────────────
      transitionDuration: {
        '200': '200ms',
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ── Background images / gradients ───────────────────────────────
      backgroundImage: {
        'hero-dark':       'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2850 100%)',
        'brand-gradient':  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        'mint-gradient':   'linear-gradient(135deg, #059669 0%, #047857 100%)',
        'dark-card':       'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'wallet-card':     'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        'surface-subtle':  'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        'dot-pattern': `radial-gradient(circle, rgb(148 163 184 / 0.15) 1px, transparent 1px)`,
        'grid-pattern': `
          linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)
        `,
      },

      backgroundSize: {
        'dot': '24px 24px',
        'grid': '32px 32px',
      },
    },
  },

  plugins: [],
};
