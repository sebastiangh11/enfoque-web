/**
 * Tailwind v4 uses CSS-first configuration via @theme in your CSS file.
 * This file is NOT loaded by @tailwindcss/vite. Custom colors are defined
 * in src/styles/global.css inside an @theme { } block.
 *
 * Kept for reference or if you later switch to Tailwind v3.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        enfoque: {
          orange: "#F28500",
          indigo: "#2E2A78",
          green: "#009245",
        },
      },
    },
  },
  plugins: [],
};
