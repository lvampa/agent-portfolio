import type { z } from 'zod';

import type { HistoryItemSchema } from './schemas';

export type HistoryItem = z.infer<typeof HistoryItemSchema>;
export type HistoryItemType = HistoryItem['type'];
export type HistoryItemOf<K extends HistoryItemType> = Extract<HistoryItem, { type: K }>;
