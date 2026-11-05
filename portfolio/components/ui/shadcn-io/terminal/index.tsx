'use client';

import { usePrefersReducedMotion } from '@lib/hooks/usePrefersReducedMotion';
import { cn } from '@lib/utils/cn';
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';

interface TypingAnimationProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  /** Called on mount, before paint, so the wait before typing counts as animating. Never called under reduced motion. */
  onStart?: () => void;
  /** Called once when typing ends, or on unmount if it never finished. */
  onComplete?: () => void;
}

export const TypingAnimation = ({
  children,
  className,
  duration = 15,
  delay = 0,
  onStart,
  onComplete,
}: TypingAnimationProps) => {
  if (typeof children !== 'string') {
    throw new Error('TypingAnimation: children must be a string. Received:');
  }

  // Under reduced motion the text shows at once and never counts as animating, so nothing waits on it.
  const isInstant = usePrefersReducedMotion();
  const [displayedText, setDisplayedText] = useState<string>('');
  const [started, setStarted] = useState(false);
  const onCompleteCalledRef = useRef(false);

  // Effect events keep a caller's inline callbacks from restarting the animation on every render.
  const start = useEffectEvent(() => {
    onCompleteCalledRef.current = false;
    onStart?.();
  });

  const complete = useEffectEvent(() => {
    if (onCompleteCalledRef.current) return;
    onCompleteCalledRef.current = true;
    onComplete?.();
  });

  // Starting before paint closes the gap where nothing counts as animating and the prompt flashes.
  useLayoutEffect(() => {
    if (isInstant) return;
    start();
    return () => complete();
  }, [isInstant]);

  useEffect(() => {
    if (isInstant) return;
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay, isInstant]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
        complete();
      }
    }, duration);

    return () => clearInterval(typingEffect);
  }, [children, duration, started]);

  return (
    <span className={className}>
      <span className="sr-only select-none">{children}</span>
      <span aria-hidden>{isInstant ? children : displayedText}</span>
    </span>
  );
};

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
}

export const Terminal = ({ children, className }: TerminalProps) => (
  <section
    className={cn(
      'text-terminal m-4 w-full max-w-[calc(80ch+2rem)] [overflow-wrap:anywhere]',
      className,
    )}
  >
    <div className="grid gap-y-1 overflow-auto p-4 leading-normal font-medium text-inherit">
      {children}
    </div>
  </section>
);
