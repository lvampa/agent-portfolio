import { cn } from '@lib/utils/cn';
import type * as React from 'react';

/** An external link that opens in a new tab, so visitors keep their terminal session. */
export function Link({
  className,
  // Defaults, not spread order, so a caller passing target={undefined} still gets a new tab.
  target = '_blank',
  rel = 'noopener noreferrer',
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn('underline', className)} target={target} rel={rel} {...props} />;
}
