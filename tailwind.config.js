/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#08090B',
        charcoal: '#111318',
        graphite: '#1A1C22',
        ivory: '#F5F5F7',
        muted: '#A1A1AA',
        violet: '#8B5CF6',
        cyan: '#38BDF8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'sans-serif'],
        editorial: ['Manrope', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
