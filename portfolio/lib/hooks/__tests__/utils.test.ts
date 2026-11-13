import { HttpError } from '@lib/api/HttpError';
import { toChatFailure } from '@lib/hooks/utils';

describe('toChatFailure', () => {
  test.each([
    [new DOMException('timed out', 'TimeoutError'), 'timeout'],
    [new TypeError('Failed to fetch'), 'network'],
    [new HttpError(429), 'quota'],
    [new HttpError(500), 'server'],
  ])('classifies %p as %s', (caught, failure) => {
    expect(toChatFailure(caught)).toBe(failure);
  });
});
