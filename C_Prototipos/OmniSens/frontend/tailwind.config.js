/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00A5CF', // Turquesa / Cyan corporativo
        secondary: '#004e64', // Azul oscuro intermedio
        dark: '#0b1329', // Azul marino profundo para tarjetas
        darker: '#050814', // Azul casi negro para fondo general
        accent: '#00b4d8', // Cyan claro para hover
      }
    },
  },
  plugins: [],
}
