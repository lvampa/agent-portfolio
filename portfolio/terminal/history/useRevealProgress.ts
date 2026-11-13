import { useEffect, useEffectEvent, useState } from 'react';

import { REVEAL_TICK_MS, REVEALED } from './constants';
import type { RevealProgress, RevealStep } from './types';
import { revealProgressAt } from './utils';

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
