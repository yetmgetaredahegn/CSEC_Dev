/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"IBM Plex Sans"', '"Arial Narrow"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
