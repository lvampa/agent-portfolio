import { CommandPrompt } from '@components/ui/command-prompt';
import { TypingAnimation } from '@components/ui/shadcn-io/terminal';
import { useAnimation } from '@terminal/AnimationContext';
import React from 'react';

import {
  CLIENT_INFO_COMMAND,
  CLIENT_INFO_LINES_DELAY_MS,
  CLIENT_INFO_LOADING_DELAY_MS,
  CLIENT_INFO_LOADING_LINE,
  INFO_TYPING_MS_PER_CHAR,
  TYPING_MS_PER_CHAR,
} from './constants';
import type { RendererProps } from './types';

interface LineProps {
  text: string;
  isRestored: boolean;
  delay?: number;
  duration: number;
}

// A restored line never counts as animating, so it does not hold back the prompt.
function Line({ text, isRestored, delay, duration }: LineProps) {
  const { startAnimation, endAnimation } = useAnimation();

  if (isRestored) return <span className="tracking-tight">{text}</span>;

  return (
    <TypingAnimation
      delay={delay}
      duration={duration}
      onStart={startAnimation}
      onComplete={endAnimation}
    >
      {text}
    </TypingAnimation>
  );
}

export const ClientInfo: React.FC<RendererProps<'clientInfo'>> = ({ item, isRestored }) => {
  if (!item.info.length) return null;

  return (
    <div>
      <CommandPrompt prompt={item.prompt}>
        <Line text={CLIENT_INFO_COMMAND} isRestored={isRestored} duration={TYPING_MS_PER_CHAR} />
      </CommandPrompt>
      <div>
        <Line
          text={CLIENT_INFO_LOADING_LINE}
          isRestored={isRestored}
          delay={CLIENT_INFO_LOADING_DELAY_MS}
          duration={TYPING_MS_PER_CHAR}
        />
      </div>
      {item.info.map((infoItem) => (
        <div key={infoItem.label}>
          <Line
            text={`${infoItem.label}: ${infoItem.value}`}
            isRestored={isRestored}
            delay={CLIENT_INFO_LINES_DELAY_MS}
            duration={INFO_TYPING_MS_PER_CHAR}
          />
        </div>
      ))}
    </div>
  );
};
