import { Client } from '../Client';
import { REQUEST_TIMEOUT_MS } from '../constants';

// jsdom has no Response, so this has only the fields Client reads.
function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('Client', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('post sends JSON with a timeout and returns the parsed body', async () => {
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout');
    fetchSpy.mockResolvedValue(jsonResponse([{ output: 'hi' }]));

    const body = await new Client('https://agent.example.com/webhook/abc').post('webhooks', {
      chatInput: 'hello',
    });

    const [, init] = fetchSpy.mock.calls[0];
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput: 'hello' }),
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(timeoutSpy).toHaveBeenCalledWith(REQUEST_TIMEOUT_MS);
    expect(body).toEqual([{ output: 'hi' }]);
  });

  // A plain new URL(path, base) would drop the base's last segment, so the path is appended instead.
  test.each([
    ['https://x/webhook', 'webhooks'],
    ['https://x/webhook/', 'webhooks'],
    ['https://x/webhook', '/webhooks'],
    ['https://x/webhook/', '/webhooks'],
  ])('base %p plus path %p is https://x/webhook/webhooks', async (base, path) => {
    fetchSpy.mockResolvedValue(jsonResponse([]));

    await new Client(base).post(path, {});

    expect(String(fetchSpy.mock.calls[0][0])).toBe('https://x/webhook/webhooks');
  });

  test('a relative base such as /info resolves against the page origin', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ timestamp: 'now' }));

    await new Client('/info').get('');

    expect(String(fetchSpy.mock.calls[0][0])).toBe(`${window.location.origin}/info`);
  });

  test('a non-2xx status rejects, so callers treat it as a failure', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ error: 'nope' }, 502));

    await expect(new Client('/info').get('')).rejects.toThrow('Request failed with status 502');
  });
});
