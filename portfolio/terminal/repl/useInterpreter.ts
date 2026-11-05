import useChat from '@lib/hooks/useChat';
import { useHistory } from '@terminal/history/HistoryContext';
import { createInterpreter } from '@terminal/interpreter';
import { useSession } from '@terminal/SessionContext';
import type { Effect } from '@terminal/types';
import { useCallback, useMemo, useState } from 'react';

/**
 * Adapts the contexts and useChat to the interpreter's ports.
 * `busy` spans the whole apply of any list with a chat, so the input returns in the same render as the reply.
 */
export function useInterpreter() {
  const { append, clear } = useHistory();
  const { setName, setMode } = useSession();
  const { sendMessage } = useChat();
  const [chatsInFlight, setChatsInFlight] = useState(0);

  const interpreter = useMemo(
    () =>
      createInterpreter({
        history: { append, clear },
        session: { setName, setMode },
        chat: { send: async (message) => (await sendMessage(message)) ?? null },
      }),
    [append, clear, setName, setMode, sendMessage],
  );

  const apply = useCallback(
    async (effects: Effect[]) => {
      // Lists without a chat finish synchronously, so marking them busy would flash the loader.
      if (!effects.some((effect) => effect.type === 'chat')) return interpreter.apply(effects);

      setChatsInFlight((count) => count + 1);
      try {
        await interpreter.apply(effects);
      } finally {
        setChatsInFlight((count) => count - 1);
      }
    },
    [interpreter],
  );

  return { apply, busy: chatsInFlight > 0 };
}
