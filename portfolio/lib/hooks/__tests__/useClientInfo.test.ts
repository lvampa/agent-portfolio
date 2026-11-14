import { infoClient } from '@lib/api';
import { getParsedUA } from '@lib/utils/clientInfo';
import type { ParsedUA } from '@lib/utils/types';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useClientInfo } from '../useClientInfo';

jest.mock('@lib/api', () => ({ infoClient: { get: jest.fn() } }));
jest.mock('@lib/utils/clientInfo', () => ({
  getParsedUA: jest.fn(),
  getReferrer: () => 'Direct',
}));

const mockedGet = infoClient.get as jest.Mock;
const mockedGetParsedUA = getParsedUA as jest.Mock;

const PARSED_UA: ParsedUA = {
  ua: 'Mozilla/5.0',
  browser: { name: 'Chrome' },
  os: {},
  device: {},
  engine: {},
  cpu: {},
};

describe('useClientInfo', () => {
  test('a failed /info still waits for the lazy UA parse before loading ends', async () => {
    let resolveUA: (parsedUA: ParsedUA) => void = () => {};
    mockedGetParsedUA.mockReturnValue(new Promise((resolve) => (resolveUA = resolve)));
    mockedGet.mockRejectedValue(new Error('no /info'));

    const { result } = renderHook(() => useClientInfo());
    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    // Let the /info rejection settle before checking that loading has not ended early.
    await act(async () => {});
    expect(result.current.isLoading).toBe(true);

    await act(async () => resolveUA(PARSED_UA));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.userInfo.parsedUA).toEqual(PARSED_UA);
  });
});
