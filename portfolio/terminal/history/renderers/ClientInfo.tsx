import { CommandPrompt } from '@components/ui/command-prompt';
import { TypingAnimation } from '@components/ui/shadcn-io/terminal';
import { useAnimation } from '@terminal/AnimationContext';
import React from 'react';

import type { HistoryItemOf } from '../types';
import {
  CLIENT_INFO_COMMAND,
  CLIENT_INFO_LINES_DELAY_MS,
  CLIENT_INFO_LOADING_DELAY_MS,
  CLIENT_INFO_LOADING_LINE,
  TYPING_MS_PER_CHAR,
} from './constants';

export const ClientInfo: React.FC<{ item: HistoryItemOf<'clientInfo'> }> = ({ item }) => {
  const { startAnimation, endAnimation } = useAnimation();

  if (!item.info.length) return null;

  return (
    <div>
      <CommandPrompt prompt={item.prompt}>
        <TypingAnimation
          duration={TYPING_MS_PER_CHAR}
          onStart={startAnimation}
          onComplete={endAnimation}
        >
          {CLIENT_INFO_COMMAND}
        </TypingAnimation>
      </CommandPrompt>
      <div>
        <TypingAnimation
          delay={CLIENT_INFO_LOADING_DELAY_MS}
          duration={TYPING_MS_PER_CHAR}
          onStart={startAnimation}
          onComplete={endAnimation}
        >
          {CLIENT_INFO_LOADING_LINE}
        </TypingAnimation>
      </div>
      {item.info.map((infoItem) => (
        <div key={infoItem.label}>
          <TypingAnimation
            delay={CLIENT_INFO_LINES_DELAY_MS}
            duration={10}
            onStart={startAnimation}
            onComplete={endAnimation}
          >
            {infoItem.label + ': ' + infoItem.value}
          </TypingAnimation>
        </div>
      ))}
    </div>
  );
};
