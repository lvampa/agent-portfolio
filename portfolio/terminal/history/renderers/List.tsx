import React from 'react';

import type { HistoryItemOf } from '../types';
import { Columns } from './Columns';

export const List: React.FC<{ item: HistoryItemOf<'list'> }> = ({ item }) => (
  <Columns>
    {item.items.map((row, index) => (
      // Rows never reorder, so an index key stays stable.
      <React.Fragment key={index}>
        <dt>{row.term}</dt>
        <dd>{row.detail}</dd>
      </React.Fragment>
    ))}
  </Columns>
);
