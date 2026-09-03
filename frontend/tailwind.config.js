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
        'obsidian': {
          900: '#070D0A',
          800: '#0F291E',
          700: '#12261A',
          600: '#1A3526',
        },
        // Use flat names so Tailwind generates bg-farm-green, text-farm-green etc.
        'farm-green': '#10B981',
        'farm-mint': '#34D399',
        'farm-amber': '#F59E0B',
        'farm-terra': '#D97706',
        'farm-sky': '#38BDF8',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'modal': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'card-hover': '0 20px 40px -10px rgba(16, 185, 129, 0.2)',
        'glow-green': '0 0 20px rgba(52, 211, 153, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(52, 211, 153, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(52, 211, 153, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
