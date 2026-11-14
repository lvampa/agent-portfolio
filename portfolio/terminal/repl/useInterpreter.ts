import { sendChat } from '@lib/hooks/sendChat';
import type { ChatVisitor } from '@lib/hooks/types';
import { useHistory } from '@terminal/history/HistoryContext';
import { createInterpreter } from '@terminal/interpreter';
import { useSession } from '@terminal/SessionContext';
import type { Effect } from '@terminal/types';
import { useCallback, useMemo, useState } from 'react';

/**
 * Adapts the contexts and sendChat to the interpreter's ports.
 * `busy` spans the whole apply of any list with a chat, so the input returns in the same render as the reply.
 */
export function useInterpreter(visitor: ChatVisitor) {
  const { append, clear } = useHistory();
  const { name, sessionId, setName, setMode, newConversation } = useSession();
  const [chatsInFlight, setChatsInFlight] = useState(0);

  const interpreter = useMemo(
    () =>
      createInterpreter({
        history: { append, clear },
        session: { setName, setMode, newConversation },
        chat: {
          send: (message) => sendChat({ chatInput: message, sessionId, name, client: visitor }),
        },
      }),
    [append, clear, setName, setMode, newConversation, sessionId, name, visitor],
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
