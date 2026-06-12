'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

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

  const value: AnimationContextValue = {
    isAnimating: count > 0,
    startAnimation,
    endAnimation,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation(): AnimationContextValue {
  const ctx = useContext(AnimationContext);
  if (!ctx) {
    throw new Error('useAnimation must be used within AnimationProvider');
  }
  return ctx;
}
