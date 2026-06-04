module.exports = {
    preset: "jest-expo",
    testMatch: ["**/__tests__/integration/*-test.ts"],
    testEnvironment: "node",
    testTimeout: 15000,
    setupFiles: ["<rootDir>/__tests__/integration/helpers/setup.ts"],
    moduleNameMapper: {
        "@react-native-async-storage/async-storage": "<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock"
    }
};