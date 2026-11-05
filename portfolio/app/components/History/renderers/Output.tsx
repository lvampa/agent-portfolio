import React from 'react';

import { type HistoryItem } from '../types';

export const Output: React.FC<{ item: HistoryItem }> = ({ item }) => (
  <div>
    {/* A blank line still takes a line of height. A non-breaking space would show as a glyph in the DOS font. */}
    <p className="min-h-[1lh]">{item.value}</p>
  </div>
);
