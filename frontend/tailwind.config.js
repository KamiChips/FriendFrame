/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",   
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors:{
        background:{
          light: "#FAFAFA", //Color blanco
          dark: "#182240", //Color azul obscuro
          semidark: "#1D2A4F",
          gray: "#F0EDED",
        },
        primary:{
          light:"#30C2D9", //Color cyan (para los hombres azul) 
          dark: "#FF9B42", //Color naranja fosfo
        },
        secondary:{
          light:"#FF9B42", //Color naranja fosfo
          dark:"#115A67", //Color cyan oscuro
        },
        tertiary:{
          dark: "#AA3E14", //Color naranja obscuro
        },
      },
      fontFamily:{
        borel:["Borel-regular"],
        spartan: ["LeagueSpartan-Regular"],
        "spartan-bold": ["LeagueSpartan-Bold"],
      }
    },
  },
  darkMode: "class",
  plugins: [],
};