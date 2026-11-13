import { usePrefersReducedMotion } from '@lib/hooks/usePrefersReducedMotion';
import { useEffect } from 'react';

import { useHistory } from './HistoryContext';
import { revealStepsFor } from './registry';
import { firstUnrevealed } from './utils';

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

  return { cursor, isRevealing: cursor < items.length, revealAll };
}
