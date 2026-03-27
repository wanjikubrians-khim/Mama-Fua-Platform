// Mama Fua — Jest Configuration
// KhimTech | QA: Maryann Wanjiru | 2026

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
  ],
  moduleNameMapper: {
    '^@mama-fua/shared$': '<rootDir>/../../shared/src/index.ts',
    '^@mama-fua/database$': '<rootDir>/../../database/src/index.ts',
  },
  setupFiles: ['<rootDir>/__tests__/helpers/env.setup.ts'],
  globalSetup: '<rootDir>/__tests__/helpers/global.setup.ts',
  globalTeardown: '<rootDir>/__tests__/helpers/global.teardown.ts',
  coverageDirectory: '../coverage',
  collectCoverageFrom: [
    'services/**/*.ts',
    'routes/**/*.ts',
    'middleware/**/*.ts',
    'lib/**/*.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 75, lines: 75, statements: 75 },
  },
  testTimeout: 15000,
  verbose: true,
};
