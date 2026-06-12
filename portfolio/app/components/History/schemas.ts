import { z } from 'zod';

import { HISTORY_ITEM_TYPES } from './constants';

export const HistoryItemTypeSchema = z.enum([
  HISTORY_ITEM_TYPES.THINKING,
  HISTORY_ITEM_TYPES.COMMAND,
  HISTORY_ITEM_TYPES.MESSAGE,
  HISTORY_ITEM_TYPES.HELP,
  HISTORY_ITEM_TYPES.USER,
]);

export const HistoryItemSchema = z.object({
  value: z.string(),
  type: HistoryItemTypeSchema,
  animate: z.boolean().optional(),
});
