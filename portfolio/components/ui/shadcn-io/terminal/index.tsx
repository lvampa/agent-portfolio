'use client';

import { cn } from '@lib/utils/cn';
import { motion, type MotionProps } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  /** Called on mount, before paint, so the wait before typing counts as animating. */
  onStart?: () => void;
  /** Called once when typing ends, or on unmount if it never finished. */
  onComplete?: () => void;
}

export const TypingAnimation = ({
  children,
  className,
  duration = 60,
  delay = 0,
  onStart,
  onComplete,
  ...props
}: TypingAnimationProps) => {
  if (typeof children !== 'string') {
    throw new Error('TypingAnimation: children must be a string. Received:');
  }

  const [displayedText, setDisplayedText] = useState<string>('');
  const [started, setStarted] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const onCompleteCalledRef = useRef(false);

  const complete = useCallback(() => {
    if (onCompleteCalledRef.current) return;
    onCompleteCalledRef.current = true;
    onComplete?.();
  }, [onComplete]);

  // Starting before paint closes the gap where nothing counts as animating and the prompt flashes.
  useLayoutEffect(() => {
    onCompleteCalledRef.current = false;
    onStart?.();
    return complete;
  }, [onStart, complete]);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

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
  }, [children, duration, started, complete]);

  return (
    <motion.span ref={elementRef} className={cn('tracking-tight', className)} {...props}>
      <span className="sr-only">{children}</span>
      <span aria-hidden>{displayedText}</span>
    </motion.span>
  );
};

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
}

export const Terminal = ({ children, className }: TerminalProps) => (
  <section className={cn('text-terminal m-4 w-full max-w-5xl', className)}>
    <div className="grid gap-y-1 overflow-auto p-4 leading-loose font-medium text-inherit">
      {children}
    </div>
  </section>
);
