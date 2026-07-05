/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['SF Mono', 'Geist Mono', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: {
          light: '#F7F6F3',
          dark: '#18181b',
        },
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
