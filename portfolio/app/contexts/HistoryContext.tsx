'use client';

import type { HistoryItem } from '@app/components/History';
import { HistoryItemSchema } from '@app/components/History/schemas';
import { storage } from '@lib/storage';
import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface HistoryContextValue {
  items: HistoryItem[];
  hasLoaded: boolean;
  append: (item: HistoryItem) => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = storage.load(HistoryItemSchema);
    startTransition(() => {
      setItems(stored);
      setHasLoaded(true);
    });
  }, []);

  const append = useCallback((item: HistoryItem) => {
    setItems((previous) => [...previous, item]);
    storage.append(item);
  }, []);

  const value = useMemo(() => ({ items, hasLoaded, append }), [items, hasLoaded, append]);

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
}
