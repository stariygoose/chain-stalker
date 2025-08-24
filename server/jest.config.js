const config = {
  collectCoverage: true,
  preset: "ts-jest/presets/default-esm",

  moduleNameMapper: {
    "^#(.*)\\.js$": "<rootDir>/src/$1.ts",
  },

  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/config/**/*.{ts,js}",
    "!src/utils/**/*.{ts,js}",
    "!**/node_modules/**",
  ],

  coverageProvider: "babel",
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },

  testMatch: ["**/__tests__/**/*.test.ts"],

  maxConcurrency: 10,
  testEnvironment: "node",
  verbose: true,
};

export default config;

