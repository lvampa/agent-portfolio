/** Carries the status, so callers can tell a rate limit from a server failure. */
export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Request failed with status ${status}`);
    this.name = 'HttpError';
  }
}
