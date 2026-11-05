'use client';

import { historyStore } from '@terminal/storage';
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
  hasLoaded: boolean;
  append: (item: HistoryItem) => void;
  clear: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = historyStore.load(HistoryItemSchema);
    startTransition(() => {
      setItems(stored);
      setHasLoaded(true);
    });
  }, []);

  const append = useCallback((item: HistoryItem) => {
    setItems((previous) => [...previous, item]);
    historyStore.append(item);
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    historyStore.clear();
  }, []);

  const value = useMemo(
    () => ({ items, hasLoaded, append, clear }),
    [items, hasLoaded, append, clear],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
}
