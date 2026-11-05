import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import React from 'react';

import { HistoryProvider, useHistory } from '@terminal/history/HistoryContext';
import { historyStore } from '@terminal/storage';

jest.mock('@terminal/storage', () => ({
  historyStore: {
    load: jest.fn(() => []),
    append: jest.fn(),
    clear: jest.fn(),
  },
}));

const mockedLoad = historyStore.load as jest.Mock;
const mockedAppend = historyStore.append as jest.Mock;

function wrapper({ children }: { children: ReactNode }) {
  return <HistoryProvider>{children}</HistoryProvider>;
}

describe('HistoryContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoad.mockReturnValue([]);
  });

  describe('on mount', () => {
    test('exposes empty items when storage is empty', () => {
      mockedLoad.mockReturnValue([]);
      const { result } = renderHook(() => useHistory(), { wrapper });
      expect(result.current.items).toEqual([]);
    });

    test('seeds items from storage when history exists', async () => {
      const storedItems = [{ type: 'text' as const, text: 'hello' }];
      mockedLoad.mockReturnValue(storedItems);
      const { result } = renderHook(() => useHistory(), { wrapper });
      await act(async () => {});
      expect(result.current.items).toEqual(storedItems);
    });

    test('hasLoaded is true after storage check', async () => {
      const { result } = renderHook(() => useHistory(), { wrapper });
      await act(async () => {});
      expect(result.current.hasLoaded).toBe(true);
    });
  });

  describe('append', () => {
    test('adds item to items', () => {
      const { result } = renderHook(() => useHistory(), { wrapper });
      const item = { type: 'text' as const, text: 'hello' };
      act(() => result.current.append(item));
      expect(result.current.items).toContainEqual(item);
    });

    test('persists item to storage', () => {
      const { result } = renderHook(() => useHistory(), { wrapper });
      const item = { type: 'text' as const, text: 'hello' };
      act(() => result.current.append(item));
      expect(mockedAppend).toHaveBeenCalledWith(item);
    });

    test('appends to existing items', () => {
      const first = { type: 'text' as const, text: 'first' };
      const second = { type: 'message' as const, text: 'second' };
      const { result } = renderHook(() => useHistory(), { wrapper });
      act(() => result.current.append(first));
      act(() => result.current.append(second));
      expect(result.current.items).toEqual([first, second]);
    });
  });

  describe('useHistory outside provider', () => {
    test('throws when used outside HistoryProvider', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useHistory())).toThrow(
        'useHistory must be used within HistoryProvider',
      );
      spy.mockRestore();
    });
  });
});
