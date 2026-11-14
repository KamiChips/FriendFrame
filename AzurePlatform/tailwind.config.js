const { palette } = require("./constants/palette");

// convierte { light: {a}, dark: {a} } en { a: { light, dark } } para usar "bg-a-light dark:bg-a-dark"
const themed = Object.fromEntries(
  Object.keys(palette.light).map((token) => [
    token,
    { light: palette.light[token], dark: palette.dark[token] },
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: themed,
      fontFamily: {
        borel: ["Borel-regular"],
        spartan: ["LeagueSpartan-Regular"],
        "spartan-bold": ["LeagueSpartan-Bold"],
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
