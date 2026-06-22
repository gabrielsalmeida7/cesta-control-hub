/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#004E64',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F2F2F2',
          foreground: '#1F2937',
        },
        success: {
          DEFAULT: '#007F5F',
          foreground: '#FFFFFF',
        },
        danger: {
          DEFAULT: '#EF476F',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
        background: '#FFFFFF',
        foreground: '#0F172A',
        border: '#E5E7EB',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'Inter_600SemiBold', 'Inter_700Bold', 'sans-serif'],
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
    },
  },
  plugins: [],
};
