/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg:           '#0A0A0A',
        pink:         '#FF008C',
        mint:         '#00D9FF',
        yellow:       '#FFE600',
        violet:       '#7A2FFF',
        dark:         '#F5F5F5',
        mid:          '#A7A7A7',
        smoke:        '#2D2D2D',
        'light-pink': '#180B13',
        'mint-light': '#071B21',
      },
      fontFamily: {
        marker: ['"Archivo Black"', '"Space Grotesk"', 'sans-serif'],
        hand:   ['"IBM Plex Mono"', '"Space Grotesk"', 'monospace'],
        sans:   ['"Space Grotesk"', 'sans-serif'],
      },
      animation: {
        ticker: 'ticker 28s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      boxShadow: {
        hard:    '3px 3px 0 #FF008C, -2px -2px 0 rgba(0,217,255,.45)',
        'hard-lg': '6px 6px 0 #FF008C, -4px -4px 0 rgba(0,217,255,.55)',
      },
    },
  },
  plugins: [],
};
