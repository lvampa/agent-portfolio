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

import { HistoryItemSchema } from './schemas';
import type { HistoryItem } from './types';

interface HistoryContextValue {
  items: HistoryItem[];
  /** Items before this index came from storage, so they were already seen on an earlier visit. */
  restoredCount: number;
  hasLoaded: boolean;
  append: (item: HistoryItem) => void;
  clear: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

function loadHistory(): HistoryItem[] {
  if (!isHistoryDisabled()) return historyStore.load(HistoryItemSchema);
  historyStore.clear();
  return [];
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [restoredCount, setRestoredCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = loadHistory();
    startTransition(() => {
      setItems(stored);
      setRestoredCount(stored.length);
      setHasLoaded(true);
    });
  }, []);

  const append = useCallback((item: HistoryItem) => {
    setItems((previous) => [...previous, item]);
    historyStore.append(item);
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setRestoredCount(0);
    historyStore.clear();
  }, []);

  const value = useMemo(
    () => ({ items, restoredCount, hasLoaded, append, clear }),
    [items, restoredCount, hasLoaded, append, clear],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
}
