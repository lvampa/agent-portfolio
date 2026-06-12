import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'w-full min-w-0 rounded-md border-0 border-transparent bg-transparent px-0 py-1 text-base caret-transparent outline-none focus:ring-0 focus:outline-none',
        'placeholder:text-terminal/60',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
