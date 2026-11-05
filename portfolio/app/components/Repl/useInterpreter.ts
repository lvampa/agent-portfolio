import { HISTORY_ITEM_TYPES } from '@app/components/History';
import { useHistory } from '@app/contexts/HistoryContext';
import { useSession } from '@app/contexts/SessionContext';
import { COMMAND_MODE, type Effect } from '@app/terminal';
import useChat from '@lib/hooks/useChat';
import { useCallback } from 'react';

import { CHAT_ERROR_MESSAGE } from './constants';

/**
 * Applies effects in order. Each call starts in command mode, and an `ask` stops the walk,
 * parking the remaining effects in the awaiting mode until the answer comes in.
 * `busy` is true while a chat effect is in flight.
 */
export function useInterpreter() {
  const { append, clear } = useHistory();
  const { setName, setMode } = useSession();
  const { sendMessage, isLoading } = useChat();

  const sendChat = useCallback(
    async (message: string) => {
      const result = await sendMessage(message);

      if (!result) {
        append({ value: CHAT_ERROR_MESSAGE, type: HISTORY_ITEM_TYPES.ERROR });
        return;
      }

      result.forEach((item) => {
        append({ value: item.output, type: HISTORY_ITEM_TYPES.MESSAGE });
      });
    },
    [sendMessage, append],
  );

  // Effects before the first chat apply synchronously, which the startup relies on to paint once.
  const apply = useCallback(
    async (effects: Effect[]) => {
      setMode(COMMAND_MODE);

      for (const [index, effect] of effects.entries()) {
        switch (effect.type) {
          case 'print':
            append(effect.item);
            break;
          case 'clear':
            clear();
            break;
          case 'setName':
            setName(effect.name);
            break;
          case 'ask':
            setMode({
              type: 'awaiting',
              questionId: effect.questionId,
              then: effects.slice(index + 1),
            });
            return;
          case 'chat':
            await sendChat(effect.message);
            break;
        }
      }
    },
    [append, clear, setName, setMode, sendChat],
  );

  return { apply, busy: isLoading };
}
