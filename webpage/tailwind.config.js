/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        1368: "1368px",
      },
    },
  },
  plugins: [require("daisyui")],
};
