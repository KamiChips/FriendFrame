module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/__mocks__/setup.ts"],
  testMatch: ["**/__tests__/**/*-test.{ts,tsx}"],
  moduleNameMapper: {
    "\.(css|less|scss|sass)$": "<rootDir>/__mocks__/fileMock.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "components/**/*.{ts,tsx}",
    "screens/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "!**/*.d.ts",
  ],
};
