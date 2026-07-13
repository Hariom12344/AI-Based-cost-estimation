/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#070b1a',
        glow: '#4f7cff',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(31, 38, 135, 0.22)',
      },
    },
  },
  plugins: [],
}
