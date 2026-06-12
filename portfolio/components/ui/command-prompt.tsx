import * as React from "react";

import { cn } from "@/lib/utils";

export interface CommandPromptProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  prompt?: string;
}

export const CommandPrompt = React.forwardRef<HTMLDivElement, CommandPromptProps>(
  ({ className, children, prompt = "C:\\Users\\unknown >", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex gap-3", className)}
      data-slot="command-prompt"
      {...props}
    >
      <span className="select-none shrink-0" aria-hidden>
        {prompt}
      </span>
      {children}
    </div>
  )
);
CommandPrompt.displayName = 'CommandPrompt';