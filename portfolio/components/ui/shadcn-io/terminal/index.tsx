'use client';

import { cn } from '@lib/utils';
import { motion, type MotionProps } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedSpan = ({ children, delay = 0, className, ...props }: AnimatedSpanProps) => (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: delay / 1000 }}
    className={cn('grid tracking-tight', className)}
    {...props}
  >
    {children}
  </motion.div>
);

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
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
  as: Component = 'span',
  onStart,
  onComplete,
  ...props
}: TypingAnimationProps) => {
  if (typeof children !== 'string') {
    throw new Error('TypingAnimation: children must be a string. Received:');
  }

  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  });

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
    <MotionComponent ref={elementRef} className={cn('tracking-tight', className)} {...props}>
      {displayedText}
    </MotionComponent>
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
