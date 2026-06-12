import type { HistoryItem } from '@app/components/History';
import { History, HISTORY_ITEM_TYPES } from '@app/components/History';
import { EVENTS } from '@app/constants/events';
import { useAnimation } from '@app/contexts/AnimationContext';
import { useEventBus } from '@app/contexts/EventBusContext';
import { useHistory } from '@app/contexts/HistoryContext';
import useChat from '@lib/hooks/useChat';
import { useEffect } from 'react';

import { InputForm } from './InputForm';
import ReplLoading from './ReplLoading';

/** Bridges user input to the chat API and records both the command and the response in history. */
export default function Repl() {
  const eventBus = useEventBus();
  const { isLoading, sendMessage } = useChat();
  const { isAnimating } = useAnimation();
  const { append } = useHistory();

  useEffect(() => {
    async function handleSubmit(command: HistoryItem) {
      append({ value: command.value, type: HISTORY_ITEM_TYPES.COMMAND });

      const result = await sendMessage(command.value);

      if (Array.isArray(result)) {
        result.forEach((item: unknown) => {
          const output =
            typeof item === 'object' && item !== null && 'output' in item
              ? String((item as { output: unknown }).output)
              : '';
          append({ value: output, type: HISTORY_ITEM_TYPES.MESSAGE });
        });
      }
    }

    const unregister = eventBus.on(EVENTS.SUBMIT, handleSubmit);
    return () => unregister();
  }, [sendMessage, append]);

  return (
    <div>
      <History />
      <ReplLoading isVisible={isLoading} />
      <InputForm isVisible={!isLoading && !isAnimating} />
    </div>
  );
}
