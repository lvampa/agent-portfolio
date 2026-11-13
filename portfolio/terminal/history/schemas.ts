import { UserInfoSchema } from '@lib/utils/schemas';
import { z } from 'zod';

// Empty text is a blank line.
export const TextItemSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

// The prompt at the time the line was typed, so a later rename does not rewrite old lines.
export const CommandItemSchema = z.object({
  type: z.literal('command'),
  line: z.string(),
  prompt: z.string(),
});

export const MessageItemSchema = z.object({
  type: z.literal('message'),
  text: z.string(),
});

export const ErrorItemSchema = z.object({
  type: z.literal('error'),
  text: z.string(),
});

export const ClientInfoItemSchema = z.object({
  type: z.literal('clientInfo'),
  info: UserInfoSchema,
  // Same as a command item: the prompt `clientinfo` was typed after.
  prompt: z.string(),
});

// Only the label is the link, so `text` is the plain lead-in before it.
export const LinkItemSchema = z.object({
  type: z.literal('link'),
  text: z.string(),
  label: z.string(),
  // Stored history can be edited, so only https links render.
  href: z.url({ protocol: /^https$/ }),
});

export const ListRowSchema = z.object({
  term: z.string(),
  detail: z.string(),
});

// Two aligned columns, like DOS output.
export const ListItemSchema = z.object({
  type: z.literal('list'),
  items: z.array(ListRowSchema),
});

export const HistoryItemSchema = z.discriminatedUnion('type', [
  TextItemSchema,
  CommandItemSchema,
  MessageItemSchema,
  ErrorItemSchema,
  ClientInfoItemSchema,
  ListItemSchema,
  LinkItemSchema,
]);
