const CHAT_URL = 'NEXT_PUBLIC_CHAT_WEBHOOK_URL';
const INFO_URL = 'NEXT_PUBLIC_INFO_URL';

describe('lib/api env validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('builds the clients from the env URLs', () => {
    process.env[CHAT_URL] = 'https://chat.example.com/';
    process.env[INFO_URL] = 'https://info.example.com/';

    const { chatClient, infoClient } = require('@lib/api');

    expect(chatClient.getWebhookUrl()).toBe('https://chat.example.com/');
    expect(infoClient.getWebhookUrl()).toBe('https://info.example.com/');
  });

  test.each([CHAT_URL, INFO_URL])('throws at load when %s is missing', (name) => {
    delete process.env[name];

    expect(() => require('@lib/api')).toThrow();
  });
});
