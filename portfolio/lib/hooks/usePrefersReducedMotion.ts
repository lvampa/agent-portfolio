import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// The static export renders without a viewer, so it assumes motion is fine and the client corrects it.
function getServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
