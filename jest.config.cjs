/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.(ts|js)$": ["ts-jest", { useESM: true }],
  },
  extensionsToTreatAsEsm: [".ts"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,js}", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  verbose: true,
};
