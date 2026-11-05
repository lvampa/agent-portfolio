import React, { createElement } from 'react';

import { useHistory } from './HistoryContext';
import { renderers } from './registry';
import type { HistoryItemOf, HistoryItemType } from './types';

function HistoryLine<K extends HistoryItemType>({
  type,
  item,
}: {
  type: K;
  item: HistoryItemOf<K>;
}) {
  return createElement(renderers[type], { item });
}

export function History() {
  const { items } = useHistory();

  return items.map((item, index) => {
    // History only appends or clears, so an index key stays stable.
    return (
      <div key={index}>
        <HistoryLine type={item.type} item={item} />
      </div>
    );
  });
}
