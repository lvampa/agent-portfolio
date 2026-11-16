import type { ChatVisitor } from '@lib/hooks/types';
import type { UserInfo } from '@lib/utils/types';
import { History } from '@terminal/history/History';
import { useHistory } from '@terminal/history/HistoryContext';
import { useReveal } from '@terminal/history/useReveal';
import { interrupt } from '@terminal/interrupt';
import { QUESTIONS } from '@terminal/questions';
import { COMMANDS } from '@terminal/registry';
import { EVENTS } from '@terminal/repl/constants';
import { useEventBus } from '@terminal/repl/EventBusContext';
import { currentInputLabel, currentPrompt, route } from '@terminal/router';
import { useSession } from '@terminal/SessionContext';
import type { TerminalState } from '@terminal/types';
import { acceptsInput, getInputState } from '@terminal/utils';
import { useEffect, useEffectEvent, useMemo, useRef } from 'react';
import type { StickToBottomInstance } from 'use-stick-to-bottom';

import { InputForm } from './InputForm';
import ReplLoading from './ReplLoading';
import { useInterpreter } from './useInterpreter';
import { useScreen } from './useScreen';
import { useSkipReveal } from './useSkipReveal';
import { useStartup } from './useStartup';
import { commandHistory } from './utils';

interface ReplProps {
  /** Null when client info failed to load; the startup then skips that step. */
  clientInfo: UserInfo | null;
  isClientInfoLoading: boolean;
  /** Sent with each chat. Its fields are null when client info failed to load. */
  visitor: ChatVisitor;
  /** The page's stick-to-bottom container, which the screen port scrolls. */
  scroll: Pick<StickToBottomInstance, 'scrollRef' | 'contentRef' | 'scrollToBottom'>;
}

/** Routes each submitted line to a pending question, a command, or the chat. */
export default function Repl({ clientInfo, isClientInfoLoading, visitor, scroll }: ReplProps) {
  const eventBus = useEventBus();
  const { cursor, isRevealing, revealAll } = useReveal();
  const { items, hasLoaded: hasHistoryLoaded } = useHistory();
  const { name, mode, sessionId, hasLoaded: hasSessionLoaded } = useSession();
  const promptRef = useRef<HTMLDivElement>(null);
  const screen = useScreen(scroll, promptRef);
  const { apply, busy } = useInterpreter(visitor, screen);

  const state: TerminalState = useMemo(
    () => ({
      name,
      sessionId,
      clientInfo,
      commands: COMMANDS,
      commandHistory: commandHistory(items),
    }),
    [name, sessionId, clientInfo, items],
  );

  const hasStarted = useStartup({
    isReady: hasHistoryLoaded && hasSessionLoaded && !isClientInfoLoading,
    state,
    apply,
  });
  useSkipReveal(isRevealing, revealAll);
  const inputState = getInputState({ hasStarted, busy, isRevealing, mode });

  // An effect event always sees the latest mode, even in the commit where the input first appears,
  // so the handler is registered once instead of re-registering after every change.
  const handleSubmit = useEffectEvent((line: string) => {
    // InputForm already holds Enter while it is not active, so this only guards against a stray submit.
    if (!acceptsInput(inputState)) return;
    void apply(route(line, mode, state));
  });

  function handleInterrupt(line: string) {
    const prompt = currentPrompt(mode, name);
    void apply(interrupt(inputState, { line, prompt, mode }));
  }

  useEffect(() => {
    const unregister = eventBus.on(EVENTS.SUBMIT, (line) => handleSubmit(line));
    return () => unregister();
  }, [eventBus]);

  return (
    <div>
      <History cursor={cursor} />
      <ReplLoading isVisible={inputState === 'busy'} />
      <div ref={promptRef}>
        <InputForm
          isActive={acceptsInput(inputState)}
          isAnswering={mode.type === 'awaiting'}
          commandLines={state.commandHistory}
          prompt={currentPrompt(mode, name)}
          label={currentInputLabel(mode)}
          answerKeys={mode.type === 'awaiting' ? QUESTIONS[mode.questionId].answerKeys : undefined}
          onInterrupt={handleInterrupt}
          onClear={screen.scrollClear}
        />
      </div>
    </div>
  );
}
