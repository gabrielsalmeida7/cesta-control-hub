import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.app.json' }],
    '^.+\.(js|jsx)$': 'babel-jest', // If you have JS/JSX files
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
  },
  setupFiles: ['./src/__mocks__/localStorage.ts'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@supabase/supabase-js)/)', // Example: if supabase needs transforming
  ],
  globals: {
    // Optional: if you need to define global variables for tests
  },
  clearMocks: true, // Automatically clear mock calls and instances between every test
  coverageProvider: 'v8', // or 'babel'
  // Optional: collect coverage from specific files
  // collectCoverageFrom: [
  //   'src/**/*.{ts,tsx}',
  //   '!src/**/*.d.ts',
  //   '!src/main.tsx', // No need to cover the main entry point
  // ],
};

export default config;
