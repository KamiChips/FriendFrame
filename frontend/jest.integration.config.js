require("dotenv").config({ 
    path: require("path").resolve(__dirname, ".env.test") 
});

module.exports = {
    preset: "jest-expo",
    testMatch: ["**/__tests__/integration/**/*-test.ts"],
    testEnvironment: "node",
    testTimeout: 15000,
    setupFiles: ["<rootDir>/__tests__/integration/helpers/setup.ts"],
    moduleNameMapper: {
        "@react-native-async-storage/async-storage": "<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock"
    },
    "collectCoverage": true,
    "collectCoverageFrom": [
        "**/*.{ts,tsx,js,jsx}",
        "!**/coverage/**",
        "!**/node_modules/**",
        "!**/babel.config.js",
        "!**/expo-env.d.ts",
        "!**/.expo/**"
    ]
};