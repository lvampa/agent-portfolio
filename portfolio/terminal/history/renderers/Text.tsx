import React from 'react';

import type { HistoryItemOf } from '../types';

export const Text: React.FC<{ item: HistoryItemOf<'text'> }> = ({ item }) => (
  <div>
    {/* A blank line still takes a line of height. A non-breaking space would show as a glyph in the DOS font. */}
    <p className="min-h-[1lh]">{item.text}</p>
  </div>
);
