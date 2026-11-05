import { Client } from '../Client';
import { REQUEST_TIMEOUT_MS } from '../constants';

const mockedFetch = jest.fn();

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('Client', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    globalThis.fetch = mockedFetch;
    // jsdom has no AbortSignal.timeout, which every current browser has.
    AbortSignal.timeout = jest.fn(() => new AbortController().signal);
  });

  test('post sends JSON to the base plus path and returns the parsed body', async () => {
    mockedFetch.mockResolvedValue(jsonResponse([{ output: 'hi' }]));

    const body = await new Client('https://agent.example.com/webhook/abc').post('webhooks', {
      chatInput: 'hello',
    });

    const [url, init] = mockedFetch.mock.calls[0];
    expect(String(url)).toBe('https://agent.example.com/webhook/abc/webhooks');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput: 'hello' }),
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(AbortSignal.timeout).toHaveBeenCalledWith(REQUEST_TIMEOUT_MS);
    expect(body).toEqual([{ output: 'hi' }]);
  });

  test('a relative base such as /info resolves against the page origin', async () => {
    mockedFetch.mockResolvedValue(jsonResponse({ timestamp: 'now' }));

    await new Client('/info').get('');

    expect(String(mockedFetch.mock.calls[0][0])).toBe(`${window.location.origin}/info`);
  });

  test('a non-2xx status rejects, so callers treat it as a failure', async () => {
    mockedFetch.mockResolvedValue(jsonResponse({ error: 'nope' }, 502));

    await expect(new Client('/info').get('')).rejects.toThrow('Request failed with status 502');
  });
});
