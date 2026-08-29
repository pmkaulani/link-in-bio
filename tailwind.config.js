/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4F4F5',
          100: '#E4E4E7',
          200: '#D4D4D8',
          300: '#A1A1AA',
          400: '#71717A',
          500: '#18181B',
          600: '#111111',
          700: '#09090B',
          800: '#050507',
          900: '#000000',
          950: '#000000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'hard-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'hard': '4px 4px 0px 0px rgba(0,0,0,1)',
        'hard-lg': '6px 6px 0px 0px rgba(0,0,0,1)',
        'subtle': '0 1px 2px rgba(0,0,0,0.05)',
        'elevated': '0 4px 12px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'control-sm': '6px',
        'control': '8px',
        'card': '12px',
        'preview': '16px',
        'pill': '9999px',
      },
    },
  },
  plugins: [],
};
