import React from 'react';

import { CommandPrompt } from '@/components/ui/command-prompt';

import { type HistoryItem } from '../types';

export const Command: React.FC<{ item: HistoryItem }> = ({ item }) => (
  <CommandPrompt prompt={item.prompt}>
    <span>{item.value}</span>
  </CommandPrompt>
);
