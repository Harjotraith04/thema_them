/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          light: '#93c5fd',
          dark: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#6b7280',
          light: '#9ca3af',
          dark: '#4b5563',
        },
        background: {
          DEFAULT: '#f9fafb',
          dark: '#1e293b',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f172a',
        },
      },
      boxShadow: {
        card: '0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
