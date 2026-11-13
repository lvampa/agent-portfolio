// Imported by file, not from @lib/api, so this stays free of the clients and their env check.
import { TOO_MANY_REQUESTS } from '@lib/api/constants';
import { HttpError } from '@lib/api/HttpError';

import type { ChatFailure } from './types';

/** fetch rejects with a TypeError for a network or CORS failure, and AbortSignal.timeout with a TimeoutError. */
export function toChatFailure(caught: unknown): ChatFailure {
  if (caught instanceof DOMException && caught.name === 'TimeoutError') return 'timeout';
  if (caught instanceof TypeError) return 'network';
  if (caught instanceof HttpError && caught.status === TOO_MANY_REQUESTS) return 'quota';
  return 'server';
}
