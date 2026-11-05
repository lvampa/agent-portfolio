import { Command, ErrorMessage, Message, Output, User } from '@app/components/History/renderers';
import { type HistoryItem, type HistoryItemType } from '@app/components/History/types';
import type React from 'react';

import { HISTORY_ITEM_TYPES } from './constants';

export const renderers: Record<HistoryItemType, React.FC<{ item: HistoryItem }>> = {
  [HISTORY_ITEM_TYPES.COMMAND]: Command,
  [HISTORY_ITEM_TYPES.MESSAGE]: Message,
  [HISTORY_ITEM_TYPES.USER]: User,
  [HISTORY_ITEM_TYPES.ERROR]: ErrorMessage,
  [HISTORY_ITEM_TYPES.OUTPUT]: Output,
};
