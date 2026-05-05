/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10b981', // Emerald 500
        dark: '#1e293b', // Slate 800
        darker: '#0f172a', // Slate 900
      }
    },
  },
  plugins: [],
}
