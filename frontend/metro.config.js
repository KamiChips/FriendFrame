const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
console.log("METRO CONFIG LOADED");

const config = getDefaultConfig(__dirname)
 
module.exports = withNativeWind(config, { input: './global.css' })