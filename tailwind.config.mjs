/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0B1120',
          secondary: '#111827',
          card: '#1E293B',
        },
        // Color primario — neon yellow (ComfyUI)
        brand: {
          DEFAULT: '#E5FF00',
          light: '#F5FF66',
          dark: '#B3C700',
          glow: 'rgba(229,255,0,0.35)',
        },
        // Color secundario — azul neón
        neon: {
          DEFAULT: '#00E5FF',
          glow: 'rgba(0,229,255,0.3)',
        },
        // Color acento — rosa neón
        neo: {
          DEFAULT: '#FF2D95',
          glow: 'rgba(255,45,149,0.3)',
        },
        // Texto
        ink: {
          DEFAULT: '#FFFFFF',
          muted: '#B3B3B3',
          faint: '#555555',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        alt: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0B1120 0%, #11284A 50%, #0B1120 100%)',
        'card-gradient': 'linear-gradient(145deg, #1E293B, #0B1120)',
        'purple-glow': 'radial-gradient(circle at center, rgba(229,255,0,0.15) 0%, transparent 70%)',
        'neon-glow': 'radial-gradient(circle at center, rgba(0,229,255,0.1) 0%, transparent 70%)',
        'scan-lines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(229,255,0,0.015) 2px, rgba(229,255,0,0.015) 4px)',
      },
      animation: {
        'glitch': 'glitch 3s infinite',
        'glitch-2': 'glitch2 3s infinite',
        'pulse-brand': 'pulseBrand 2s ease-in-out infinite alternate',
        'scan': 'scan 8s linear infinite',
        'flicker': 'flicker 5s infinite',
        'float': 'float 6s ease-in-out infinite',
        'reveal': 'reveal 0.4s ease forwards',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { clipPath: 'inset(0 0 100% 0)', transform: 'translateX(0)' },
          '10%': { clipPath: 'inset(10% 0 80% 0)', transform: 'translateX(-3px)' },
          '20%': { clipPath: 'inset(30% 0 60% 0)', transform: 'translateX(3px)' },
          '30%': { clipPath: 'inset(50% 0 40% 0)', transform: 'translateX(-3px)' },
          '40%': { clipPath: 'inset(70% 0 10% 0)', transform: 'translateX(3px)' },
          '50%': { clipPath: 'inset(0 0 0 0)', transform: 'translateX(0)' },
        },
        glitch2: {
          '0%, 100%': { clipPath: 'inset(0 0 100% 0)', transform: 'translateX(0)' },
          '15%': { clipPath: 'inset(20% 0 70% 0)', transform: 'translateX(3px)' },
          '25%': { clipPath: 'inset(40% 0 50% 0)', transform: 'translateX(-3px)' },
          '35%': { clipPath: 'inset(60% 0 30% 0)', transform: 'translateX(3px)' },
          '45%': { clipPath: 'inset(80% 0 5% 0)', transform: 'translateX(-3px)' },
          '55%': { clipPath: 'inset(0 0 0 0)', transform: 'translateX(0)' },
        },
        pulseBrand: {
          from: { boxShadow: '0 0 10px rgba(229,255,0,0.4), 0 0 20px rgba(229,255,0,0.2)' },
          to:   { boxShadow: '0 0 20px rgba(229,255,0,0.7), 0 0 40px rgba(229,255,0,0.3)' },
        },
        scan: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100px' },
        },
        flicker: {
          '0%, 95%, 100%': { opacity: '1' },
          '96%': { opacity: '0.8' },
          '97%': { opacity: '1' },
          '98%': { opacity: '0.6' },
          '99%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        reveal: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'brand': '0 0 20px rgba(229,255,0,0.5), 0 0 40px rgba(229,255,0,0.2)',
        'neon': '0 0 20px rgba(0,229,255,0.5), 0 0 40px rgba(0,229,255,0.2)',
        'neo': '0 0 20px rgba(255,45,149,0.5)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
