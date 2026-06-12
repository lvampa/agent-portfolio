import { useAnimation } from '@app/contexts/AnimationContext';
import { CommandPrompt } from '@components/ui/command-prompt';
import { TypingAnimation } from '@components/ui/shadcn-io/terminal';
import { UserInfoSchema } from '@lib/utils/schemas';
import React from 'react';

import { type HistoryItem } from '../types';

export const User: React.FC<{ item: HistoryItem }> = ({ item }) => {
  const { startAnimation, endAnimation } = useAnimation();

  let rawValue: unknown;
  try {
    rawValue = JSON.parse(item.value);
  } catch {
    return null;
  }

  const parsed = UserInfoSchema.safeParse(rawValue);
  if (!parsed.success || !parsed.data.length) {
    return null;
  }

  return (
    <div>
      <CommandPrompt>
        <TypingAnimation onStart={startAnimation} onComplete={endAnimation}>
          Loading Client Information . . . .
        </TypingAnimation>
      </CommandPrompt>
      {parsed.data.map((infoItem) => (
        <div key={infoItem.value}>
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
