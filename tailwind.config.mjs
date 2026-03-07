/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c2d1ff',
          300: '#9db1ff',
          400: '#7a8eff',
          500: '#5c6aff',
          600: '#4348f5',
          700: '#3735dc',
          800: '#2d2cb2',
          900: '#29298c',
          950: '#181852',
        },
        accent: {
          DEFAULT: '#a855f7',
          light: '#d8b4fe',
          dark: '#7e22ce',
        },
        dark: {
          DEFAULT: '#0d0d1a',
          card: '#13132b',
          border: '#1e1e3f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Raleway', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0d0d1a 0%, #13132b 50%, #1a1040 100%)',
        'card-gradient': 'linear-gradient(145deg, #13132b, #0d0d1a)',
        'purple-glow': 'radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(168,85,247,0.3)' },
          to: { boxShadow: '0 0 25px rgba(168,85,247,0.7)' },
        },
      },
    },
  },
  plugins: [],
};
