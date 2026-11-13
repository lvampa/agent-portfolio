'use client';

import { cn } from '@lib/utils/cn';

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
