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
        darkBg: '#111216',
        darkCard: '#191B21',
        darkBorder: '#262933',
        darkHover: '#22252E',
        accent: {
          orange: '#FF7A30',
          blue: '#35C9FF',
          purple: '#9B6CFF',
          green: '#35D07F',
          warning: '#FFC857',
          danger: '#FF5577',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255, 122, 48, 0.25)',
        'glow-blue': '0 0 20px rgba(53, 201, 255, 0.25)',
        'glow-purple': '0 0 20px rgba(155, 108, 255, 0.25)',
        'glow-green': '0 0 20px rgba(53, 208, 127, 0.25)',
        'glow-danger': '0 0 20px rgba(255, 85, 119, 0.25)',
      }
    },
  },
  plugins: [],
}
