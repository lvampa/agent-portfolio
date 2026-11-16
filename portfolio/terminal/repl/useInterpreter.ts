import { sendChat } from '@lib/hooks/sendChat';
import type { ChatVisitor } from '@lib/hooks/types';
import { useHistory } from '@terminal/history/HistoryContext';
import { createInterpreter } from '@terminal/interpreter';
import type { Ports } from '@terminal/ports';
import { useSession } from '@terminal/SessionContext';
import type { Effect } from '@terminal/types';
import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Adapts the contexts and sendChat to the interpreter's ports.
 * `busy` spans the whole apply of any list with a chat, so the input returns in the same render as the reply.
 */
export function useInterpreter(visitor: ChatVisitor, screen: Ports['screen']) {
  const { append, clear, stopReveal } = useHistory();
  const { name, sessionId, setName, setMode, newConversation, reset } = useSession();
  const [chatsInFlight, setChatsInFlight] = useState(0);
  // Only one chat is in flight at a time, because the input is gated while busy.
  const chatController = useRef<AbortController | null>(null);

  const interpreter = useMemo(
    () =>
      createInterpreter({
        history: { append, clear },
        session: { setName, setMode, newConversation, reset },
        chat: {
          send: (message) => {
            const controller = new AbortController();
            chatController.current = controller;
            return sendChat(
              { chatInput: message, sessionId, name, client: visitor },
              controller.signal,
            );
          },
          cancel: () => chatController.current?.abort(),
        },
        screen,
        reveal: { stop: stopReveal },
      }),
    [
      append,
      clear,
      stopReveal,
      setName,
      setMode,
      newConversation,
      reset,
      sessionId,
      name,
      visitor,
      screen,
    ],
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
