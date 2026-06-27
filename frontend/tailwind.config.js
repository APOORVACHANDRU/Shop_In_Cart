/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pink: {
          brand: "#ff3f6c",
          hover: "#e5355f",
        },
        dark: "#1a1a2e",
      },
    },
  },
  plugins: [],
};
