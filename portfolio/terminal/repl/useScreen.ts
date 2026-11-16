import type { Ports } from '@terminal/ports';
import { type RefObject, useMemo } from 'react';
import type { StickToBottomInstance } from 'use-stick-to-bottom';

type ScrollContainer = Pick<StickToBottomInstance, 'scrollRef' | 'contentRef' | 'scrollToBottom'>;

/**
 * The screen port on the stick-to-bottom container.
 * Clearing pads the content so the bottom of the scroll range is the prompt at the top of the view.
 * New output then fills the padding, and once it outgrows it the container follows the bottom as before.
 */
export function useScreen(
  { scrollRef, contentRef, scrollToBottom }: ScrollContainer,
  promptRef: RefObject<HTMLElement | null>,
): Ports['screen'] {
  return useMemo(
    () => ({
      scrollClear: () => {
        // A frame later, so the echo of the command is laid out above the prompt first.
        requestAnimationFrame(() => {
          const scroller = scrollRef.current;
          const content = contentRef.current;
          const prompt = promptRef.current;
          if (!scroller || !content || !prompt) return;

          const promptTop =
            prompt.getBoundingClientRect().top -
            scroller.getBoundingClientRect().top +
            scroller.scrollTop;
          content.style.minHeight = `calc(${promptTop}px + 100dvh)`;
          void scrollToBottom('instant');
        });
      },
      reset: () => {
        if (contentRef.current) contentRef.current.style.minHeight = '';
      },
    }),
    [scrollRef, contentRef, scrollToBottom, promptRef],
  );
}
