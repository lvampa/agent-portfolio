'use client';

import { type Mode, normalizeSession, type Session, SessionSchema } from '@app/terminal';
import { isHistoryDisabled, sessionStore } from '@lib/storage';
import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface SessionContextValue {
  name: string | null;
  mode: Mode;
  hasLoaded: boolean;
  setName: (name: string) => void;
  setMode: (mode: Mode) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function loadOrResetSession(): Session {
  if (!isHistoryDisabled()) return normalizeSession(sessionStore.loadValue(SessionSchema));
  sessionStore.clear();
  return normalizeSession(null);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(() => normalizeSession(null));
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = loadOrResetSession();
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

  const setMode = useCallback((mode: Mode) => {
    setSession((previous) => ({ ...previous, mode }));
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
