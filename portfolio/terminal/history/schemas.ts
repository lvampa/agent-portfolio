import { UserInfoSchema } from '@lib/utils/schemas';
import { z } from 'zod';

import { HISTORY_ITEM_TYPES } from './constants';

// Empty text is a blank line.
export const TextItemSchema = z.object({
  type: z.literal(HISTORY_ITEM_TYPES.TEXT),
  text: z.string(),
});

// The prompt at the time the line was typed, so a later rename does not rewrite old lines.
export const CommandItemSchema = z.object({
  type: z.literal(HISTORY_ITEM_TYPES.COMMAND),
  line: z.string(),
  prompt: z.string(),
});

export const MessageItemSchema = z.object({
  type: z.literal(HISTORY_ITEM_TYPES.MESSAGE),
  text: z.string(),
});

export const ErrorItemSchema = z.object({
  type: z.literal(HISTORY_ITEM_TYPES.ERROR),
  text: z.string(),
});

export const ClientInfoItemSchema = z.object({
  type: z.literal(HISTORY_ITEM_TYPES.CLIENT_INFO),
  info: UserInfoSchema,
});

export const HistoryItemSchema = z.discriminatedUnion('type', [
  TextItemSchema,
  CommandItemSchema,
  MessageItemSchema,
  ErrorItemSchema,
  ClientInfoItemSchema,
]);
