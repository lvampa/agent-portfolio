import React from 'react';

import type { HistoryItemOf } from '../types';

export const ErrorLine: React.FC<{ item: HistoryItemOf<'error'> }> = ({ item }) => (
  <div>
    <p className="whitespace-pre-wrap">{item.text}</p>
  </div>
);
