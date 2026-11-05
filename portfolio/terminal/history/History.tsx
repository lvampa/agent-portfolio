import React from 'react';

import { useHistory } from './HistoryContext';
import { renderers } from './registry';
import type { HistoryItem } from './types';

type AnyRenderer = React.FC<{ item: HistoryItem }>;

export function History() {
  const { items } = useHistory();

  return items.map((item, index) => {
    // TypeScript cannot tie item.type to its renderer's prop type, and the registry type already guarantees the match.
    const Renderer = renderers[item.type] as AnyRenderer;
    // History only appends or clears, so an index key stays stable.
    return (
      <div key={index}>
        <Renderer item={item} />
      </div>
    );
  });
}
