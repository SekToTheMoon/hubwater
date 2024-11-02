/** @type {import('tailwindcss').Config} */
export default {
  //อันเก่า
  // content: ["./src/**/*.{js,jsx,ts,tsx}"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        fadeinleft: "fade-in-left 1s ease-in-out 0.25s 1",
        spin90: "spin90 0.25s linear 0s 1",
      },

      keyframes: {
        "fade-in-left": {
          "0%": {
            opacity: 0,
            transform: "translate3d(-100%, 0, 0)",
          },
          "100%": {
            opacity: 1,
            transform: "translate3d(0, 0, 0)",
          },
        },
        spin90: {
          "0%": { transform: "rotate(-30.0deg)" },
          "50%": { transform: "rotate(-15.0deg)" },
          "100%": { transform: "rotate(0.0deg)" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["dark", "emerald"],
  },
};
