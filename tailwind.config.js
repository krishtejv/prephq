/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          slate: '#5B6AD0',
          indigo: '#7B8CEE',
          lightBg: '#F7F6F3',
          darkBg: '#1A1B1E',
          cta: '#2B8A3E',
        },
        // Premium customized palette:
        accent: {
          light: '#5B6AD0',
          dark: '#7B8CEA',
          DEFAULT: '#5B6AD0',
        },
        cta: {
          DEFAULT: '#2B8A3E',
          hover: '#237032',
        },
        bg: {
          light: '#F7F6F3',
          dark: '#1A1B1E',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#25262B',
        },
        border: {
          light: '#E9ECEF',
          dark: '#2C2E33',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
