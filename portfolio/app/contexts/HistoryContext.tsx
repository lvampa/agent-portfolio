'use client';

import type { HistoryItem } from '@app/components/History';
import { HistoryItemSchema } from '@app/components/History/schemas';
import { isHistoryDisabled, storage } from '@lib/storage';
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
  clear: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

// Local dev flag. Starting empty replays the startup sequence on every refresh.
function loadOrResetHistory(): HistoryItem[] {
  if (!isHistoryDisabled()) return storage.load(HistoryItemSchema);
  storage.clear();
  return [];
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = loadOrResetHistory();
    startTransition(() => {
      setItems(stored);
      setHasLoaded(true);
    });
  }, []);

  const append = useCallback((item: HistoryItem) => {
    setItems((previous) => [...previous, item]);
    storage.append(item);
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    storage.clear();
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
