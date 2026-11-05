import { CommandPrompt } from '@components/ui/command-prompt';
import React from 'react';

import type { HistoryItemOf } from '../types';

export const Command: React.FC<{ item: HistoryItemOf<'command'> }> = ({ item }) => (
  <CommandPrompt prompt={item.prompt}>
    <span>{item.line}</span>
  </CommandPrompt>
);
