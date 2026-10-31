import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const sharedConfig: Config = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.env.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
  },
};

const config = async (): Promise<Config> => {
  const baseConfig = await createJestConfig(sharedConfig)();

  return {
    coverageProvider: 'v8',
    projects: [
      {
        ...baseConfig,
        displayName: 'app',
        testMatch: [
          '<rootDir>/app/**/__tests__/**/*.test.[jt]s?(x)',
          '<rootDir>/app/**/*.test.[jt]s?(x)',
        ],
      },
      {
        ...baseConfig,
        displayName: 'lib',
        testMatch: [
          '<rootDir>/lib/**/__tests__/**/*.test.[jt]s?(x)',
          '<rootDir>/lib/**/*.test.[jt]s?(x)',
        ],
      },
    ],
  };
};

export default config;
