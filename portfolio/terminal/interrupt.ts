import { INTERRUPT_MARK } from './constants';
import type { Effect, InputState, InterruptContext, InterruptStrategies, Mode } from './types';
import { ask, cancelChat, echoInterrupted, endWithBlankLine, printText, stopReveal } from './utils';

const interruptMark = printText(INTERRUPT_MARK);

// Applying effects drops the pending question, so one that is still wanted is asked again with its parked effects.
function reaskPending(mode: Mode): Effect[] {
  return mode.type === 'awaiting' ? [ask(mode.questionId, mode.subject), ...mode.then] : [];
}

const STRATEGIES: InterruptStrategies = {
  starting: () => [],
  busy: () => endWithBlankLine([cancelChat(), interruptMark]),
  // The startup can still be revealing while its name question is pending.
  revealing: ({ mode }) => [stopReveal(), interruptMark, printText(''), ...reaskPending(mode)],
  // The parked effects still run, so dismissing the startup's name question keeps the guidance line after it.
  awaiting: ({ mode }) =>
    endWithBlankLine([interruptMark, ...(mode.type === 'awaiting' ? mode.then : [])]),
  idle: ({ line, prompt }) => [echoInterrupted(line, prompt)],
};

/** What Ctrl+C does in each state. Applying the effects also drops a pending question, since every apply starts in command mode. */
export function interrupt(inputState: InputState, context: InterruptContext): Effect[] {
  return STRATEGIES[inputState](context);
}
