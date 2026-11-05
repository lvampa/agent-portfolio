import React, { createElement } from 'react';

import { useHistory } from './HistoryContext';
import { renderers } from './registry';
import type { HistoryItemOf, HistoryItemType } from './types';

function HistoryLine<K extends HistoryItemType>({
  type,
  item,
  isRestored,
}: {
  type: K;
  item: HistoryItemOf<K>;
  isRestored: boolean;
}) {
  return createElement(renderers[type], { item, isRestored });
}

export function History() {
  const { items, restoredCount, hasLoaded } = useHistory();

  // Mounting the log after load keeps restored items from being announced as new.
  if (!hasLoaded) return null;

  return (
    <div role="log">
      {items.map((item, index) => (
        // History only appends or clears, so an index key stays stable.
        <div key={index}>
          <HistoryLine type={item.type} item={item} isRestored={index < restoredCount} />
        </div>
      ))}
    </div>
  );
}
