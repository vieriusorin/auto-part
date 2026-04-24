/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#0f172a',
        accent: '#facc15',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        surface: {
          DEFAULT: '#f8fafc',
          dark: '#0f172a',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#111827',
        },
        cardMuted: {
          DEFAULT: '#f1f5f9',
          dark: '#1e293b',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      spacing: {
        xxs: '4px',
      },
      fontSize: {
        h1: ['24px', { lineHeight: '30px' }],
        h2: ['20px', { lineHeight: '26px' }],
        h3: ['18px', { lineHeight: '24px' }],
        body: ['14px', { lineHeight: '20px' }],
        bodysm: ['13px', { lineHeight: '18px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
    },
  },
  plugins: [],
}
