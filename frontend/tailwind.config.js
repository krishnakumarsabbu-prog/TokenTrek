/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#0B1F3A',
          hover: '#162d4a',
          active: '#1a3a5c',
          border: '#1e3555',
          text: '#8ba3be',
          textActive: '#ffffff',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0078d4',
          600: '#006cbd',
          700: '#005fa3',
        },
        content: {
          bg: '#f0f4f8',
          card: '#ffffff',
          border: '#e5eaf0',
          text: '#0d1f30',
          secondary: '#4a6480',
          muted: '#8ba3be',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 30, 60, 0.06), 0 1px 2px rgba(0, 30, 60, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 30, 60, 0.1), 0 2px 4px rgba(0, 30, 60, 0.06)',
        'card-lg': '0 8px 32px rgba(0, 30, 60, 0.12)',
        dropdown: '0 4px 20px rgba(0, 30, 60, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
