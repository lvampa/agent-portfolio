import React, { createElement, useMemo } from 'react';

import { useHistory } from './HistoryContext';
import { renderers, revealStepsFor } from './registry';
import type { HistoryItem, HistoryItemOf, HistoryItemType, RevealProgress } from './types';
import { useReveal, useRevealProgress } from './useReveal';

function Renderer<K extends HistoryItemType>({
  item,
  progress,
}: {
  item: HistoryItemOf<K>;
  progress: RevealProgress;
}) {
  return createElement(renderers[item.type as K], { item, progress });
}

function HistoryLine({
  item,
  index,
  isCurrent,
}: {
  item: HistoryItem;
  index: number;
  isCurrent: boolean;
}) {
  const { generation, markRevealed } = useHistory();
  const steps = useMemo(() => (isCurrent ? revealStepsFor(item) : null), [isCurrent, item]);
  const progress = useRevealProgress(steps, () => markRevealed(generation, index + 1));
  return <Renderer item={item} progress={progress} />;
}

export function History() {
  const { items, generation, hasLoaded } = useHistory();
  const { revealedCount } = useReveal();

  // Mounting the log after load keeps restored items from being announced as new.
  if (!hasLoaded) return null;

  // Items past the cursor are not rendered yet, so each one is announced as it appears.
  return (
    <div role="log">
      {items.slice(0, revealedCount + 1).map((item, index) => (
        // History only appends or clears, and clear bumps the generation, so this key stays stable.
        <div key={`${generation}-${index}`}>
          <HistoryLine item={item} index={index} isCurrent={index === revealedCount} />
        </div>
      ))}
    </div>
  );
}
