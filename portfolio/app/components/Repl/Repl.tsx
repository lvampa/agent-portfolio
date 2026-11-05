import type { HistoryItem } from '@app/components/History';
import { History } from '@app/components/History';
import { EVENTS } from '@app/constants/events';
import { useAnimation } from '@app/contexts/AnimationContext';
import { useEventBus } from '@app/contexts/EventBusContext';
import { useHistory } from '@app/contexts/HistoryContext';
import { useSession } from '@app/contexts/SessionContext';
import {
  acceptsInput,
  COMMANDS,
  currentPrompt,
  getInputState,
  route,
  type TerminalState,
} from '@app/terminal';
import type { UserInfo } from '@lib/utils/types';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { InputForm } from './InputForm';
import ReplLoading from './ReplLoading';
import { useInterpreter } from './useInterpreter';
import { useStartup } from './useStartup';

interface ReplProps {
  /** Null when client info failed to load; the startup then skips that step. */
  clientInfo: UserInfo | null;
  isClientInfoLoading: boolean;
}

/** Routes each submitted line to a command, a pending question, or the chat. */
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

  // The input can appear in the same commit that changes these, before a passive effect would
  // re-register the handler. Reading them from a ref updated before paint means an Enter pressed
  // right away still sees the current mode.
  const latest = useRef({ inputState, mode, state, apply });
  useLayoutEffect(() => {
    latest.current = { inputState, mode, state, apply };
  });

  useEffect(() => {
    function handleSubmit(command: HistoryItem) {
      const { inputState, mode, state, apply } = latest.current;
      // The input is hidden in other states, so this only guards against a stray submit.
      if (!acceptsInput(inputState)) return;
      void apply(route(command.value, mode, state));
    }

    const unregister = eventBus.on(EVENTS.SUBMIT, handleSubmit);
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
