/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8fc',
          100: '#d7eff8',
          200: '#b4e0f2',
          300: '#81cbe9',
          400: '#46afdc',
          500: '#087DC1', // Primary blue
          600: '#0055B8', // Deep blue
          700: '#044c8b',
          800: '#074073',
          900: '#0c3660',
          950: '#082340',
        },
        charcoal: {
          50: '#f6f7f8',
          100: '#eceff1',
          200: '#d8dee2',
          300: '#b7c3cb',
          400: '#8fa2b0',
          500: '#6f8495',
          600: '#586b7b',
          700: '#475664',
          800: '#3c4854',
          900: '#252D33', // Charcoal brand
          950: '#171c21',
        },
        surface: {
          50: '#F5F8FC', // Brand background
          100: '#eef2f8',
          200: '#e2e8f2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(8, 125, 193, 0.08), 0 2px 4px -2px rgba(8, 125, 193, 0.06)',
        'enterprise': '0 10px 25px -5px rgba(0, 85, 184, 0.08), 0 8px 10px -6px rgba(0, 85, 184, 0.04)',
      }
    },
  },
  plugins: [],
}
