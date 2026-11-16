import { useEffect, useEffectEvent } from 'react';

/** Selected text on the page, or in the input, which window.getSelection does not always report. */
function hasSelectedText(): boolean {
  if (window.getSelection()?.toString()) return true;
  const active = document.activeElement;
  return active instanceof HTMLInputElement && active.selectionStart !== active.selectionEnd;
}

function isControlKey(event: KeyboardEvent, key: string): boolean {
  return event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === key;
}

/**
 * Ctrl+C and Ctrl+L, on the document so they work wherever focus is.
 * Ctrl+C leaves a selection alone so the browser can still copy it.
 */
export function useControlKeys({
  onInterrupt,
  onClear,
}: {
  onInterrupt: () => void;
  onClear: () => void;
}) {
  const interrupt = useEffectEvent(onInterrupt);
  const clear = useEffectEvent(onClear);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isControlKey(event, 'c') && !event.shiftKey) {
        if (hasSelectedText()) return;
        event.preventDefault();
        interrupt();
      } else if (isControlKey(event, 'l')) {
        // The browser would move focus to the address bar.
        event.preventDefault();
        clear();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
