const CHAT_URL = 'NEXT_PUBLIC_CHAT_WEBHOOK_URL';

const loadEnv = () => import('@lib/env');

describe('env', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env[CHAT_URL] = 'https://chat.example.com/';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('loads when the URL is set', async () => {
    const { env } = await loadEnv();
    expect(env.NEXT_PUBLIC_CHAT_WEBHOOK_URL).toBe('https://chat.example.com/');
  });

  test.each([
    ['missing', undefined],
    ['empty', ''],
    ['not a URL', 'chat'],
  ])('throws at load when the URL is %s', async (_case, value) => {
    if (value === undefined) delete process.env[CHAT_URL];
    else process.env[CHAT_URL] = value;

    await expect(loadEnv()).rejects.toThrow('Invalid environment variables');
  });
});
