import { HttpError } from '@lib/api/Client';

import type { ChatFailure } from './types';

const TOO_MANY_REQUESTS = 429;

/** fetch rejects with a TypeError for a network or CORS failure, and AbortSignal.timeout with a TimeoutError. */
export function toChatFailure(caught: unknown): ChatFailure {
  if (caught instanceof DOMException && caught.name === 'TimeoutError') return 'timeout';
  if (caught instanceof TypeError) return 'network';
  if (caught instanceof HttpError && caught.status === TOO_MANY_REQUESTS) return 'quota';
  return 'server';
}
