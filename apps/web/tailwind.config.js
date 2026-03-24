/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d9efff',
          200: '#b3ddff',
          300: '#82cbff',
          400: '#53b6f5',
          500: '#2f9ae7',
          600: '#1b86d9',
          700: '#1669ae',
          800: '#124c80',
          900: '#10243a',
        },
        mint: {
          50: '#eefdf7',
          100: '#d1f9e7',
          200: '#a9f1d3',
          300: '#77e3bb',
          400: '#35cba0',
          500: '#22b38a',
          600: '#14926f',
          700: '#0f6e55',
          800: '#0d5241',
          900: '#09261f',
        },
        ink: {
          50: '#eef3f8',
          100: '#d9e4ee',
          200: '#bccbda',
          300: '#94a8bc',
          400: '#60778f',
          500: '#43586f',
          600: '#324559',
          700: '#24364c',
          800: '#162638',
          900: '#0c1726',
        },
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"Iowan Old Style"', '"Palatino Linotype"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 18px 45px -30px rgba(16, 49, 82, 0.45), 0 12px 28px -24px rgba(27, 134, 217, 0.35)',
        'card-hover': '0 26px 52px -24px rgba(12, 23, 38, 0.28)',
        soft: '0 16px 34px -24px rgba(36, 54, 76, 0.35)',
        glow: '0 22px 40px -24px rgba(27, 134, 217, 0.5)',
        deep: '0 28px 64px -30px rgba(9, 17, 28, 0.82)',
      },
    },
  },
  plugins: [],
};
