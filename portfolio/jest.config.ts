import type { Config } from 'jest';
import nextJest from 'next/jest.js';

process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL ??= 'https://chat.example.com/';

const createJestConfig = nextJest({
  dir: './',
});

const sharedConfig: Config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@terminal/(.*)$': '<rootDir>/terminal/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
  },
};

const jestConfig = async (): Promise<Config> => {
  const baseConfig = await createJestConfig(sharedConfig)();

  return {
    coverageProvider: 'v8',
    projects: [
      {
        ...baseConfig,
        displayName: 'terminal',
        testMatch: [
          '<rootDir>/terminal/**/__tests__/**/*.test.[jt]s?(x)',
          '<rootDir>/terminal/**/*.test.[jt]s?(x)',
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

export default jestConfig;
