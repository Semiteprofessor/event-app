import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,js}", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  verbose: true,
};

export default config;
