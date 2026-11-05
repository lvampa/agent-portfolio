import type { z } from 'zod';

import type { HistoryItemSchema, HistoryItemTypeSchema } from './schemas';

export type HistoryItemType = z.infer<typeof HistoryItemTypeSchema>;
export type HistoryItem = z.infer<typeof HistoryItemSchema>;
