import { cn } from '@lib/utils/cn';
import * as React from 'react';

/** An external link that opens in a new tab, so visitors keep their terminal session. */
export const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, target = '_blank', rel = 'noopener noreferrer', ...props }, ref) => (
  // Defaults, not spread order, so a caller passing target={undefined} still gets a new tab.
  <a ref={ref} className={cn('underline', className)} target={target} rel={rel} {...props} />
));
Link.displayName = 'Link';
