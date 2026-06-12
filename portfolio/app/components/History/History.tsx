import { useHistory } from '@app/contexts/HistoryContext';
import React from 'react';

import { renderers } from './constants';
import type { HistoryItem } from './types';

export function History() {
  const { items } = useHistory();

  return items.map((item: HistoryItem, index: number) => {
    const Renderer = renderers[item.type];
    return (
      <div key={item.value + index}>
        <Renderer item={item} />
      </div>
    );
  });
}
