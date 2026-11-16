import { REQUEST_TIMEOUT_MS } from './constants';
import { HttpError } from './HttpError';

/** Resolves to the parsed JSON body, which callers validate. Rejects on a network error, a timeout, a cancel, or a non-2xx status. */
export class Client {
  constructor(private readonly baseURL: string) {}

  async get(path: string): Promise<unknown> {
    return this.request(path, { method: 'GET' });
  }

  /** `cancel` aborts the request without it counting as a timeout. */
  async post(path: string, payload: unknown, cancel?: AbortSignal): Promise<unknown> {
    return this.request(
      path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      cancel,
    );
  }

  private async request(path: string, init: RequestInit, cancel?: AbortSignal): Promise<unknown> {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const response = await fetch(this.urlFor(path), {
      ...init,
      signal: cancel ? AbortSignal.any([timeout, cancel]) : timeout,
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
