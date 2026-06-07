require("dotenv").config({
    path: require("path").resolve(__dirname, ".env.test")
});

module.exports = {
    displayName: "integration",

    preset: "jest-expo",

    testMatch: [
        "**/__tests__/integration/**/*-test.ts"
    ],

    testEnvironment: "node",

    testTimeout: 15000,

    setupFiles: [
        "<rootDir>/__tests__/integration/helpers/setup.ts"
    ],

    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",

        "@react-native-async-storage/async-storage":
        "<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock"
    },

    collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",

    "!**/*.d.ts",
    "!**/__tests__/**",
    "!**/__mocks__/**"
]
};