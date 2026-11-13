import { usePrefersReducedMotion } from '@lib/hooks/usePrefersReducedMotion';
import { useEffect, useEffectEvent, useState } from 'react';

import { REVEAL_TICK_MS, REVEALED } from './constants';
import { useHistory } from './HistoryContext';
import { revealStepsFor } from './registry';
import type { RevealProgress, RevealStep } from './types';
import { firstUnrevealed, revealProgressAt } from './utils';

/**
 * The reveal cursor, past any items with nothing to reveal.
 * Under reduced motion every item counts as shown at once, so nothing waits on a reveal.
 */
export function useReveal() {
  const { items, revealedCount, generation, markRevealed, revealAll } = useHistory();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Keeps the cursor caught up, so turning reduced motion off does not replay what was shown.
  useEffect(() => {
    if (prefersReducedMotion) markRevealed(generation, items.length);
  }, [prefersReducedMotion, generation, items.length, markRevealed]);

  const cursor = prefersReducedMotion
    ? items.length
    : firstUnrevealed(items, revealedCount, revealStepsFor);

  return { revealedCount: cursor, isRevealing: cursor < items.length, revealAll };
}

/** Runs the current row's steps on the clock. Null steps mean the row is already shown. */
export function useRevealProgress(steps: RevealStep[] | null, onDone: () => void): RevealProgress {
  const [progress, setProgress] = useState(() => (steps ? revealProgressAt(steps, 0) : REVEALED));
  const finish = useEffectEvent(onDone);

  useEffect(() => {
    if (!steps) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const next = revealProgressAt(steps, Date.now() - startedAt);
      setProgress(next);
      if (!next.isDone) return;
      clearInterval(interval);
      finish();
    }, REVEAL_TICK_MS);
    return () => clearInterval(interval);
  }, [steps]);

  return steps ? progress : REVEALED;
}
