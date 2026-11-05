import React from 'react';

/** Two columns: terms take the widest term's width, and details line up two characters after it. */
export const Columns: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // Each cell keeps a line of height when empty, like a blank text line.
  <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-[2ch] *:min-h-[1lh]">
    {children}
  </dl>
);
