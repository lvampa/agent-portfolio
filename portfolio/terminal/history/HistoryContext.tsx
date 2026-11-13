'use client';

import { historyStore, isHistoryDisabled } from '@terminal/storage';
import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { EMPTY_STATE } from './constants';
import { HistoryItemSchema } from './schemas';
import type { HistoryItem, HistoryState } from './types';

interface HistoryContextValue extends HistoryState {
  hasLoaded: boolean;
  append: (item: HistoryItem) => void;
  clear: () => void;
  /** Ignores calls from an earlier generation or behind the cursor, so a row finishing late after a clear cannot move the new cursor. */
  markRevealed: (generation: number, count: number) => void;
  revealAll: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

function loadHistory(): HistoryItem[] {
  if (!isHistoryDisabled()) return historyStore.load(HistoryItemSchema);
  historyStore.clear();
  return [];
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HistoryState>(EMPTY_STATE);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = loadHistory();
    startTransition(() => {
      setState((previous) => ({ ...previous, items: stored, revealedCount: stored.length }));
      setHasLoaded(true);
    });
  }, []);

  const append = useCallback((item: HistoryItem) => {
    setState((previous) => ({ ...previous, items: [...previous.items, item] }));
    historyStore.append(item);
  }, []);

  const clear = useCallback(() => {
    setState((previous) => ({ items: [], revealedCount: 0, generation: previous.generation + 1 }));
    historyStore.clear();
  }, []);

  const markRevealed = useCallback((generation: number, count: number) => {
    setState((previous) =>
      previous.generation === generation && count > previous.revealedCount
        ? { ...previous, revealedCount: count }
        : previous,
    );
  }, []);

  const revealAll = useCallback(() => {
    setState((previous) => ({ ...previous, revealedCount: previous.items.length }));
  }, []);

  const value = useMemo(
    () => ({ ...state, hasLoaded, append, clear, markRevealed, revealAll }),
    [state, hasLoaded, append, clear, markRevealed, revealAll],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
}
