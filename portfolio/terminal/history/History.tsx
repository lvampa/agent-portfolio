import React from 'react';

import { useHistory } from './HistoryContext';
import { renderers } from './registry';
import type { HistoryItem } from './types';

type AnyRenderer = React.FC<{ item: HistoryItem }>;

export function History() {
  const { items, hasLoaded } = useHistory();

  // Mounting the log after load keeps restored items from being announced as new.
  if (!hasLoaded) return null;

  return (
    <div role="log">
      {items.map((item, index) => {
        // TypeScript cannot tie item.type to its renderer's prop type, and the registry type already guarantees the match.
        const Renderer = renderers[item.type] as AnyRenderer;
        // History only appends or clears, so an index key stays stable.
        return (
          <div key={index}>
            <Renderer item={item} />
          </div>
        );
      })}
    </div>
  );
}
