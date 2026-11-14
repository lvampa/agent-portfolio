import { REQUEST_TIMEOUT_MS } from './constants';
import { HttpError } from './HttpError';

/** Resolves to the parsed JSON body, which callers validate. Rejects on a network error, a timeout, or a non-2xx status. */
export class Client {
  constructor(private readonly baseURL: string) {}

  async get(path: string): Promise<unknown> {
    return this.request(path, { method: 'GET' });
  }

  async post(path: string, payload: unknown): Promise<unknown> {
    return this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const response = await fetch(this.urlFor(path), {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new HttpError(response.status);
    return response.json();
  }

  /**
   * Appends the path to the base like axios did, so a base without a trailing slash keeps its last segment.
   * A relative base such as /info resolves against the page's origin.
   */
  private urlFor(path: string): URL {
    const joined = path
      ? `${this.baseURL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
      : this.baseURL;
    return new URL(joined, window.location.origin);
  }
}
