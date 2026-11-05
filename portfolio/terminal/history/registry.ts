import type React from 'react';

import { HISTORY_ITEM_TYPES } from './constants';
import { Command, Help, Message, Thinking, User } from './renderers';
import type { HistoryItem, HistoryItemType } from './types';

export const renderers: Record<HistoryItemType, React.FC<{ item: HistoryItem }>> = {
  [HISTORY_ITEM_TYPES.COMMAND]: Command,
  [HISTORY_ITEM_TYPES.MESSAGE]: Message,
  [HISTORY_ITEM_TYPES.THINKING]: Thinking,
  [HISTORY_ITEM_TYPES.HELP]: Help,
  [HISTORY_ITEM_TYPES.USER]: User,
};
