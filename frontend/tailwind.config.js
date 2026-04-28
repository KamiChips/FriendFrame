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

/*
Como utilizar el dark mode y fonts:
  - Para utilizar dark mode es lo siguiente:
    Dentro de la linea de tailwind style se agrega "dark:"
    para indicar los colores que se van a utilizar cuando la 
    preferencia sea en modo dark y en cuanto a light mode se 
    utiliza tailwind como siempre sin necesidad de agregar "light:"

    EJEMPLO PARA UTILIZAR COLORES Y CLASE DARK:
    className="bg-background-light dark:bg-background-dark"

    bg -> clase de tailwind
    background -> es una de las propiedades que defini dentro de tailwind.config 
    light -> Propiedad que se encuentra dentro de background

Como utilizar los fonts: 
  - Pra utilizar font que descargamos:
    Se debe de utilizar de la siguiente manera:
    "font-borel"
    "font-spartan"
    "font-spartan-bold"

    dentro de className de tailwind
*/