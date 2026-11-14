import { cn } from '@lib/utils/cn';
import type * as React from 'react';

export interface CommandPromptProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  prompt?: string;
}

export function CommandPrompt({
  className,
  children,
  prompt = 'C:\\Users\\unknown>',
  ...props
}: CommandPromptProps) {
  return (
    <div
      className={cn('flex flex-wrap gap-x-[1ch]', className)}
      data-slot="command-prompt"
      {...props}
    >
      <span className="select-none" aria-hidden>
        {prompt}
      </span>
      {children}
    </div>
  );
}
