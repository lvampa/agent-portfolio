import { CommandPrompt } from '@components/ui/command-prompt';
import { TypingAnimation } from '@components/ui/shadcn-io/terminal';
import { useAnimation } from '@terminal/AnimationContext';
import React from 'react';

import type { HistoryItemOf } from '../types';

export const ClientInfo: React.FC<{ item: HistoryItemOf<'clientInfo'> }> = ({ item }) => {
  const { startAnimation, endAnimation } = useAnimation();

  if (!item.info.length) return null;

  return (
    <div>
      <CommandPrompt>
        <TypingAnimation onStart={startAnimation} onComplete={endAnimation}>
          Loading Client Information . . . .
        </TypingAnimation>
      </CommandPrompt>
      {item.info.map((infoItem) => (
        <div key={infoItem.label}>
          <TypingAnimation
            delay={2500}
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
