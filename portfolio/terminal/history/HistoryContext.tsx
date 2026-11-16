'use client';

import { historyStore, isHistoryDisabled } from '@terminal/storage';
import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { EMPTY_STATE } from './constants';
import { HistoryItemSchema } from './schemas';
import type { HistoryItem, HistoryState, RevealingRow } from './types';
import { cutRevealingMessage } from './utils';

interface HistoryContextValue extends HistoryState {
  hasLoaded: boolean;
  append: (item: HistoryItem) => void;
  clear: () => void;
  /** Ignores calls from an earlier generation or behind the cursor, so a row finishing late after a clear cannot move the new cursor. */
  markRevealed: (generation: number, count: number) => void;
  revealAll: () => void;
  /** Records where the row being revealed has got. Kept in a ref, so each tick does not re-render the context. */
  reportRevealing: (row: RevealingRow) => void;
  /** Cuts the reply being streamed where it is, saves it that way, and shows everything else at once. */
  stopReveal: () => void;
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
  const revealingRowRef = useRef<RevealingRow | null>(null);

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

  const reportRevealing = useCallback((row: RevealingRow) => {
    revealingRowRef.current = row;
  }, []);

  const stopReveal = useCallback(() => {
    const cutItems = cutRevealingMessage(state.items, revealingRowRef.current);
    if (cutItems !== state.items) historyStore.save(cutItems);
    setState((previous) => {
      const items = cutRevealingMessage(previous.items, revealingRowRef.current);
      return { ...previous, items, revealedCount: items.length };
    });
  }, [state.items]);

  const value = useMemo(
    () => ({
      ...state,
      hasLoaded,
      append,
      clear,
      markRevealed,
      revealAll,
      reportRevealing,
      stopReveal,
    }),
    [state, hasLoaded, append, clear, markRevealed, revealAll, reportRevealing, stopReveal],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
}
