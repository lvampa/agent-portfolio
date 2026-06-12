import { type HISTORY_ITEM_TYPES } from './constants';

export type HistoryItemType = (typeof HISTORY_ITEM_TYPES)[keyof typeof HISTORY_ITEM_TYPES];

export interface HistoryItem {
  value: string;
  type: HistoryItemType;
  animate?: boolean;
}
