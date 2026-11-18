// expo-image no tiene vista nativa en jest; se sustituye por un componente host que conserva sus props
jest.mock("expo-image", () => ({ Image: "ExpoImage" }));

// en la app, el css compilado de tailwind declara darkMode "class"; en jest no hay css, se declara aqui
const { StyleSheet } = require("react-native-css-interop");
StyleSheet.registerCompiled({ $compiled: true, flags: { darkMode: "class" } });
