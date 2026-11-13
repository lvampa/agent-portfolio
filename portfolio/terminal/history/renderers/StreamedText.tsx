import React from 'react';

/** Screen readers get the full text at once; the visible copy grows as `chars` does. */
export const StreamedText: React.FC<{ text: string; chars: number }> = ({ text, chars }) => (
  <>
    <span className="sr-only select-none">{text}</span>
    <span aria-hidden>{text.slice(0, chars)}</span>
  </>
);
