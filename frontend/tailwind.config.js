/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilitar dark mode con clase 'dark'
  theme: {
    extend: {
      // Breakpoints optimizados para móviles modernos
      screens: {
        'xs': '375px',   // iPhone SE, Galaxy S8
        'sm': '640px',   // Tablets pequeñas
        'md': '768px',   // iPad, tablets
        'lg': '1024px',  // Laptops pequeñas
        'xl': '1280px',  // Laptops
        '2xl': '1536px', // Monitores grandes
      },
      // Espaciado seguro para notches
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}
