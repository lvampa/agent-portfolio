import useChat from '@lib/hooks/useChat';
import { useHistory } from '@terminal/history/HistoryContext';
import { createInterpreter } from '@terminal/interpreter';
import { useSession } from '@terminal/SessionContext';
import { useMemo } from 'react';

/** Adapts the contexts and useChat to the interpreter's ports. `busy` is true while a chat is in flight. */
export function useInterpreter() {
  const { append, clear } = useHistory();
  const { setName, setMode } = useSession();
  const { sendMessage, isLoading } = useChat();

  const interpreter = useMemo(
    () =>
      createInterpreter({
        history: { append, clear },
        session: { setName, setMode },
        chat: { send: async (message) => (await sendMessage(message)) ?? null },
      }),
    [append, clear, setName, setMode, sendMessage],
  );

  return { apply: interpreter.apply, busy: isLoading };
}
