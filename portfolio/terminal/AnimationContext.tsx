'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface AnimationContextValue {
  isAnimating: boolean;
  startAnimation: () => void;
  endAnimation: () => void;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const startAnimation = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const endAnimation = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  const isAnimating = count > 0;
  const value = useMemo(
    () => ({ isAnimating, startAnimation, endAnimation }),
    [isAnimating, startAnimation, endAnimation],
  );

  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}

export function useAnimation(): AnimationContextValue {
  const ctx = useContext(AnimationContext);
  if (!ctx) {
    throw new Error('useAnimation must be used within AnimationProvider');
  }
  return ctx;
}
