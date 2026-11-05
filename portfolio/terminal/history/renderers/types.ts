import type React from 'react';

import type { HistoryItemOf, HistoryItemType } from '../types';

// A mapped type, so each renderer gets its own item shape and a missing one fails the type check.
export type Renderers = {
  [K in HistoryItemType]: React.FC<{ item: HistoryItemOf<K> }>;
};
