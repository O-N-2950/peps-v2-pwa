/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'peps-primary': '#FF6B35',
        'peps-light': '#FFE5D9',
        'peps-dark': '#2C3E50',
        'peps-accent': '#FFD700'
      }
    },
  },
  plugins: [],
}
