/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1B3D',
          950: '#071126',
        },
        obsidian: {
          900: '#090D16',
          950: '#05070C',
        },
        cardinal: {
          DEFAULT: '#8C1515',
          dark: '#701010',
          light: '#FDF2F2',
          border: '#F87171',
        },
        forest: {
          DEFAULT: '#15803D',
          light: '#F0FDF4',
        },
        amber: {
          DEFAULT: '#B45309',
          light: '#FFFBEB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        elevated: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
        card: '0 10px 15px -3px rgba(15, 23, 42, 0.07), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
      },
    },
  },
  plugins: [],
}

