import React from 'react';

import { type HistoryItem } from '../types';

export const Message: React.FC<{ item: HistoryItem }> = ({ item }) => (
  <div>
    <p>{item.value}</p>
  </div>
);
