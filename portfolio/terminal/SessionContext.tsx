'use client';

import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { SessionSchema } from './schemas';
import { sessionStore } from './storage';
import type { Mode, Session } from './types';
import { normalizeSession } from './utils';

interface SessionContextValue {
  name: string | null;
  mode: Mode;
  hasLoaded: boolean;
  setName: (name: string) => void;
  setMode: (mode: Mode) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(() => normalizeSession(null));
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = normalizeSession(sessionStore.loadValue(SessionSchema));
    startTransition(() => {
      setSession(stored);
      setHasLoaded(true);
    });
  }, []);

  // Saving only after load keeps the default session from overwriting the stored one.
  useEffect(() => {
    if (hasLoaded) sessionStore.save(session);
  }, [hasLoaded, session]);

  const setName = useCallback((name: string) => {
    setSession((previous) => ({ ...previous, name }));
  }, []);

  // Every apply resets to command mode, so returning the same object skips a render and a save.
  const setMode = useCallback((mode: Mode) => {
    setSession((previous) =>
      mode.type === 'command' && previous.mode.type === 'command'
        ? previous
        : { ...previous, mode },
    );
  }, []);

  const value = useMemo(
    () => ({ name: session.name, mode: session.mode, hasLoaded, setName, setMode }),
    [session, hasLoaded, setName, setMode],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}
