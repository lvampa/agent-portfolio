import { CommandPrompt } from '@components/ui/command-prompt';
import React from 'react';

import type { HistoryItemOf } from '../types';

export const Command: React.FC<{ item: HistoryItemOf<'command'> }> = ({ item }) => (
  <CommandPrompt prompt={item.prompt}>
    {/* The same width rule as the live input, so an echo lines up with what was typed. */}
    <span className="min-w-[12ch] flex-1">{item.line}</span>
  </CommandPrompt>
);
