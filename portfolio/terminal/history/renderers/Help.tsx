import React from 'react';

import { type HistoryItem } from '../types';

export const Help: React.FC<{ item: HistoryItem }> = ({ item }) => (
  <div>
    <pre>{item.value}</pre>
  </div>
);
