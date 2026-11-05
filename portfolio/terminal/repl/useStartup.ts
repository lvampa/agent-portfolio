import { useHistory } from '@terminal/history/HistoryContext';
import { startupEffects } from '@terminal/startup';
import type { Effect, TerminalState } from '@terminal/types';
import { startTransition, useLayoutEffect, useRef, useState } from 'react';

/**
 * Runs the startup once everything has loaded, unless stored history is being restored.
 * The items append in a layout effect, before paint, and their animations report from mount.
 * `hasStarted` is set in the same effect, so no frame shows the prompt in between.
 */
export function useStartup({
  isReady,
  state,
  apply,
}: {
  isReady: boolean;
  state: TerminalState;
  apply: (effects: Effect[]) => Promise<void>;
}): boolean {
  const { items } = useHistory();
  const hasRun = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);

  useLayoutEffect(() => {
    if (hasRun.current || !isReady) return;
    hasRun.current = true;

    if (items.length === 0) void apply(startupEffects(state));
    // The items above append synchronously. Deferring the flag can only keep the prompt hidden
    // longer, by which time the new items already count as animating.
    startTransition(() => setHasStarted(true));
  }, [isReady, items.length, state, apply]);

  return hasStarted;
}
