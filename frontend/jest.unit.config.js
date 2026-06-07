module.exports = {
    displayName: "unit",
    preset: "jest-expo",

    setupFilesAfterEnv: [
        "<rootDir>/__mocks__/setup.ts"
    ],

    testMatch: [
        "**/__tests__/unit/**/*-test.ts",
        "**/__tests__/components/**/*-test.ts"
    ],

    testPathIgnorePatterns: [
        "/node_modules/",
        "__tests__/integration/helpers/"
    ],

    moduleNameMapper: {
        "\\.(css|less|scss|sass)$":
        "<rootDir>/__mocks__/fileMock.ts",

        "@react-native-async-storage/async-storage":
        "<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock",

        "^@/(.*)$": "<rootDir>/$1"
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