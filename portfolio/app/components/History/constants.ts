import { Command, Help, Message, Thinking, User } from '@app/components/History/renderers';
import { type HistoryItem, type HistoryItemType } from '@app/components/History/types';
import type React from 'react';

export const HISTORY_ITEM_TYPES = {
  THINKING: 'thinking',
  COMMAND: 'command',
  MESSAGE: 'message',
  HELP: 'help',
  USER: 'user',
} as const;

export const renderers: Record<HistoryItemType, React.FC<{ item: HistoryItem }>> = {
  [HISTORY_ITEM_TYPES.COMMAND]: Command,
  [HISTORY_ITEM_TYPES.MESSAGE]: Message,
  [HISTORY_ITEM_TYPES.THINKING]: Thinking,
  [HISTORY_ITEM_TYPES.HELP]: Help,
  [HISTORY_ITEM_TYPES.USER]: User,
};
