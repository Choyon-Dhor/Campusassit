/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#eef6ff',
          100: '#dcecff',
          200: '#bddaff',
          300: '#8fc2ff',
          400: '#5aa0ff',
          500: '#2f7df6',
          600: '#1d5fe0',
          700: '#194bc0',
          800: '#1a3f9b',
          900: '#18377b',
          950: '#08162e',
        },
      },
      boxShadow: {
        'campus-xl': '0 32px 80px rgba(3, 12, 32, 0.28)',
        'campus-card': '0 18px 40px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 1px rgba(147, 197, 253, 0.16), 0 24px 60px rgba(29, 78, 216, 0.18)',
      },
      fontFamily: {
        display: ['Manrope', 'Google Sans', 'Roboto', 'sans-serif'],
        sans: ['Roboto', 'Google Sans', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%) rotate(12deg)' },
          '100%': { transform: 'translateX(280%) rotate(12deg)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shakeSoft: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-5px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(2px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'rise-in': 'rise 0.6s ease both',
        'shake-soft': 'shakeSoft 0.4s ease',
      },
      backgroundImage: {
        'campus-grid':
          'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
