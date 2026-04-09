/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eecol-blue': '#0058B3',
        'eecol-light-blue': '#F0F8FF',
      },
    },
  },
  plugins: [],
}
