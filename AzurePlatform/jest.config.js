module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/__mocks__/setup.ts"],
  testMatch: ["**/__tests__/**/*-test.{ts,tsx}"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/fileMock.ts",
    "@react-native-async-storage/async-storage":
      "<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock",
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "components/**/*.{ts,tsx}",
    "screens/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/*.d.ts",
  ],
};
