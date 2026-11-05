import { useEffect, useLayoutEffect, useRef } from 'react';

import { FOLLOW_OUTPUT_SLACK_PX } from './constants';

/** Scrolls the end of the terminal into view after each append, unless the visitor scrolled up to read. */
export function useFollowOutput(itemCount: number) {
  const endRef = useRef<HTMLDivElement>(null);
  const isFollowingRef = useRef(true);

  useEffect(() => {
    function updateIsFollowing() {
      const end = endRef.current;
      if (!end) return;
      isFollowingRef.current =
        end.getBoundingClientRect().bottom <= window.innerHeight + FOLLOW_OUTPUT_SLACK_PX;
    }
    // Capture, so scrolling any container counts, not only the window.
    document.addEventListener('scroll', updateIsFollowing, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', updateIsFollowing, { capture: true });
  }, []);

  useLayoutEffect(() => {
    if (isFollowingRef.current) endRef.current?.scrollIntoView({ block: 'end' });
  }, [itemCount]);

  return endRef;
}
