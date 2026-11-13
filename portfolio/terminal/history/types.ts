import type { z } from 'zod';

import type { HistoryItemSchema, ListRowSchema } from './schemas';

export type HistoryItem = z.infer<typeof HistoryItemSchema>;
export type HistoryItemType = HistoryItem['type'];
export type ListRow = z.infer<typeof ListRowSchema>;
export type HistoryItemOf<K extends HistoryItemType> = Extract<HistoryItem, { type: K }>;

/** One step of an item's reveal. A hold shows the item and waits; a stream types `length` characters. */
export type RevealStep =
  | { type: 'hold'; ms: number }
  | { type: 'stream'; length: number; msPerChar: number };

/** How far an item's reveal has got: the current step and, for a stream, the characters shown. */
export interface RevealProgress {
  step: number;
  chars: number;
  isDone: boolean;
}

/** `offset` is where the span starts in the reply's stream of characters. */
export type ReplySpan =
  | { type: 'text'; text: string; offset: number }
  | { type: 'bold'; text: string; offset: number }
  | { type: 'link'; text: string; href: string; offset: number };

export type ReplyBlock =
  | { type: 'paragraph'; spans: ReplySpan[] }
  | { type: 'list'; items: ReplySpan[][] };

/** A span before parseReply gives it its stream offset. */
export type UnplacedSpan = {
  [K in ReplySpan['type']]: Omit<Extract<ReplySpan, { type: K }>, 'offset'>;
}[ReplySpan['type']];

/** The raw lines of one reply block, before inline parsing. */
export interface BlockSource {
  type: ReplyBlock['type'];
  lines: string[];
}
