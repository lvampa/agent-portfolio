import { CommandPrompt } from '@components/ui/command-prompt';
import { infoTerm } from '@terminal/utils';
import React from 'react';

import { hasReachedStep, shownChars } from '../utils';
import { Columns } from './Columns';
import { CLIENT_INFO_COMMAND, CLIENT_INFO_LOADING_LINE, CLIENT_INFO_STEPS } from './constants';
import { StreamedText } from './StreamedText';
import type { RendererProps } from './types';

export const ClientInfo: React.FC<RendererProps<'clientInfo'>> = ({ item, progress }) => {
  if (!item.info.length) return null;

  return (
    <div>
      <CommandPrompt prompt={item.prompt}>
        <span>
          <StreamedText
            text={CLIENT_INFO_COMMAND}
            chars={shownChars(progress, CLIENT_INFO_STEPS.COMMAND, CLIENT_INFO_COMMAND.length)}
          />
        </span>
      </CommandPrompt>
      <div>
        <StreamedText
          text={CLIENT_INFO_LOADING_LINE}
          chars={shownChars(progress, CLIENT_INFO_STEPS.LOADING, CLIENT_INFO_LOADING_LINE.length)}
        />
      </div>
      {/* The same columns as whoami, so both show client info the same way. */}
      <Columns>
        {item.info.map(({ label, value }, index) => {
          const step = CLIENT_INFO_STEPS.FIRST_ROW + index;
          return (
            <React.Fragment key={label}>
              {/* Laid out from the start, so the label column has its final width and values never slide. */}
              <dt className={hasReachedStep(progress, step) ? undefined : 'opacity-0'}>
                {infoTerm(label)}
              </dt>
              <dd>
                <StreamedText text={value} chars={shownChars(progress, step, value.length)} />
              </dd>
            </React.Fragment>
          );
        })}
      </Columns>
    </div>
  );
};
