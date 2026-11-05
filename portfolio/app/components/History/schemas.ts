import { z } from 'zod';

import { HISTORY_ITEM_TYPES } from './constants';

export const HistoryItemTypeSchema = z.enum([
  HISTORY_ITEM_TYPES.COMMAND,
  HISTORY_ITEM_TYPES.MESSAGE,
  HISTORY_ITEM_TYPES.USER,
  HISTORY_ITEM_TYPES.ERROR,
  HISTORY_ITEM_TYPES.OUTPUT,
]);

export const HistoryItemSchema = z.object({
  value: z.string(),
  type: HistoryItemTypeSchema,
  // The prompt at the time a command was typed, so a later rename does not rewrite old lines.
  prompt: z.string().optional(),
});
