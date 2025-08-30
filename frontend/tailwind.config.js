/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#42b883',
        'primary-dark': '#35a372',
        secondary: '#03DAC6',
        'secondary-dark': '#018786',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
  // Important: Tailwind needs to work alongside Vuetify
  important: true,
  prefix: 'tw-',
}