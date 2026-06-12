import type { HistoryItem } from '@app/components/History';

export interface EventMap extends Record<string, unknown> {
  submit: HistoryItem;
}
