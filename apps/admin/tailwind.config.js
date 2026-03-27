/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'sans-serif'],
      },
      colors: {
        admin: {
          brand: '#5ec0dd',
          brandSoft: '#89ddf4',
          success: '#41c493',
          warning: '#f3b85a',
          danger: '#f57f7f',
          ink: '#e6eefc',
          muted: '#9db0d0',
          surface: '#0c1729',
        },
      },
      boxShadow: {
        admin: '0 24px 60px -28px rgba(0, 0, 0, 0.7)',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'float-in': 'floatIn 500ms ease-out both',
      },
    },
  },
  plugins: [],
};
