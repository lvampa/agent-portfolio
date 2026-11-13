import type { ChatVisitor } from '@lib/hooks/types';
import type { UserInfo } from '@lib/utils/types';
import { History } from '@terminal/history/History';
import { useHistory } from '@terminal/history/HistoryContext';
import { useReveal } from '@terminal/history/useReveal';
import { QUESTIONS } from '@terminal/questions';
import { COMMANDS } from '@terminal/registry';
import { EVENTS } from '@terminal/repl/constants';
import { useEventBus } from '@terminal/repl/EventBusContext';
import { currentInputLabel, currentPrompt, route } from '@terminal/router';
import { useSession } from '@terminal/SessionContext';
import type { TerminalState } from '@terminal/types';
import { acceptsInput, getInputState } from '@terminal/utils';
import { useEffect, useEffectEvent, useMemo } from 'react';

import { InputForm } from './InputForm';
import ReplLoading from './ReplLoading';
import { useFollowOutput } from './useFollowOutput';
import { useInterpreter } from './useInterpreter';
import { useSkipReveal } from './useSkipReveal';
import { useStartup } from './useStartup';

interface ReplProps {
  /** Null when client info failed to load; the startup then skips that step. */
  clientInfo: UserInfo | null;
  isClientInfoLoading: boolean;
  /** Sent with each chat. Its fields are null when client info failed to load. */
  visitor: ChatVisitor;
}

/** Routes each submitted line to a pending question, a command, or the chat. */
export default function Repl({ clientInfo, isClientInfoLoading, visitor }: ReplProps) {
  const eventBus = useEventBus();
  const { isRevealing, revealAll } = useReveal();
  const { hasLoaded: hasHistoryLoaded } = useHistory();
  const { name, mode, sessionId, hasLoaded: hasSessionLoaded } = useSession();
  const { apply, busy } = useInterpreter(visitor);

  const state: TerminalState = useMemo(
    () => ({ name, sessionId, clientInfo, commands: COMMANDS }),
    [name, sessionId, clientInfo],
  );

  const hasStarted = useStartup({
    isReady: hasHistoryLoaded && hasSessionLoaded && !isClientInfoLoading,
    state,
    apply,
  });
  const { contentRef, endRef } = useFollowOutput();
  useSkipReveal(isRevealing, revealAll);
  const inputState = getInputState({ hasStarted, busy, isRevealing, mode });

  // An effect event always sees the latest mode, even in the commit where the input first appears,
  // so the handler is registered once instead of re-registering after every change.
  const handleSubmit = useEffectEvent((line: string) => {
    // InputForm already holds Enter while it is not active, so this only guards against a stray submit.
    if (!acceptsInput(inputState)) return;
    void apply(route(line, mode, state));
  });

  useEffect(() => {
    const unregister = eventBus.on(EVENTS.SUBMIT, (line) => handleSubmit(line));
    return () => unregister();
  }, [eventBus]);

  return (
    <div ref={contentRef}>
      <History />
      <ReplLoading isVisible={inputState === 'busy'} />
      <InputForm
        isActive={acceptsInput(inputState)}
        isAnswering={mode.type === 'awaiting'}
        prompt={currentPrompt(mode, name)}
        label={currentInputLabel(mode)}
        answerKeys={mode.type === 'awaiting' ? QUESTIONS[mode.questionId].answerKeys : undefined}
      />
      <div ref={endRef} />
    </div>
  );
}
