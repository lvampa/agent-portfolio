import { useAnimation } from '@app/contexts/AnimationContext';
import { CommandPrompt } from '@components/ui/command-prompt';
import { TypingAnimation } from '@components/ui/shadcn-io/terminal';
import { type UserInfo, type UserInfoItem } from '@lib/utils/types';
import React from 'react';

import { type HistoryItem } from '../types';

export const User: React.FC<{ item: HistoryItem }> = ({ item }) => {
  const userInfoItems: UserInfo = JSON.parse(item.value);
  const { startAnimation, endAnimation } = useAnimation();

  if (!userInfoItems.length) {
    return null;
  }

  return (
    <div>
      <CommandPrompt>
        <TypingAnimation onStart={startAnimation} onComplete={endAnimation}>
          Loading Client Information . . . .
        </TypingAnimation>
      </CommandPrompt>
      {userInfoItems.map((item: UserInfoItem) => (
        <div key={item.value}>
          <TypingAnimation
            delay={2500}
            duration={10}
            onStart={startAnimation}
            onComplete={endAnimation}
          >
            {item.label + ': ' + item.value}
          </TypingAnimation>
        </div>
      ))}
    </div>
  );
};
