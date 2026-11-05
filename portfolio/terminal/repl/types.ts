import type { HistoryItem } from '@terminal/history';

export interface EventMap extends Record<string, unknown> {
  submit: HistoryItem;
}
