import type React from 'react';

import type { HistoryItemOf, HistoryItemType, RevealProgress, RevealStep } from '../types';

export interface RendererProps<K extends HistoryItemType> {
  item: HistoryItemOf<K>;
  // Fully shown items get REVEALED, so a renderer draws one way whatever came before.
  progress: RevealProgress;
}

// A mapped type, so each renderer gets its own item shape and a missing one fails the type check.
export type Renderers = {
  [K in HistoryItemType]: React.FC<RendererProps<K>>;
};

// Mapped the same way, so a new item type without pacing fails the type check.
export type RevealStepsRegistry = {
  [K in HistoryItemType]: (item: HistoryItemOf<K>) => RevealStep[];
};
