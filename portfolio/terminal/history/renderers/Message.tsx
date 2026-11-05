import React from 'react';

import type { HistoryItemOf } from '../types';

export const Message: React.FC<{ item: HistoryItemOf<'message'> }> = ({ item }) => (
  <div>
    <p className="whitespace-pre-wrap">{item.text}</p>
  </div>
);
