import type { UserInfo } from '@lib/utils/types';
import { useAnimation } from '@terminal/AnimationContext';
import { History } from '@terminal/history/History';
import { useHistory } from '@terminal/history/HistoryContext';
import { COMMANDS } from '@terminal/registry';
import { EVENTS } from '@terminal/repl/constants';
import { useEventBus } from '@terminal/repl/EventBusContext';
import { currentPrompt, route } from '@terminal/router';
import { useSession } from '@terminal/SessionContext';
import type { TerminalState } from '@terminal/types';
import { acceptsInput, getInputState } from '@terminal/utils';
import { useEffect, useEffectEvent, useMemo } from 'react';

import { InputForm } from './InputForm';
import ReplLoading from './ReplLoading';
import { useInterpreter } from './useInterpreter';
import { useStartup } from './useStartup';

interface ReplProps {
  /** Null when client info failed to load; the startup then skips that step. */
  clientInfo: UserInfo | null;
  isClientInfoLoading: boolean;
}

/** Routes each submitted line to a pending question, a command, or the chat. */
export default function Repl({ clientInfo, isClientInfoLoading }: ReplProps) {
  const eventBus = useEventBus();
  const { isAnimating } = useAnimation();
  const { hasLoaded: hasHistoryLoaded } = useHistory();
  const { name, mode, hasLoaded: hasSessionLoaded } = useSession();
  const { apply, busy } = useInterpreter();

  const state: TerminalState = useMemo(
    () => ({ name, clientInfo, commands: COMMANDS }),
    [name, clientInfo],
  );

  const hasStarted = useStartup({
    isReady: hasHistoryLoaded && hasSessionLoaded && !isClientInfoLoading,
    state,
    apply,
  });
  const inputState = getInputState({ hasStarted, busy, isAnimating, mode });

  // An effect event always sees the latest mode, even in the commit where the input first appears,
  // so the handler is registered once instead of re-registering after every change.
  const handleSubmit = useEffectEvent((line: string) => {
    // The input is hidden in other states, so this only guards against a stray submit.
    if (!acceptsInput(inputState)) return;
    void apply(route(line, mode, state));
  });

  useEffect(() => {
    const unregister = eventBus.on(EVENTS.SUBMIT, (line) => handleSubmit(line));
    return () => unregister();
  }, [eventBus]);

  return (
    <div>
      <History />
      <ReplLoading isVisible={inputState === 'busy'} />
      <InputForm isVisible={acceptsInput(inputState)} prompt={currentPrompt(mode, name)} />
    </div>
  );
}
