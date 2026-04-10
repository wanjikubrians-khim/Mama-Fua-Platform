/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#f0faf6',100:'#d4f0e4',200:'#a8e1c9',300:'#6dcba5',400:'#3aaf82',500:'#1a9268',600:'#0d7550',700:'#0a5e3f',800:'#094d34',900:'#07402b' },
        ink:   { 50:'#f8f7f4',100:'#eeece6',200:'#d9d5cc',300:'#b8b3a8',400:'#968f83',500:'#756e62',600:'#5a5449',700:'#433f36',800:'#2e2b24',900:'#1c1a15' },
      },
      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft':  '0 2px 8px 0 rgb(0 0 0 / 0.06), 0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card':  '0 1px 4px 0 rgb(0 0 0 / 0.07), 0 2px 12px 0 rgb(0 0 0 / 0.05)',
        'lift':  '0 4px 20px 0 rgb(0 0 0 / 0.10), 0 2px 6px 0 rgb(0 0 0 / 0.06)',
        'brand': '0 4px 16px 0 rgb(13 117 80 / 0.30)',
        'modal': '0 24px 60px -10px rgb(0 0 0 / 0.28)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
