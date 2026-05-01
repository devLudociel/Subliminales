/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg:           '#fef0f4',
        pink:         '#f72585',
        mint:         '#4cc9a0',
        dark:         '#111111',
        mid:          '#666666',
        'light-pink': '#fde8f0',
        'mint-light': '#e0f7f0',
      },
      fontFamily: {
        marker: ['"Permanent Marker"', 'cursive'],
        hand:   ['Caveat', 'cursive'],
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
        hard:    '2px 2px 0 #111111',
        'hard-lg': '4px 4px 0 #111111',
      },
    },
  },
  plugins: [],
};
