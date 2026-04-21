/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          500: '#4f6df4',
          600: '#3a55d6',
          700: '#2d43ad',
          900: '#1b2766',
        },
      },
    },
  },
  plugins: [],
}
