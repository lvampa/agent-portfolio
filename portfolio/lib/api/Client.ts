import { REQUEST_TIMEOUT_MS } from './constants';
import { type ClientInterface } from './types';

export class Client implements ClientInterface {
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
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
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
