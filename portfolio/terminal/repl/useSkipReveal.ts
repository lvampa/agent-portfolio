import { useEffect } from 'react';

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

/**
 * Any key or click shows the rest of the output at once.
 * It never calls preventDefault, so the same key still types into the input.
 */
export function useSkipReveal(isRevealing: boolean, revealAll: () => void) {
  useEffect(() => {
    if (!isRevealing) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Shortcuts like copy or switching tabs are not a request to skip.
      if (event.metaKey || event.ctrlKey || MODIFIER_KEYS.has(event.key)) return;
      revealAll();
    }

    function handleClick(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest('a')) return;
      revealAll();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [isRevealing, revealAll]);
}
