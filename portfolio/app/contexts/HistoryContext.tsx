'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import type { HistoryItem } from '@app/components/History';
import { storage } from '@lib/storage';

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
    const stored = storage.load<HistoryItem>();
    setItems(stored);
    setHasLoaded(true);
  }, []);

  function append(item: HistoryItem) {
    setItems((previous) => [...previous, item]);
    storage.append(item);
  }

  return (
    <HistoryContext.Provider value={{ items, hasLoaded, append }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
}
