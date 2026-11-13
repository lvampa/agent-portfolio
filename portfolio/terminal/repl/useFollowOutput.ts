import { useEffect, useRef } from 'react';

import { FOLLOW_OUTPUT_SLACK_PX } from './constants';

/**
 * Keeps the end of the terminal in view whenever the content grows, unless the visitor scrolled up to read.
 * It watches the size, not the item count, so a reply streaming into one item is followed too.
 */
export function useFollowOutput() {
  const contentRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isFollowingRef = useRef(true);

  useEffect(() => {
    // Per scroller, since any container's scroll counts. The hook itself only ever scrolls down.
    const lastScrolls = new WeakMap<EventTarget, { top: number; height: number }>();

    function updateIsFollowing(event: Event) {
      const end = endRef.current;
      const target = event.target;
      if (!end || !target) return;

      const scroller = target instanceof Element ? target : document.documentElement;
      const scroll = { top: scroller.scrollTop, height: scroller.scrollHeight };
      const last = lastScrolls.get(target) ?? scroll;
      lastScrolls.set(target, scroll);
      // Any upward scroll stops following at once, so a slow scroll is not pulled back by the next resize.
      // Shrinking content clamps scrollTop, which is not the visitor scrolling up.
      if (scroll.top < last.top && scroll.height >= last.height) {
        isFollowingRef.current = false;
        return;
      }

      // The visual viewport excludes an on-screen keyboard, so the prompt is not left behind it.
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      if (end.getBoundingClientRect().bottom <= viewportHeight + FOLLOW_OUTPUT_SLACK_PX) {
        isFollowingRef.current = true;
      }
    }
    // Capture, so scrolling any container counts, not only the window.
    document.addEventListener('scroll', updateIsFollowing, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', updateIsFollowing, { capture: true });
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (isFollowingRef.current) endRef.current?.scrollIntoView({ block: 'end' });
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return { contentRef, endRef };
}
