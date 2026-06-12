import React from 'react';

import { CommandPrompt } from '@/components/ui/command-prompt';

import { type HistoryItem } from '../types';

export const Thinking: React.FC<{ item: HistoryItem }> = ({ item }) => (
  <CommandPrompt>
    <em>{item.value}</em>
  </CommandPrompt>
);
