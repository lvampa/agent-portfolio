const CHAT_URL = 'NEXT_PUBLIC_CHAT_WEBHOOK_URL';
const INFO_URL = 'NEXT_PUBLIC_INFO_URL';

// The module validates env at load, so each test needs a fresh copy.
const loadApi = () => import('@lib/api');

describe('lib/api env validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env[CHAT_URL] = 'https://chat.example.com/';
    process.env[INFO_URL] = 'https://info.example.com/';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('loads when both URLs are set', async () => {
    const { chatClient, infoClient } = await loadApi();

    expect(chatClient).toBeDefined();
    expect(infoClient).toBeDefined();
  });

  test.each([CHAT_URL, INFO_URL])('throws at load when %s is missing', async (name) => {
    delete process.env[name];

    await expect(loadApi()).rejects.toThrow();
  });
});
