import { COMMAND_INPUT_LABEL } from './constants';
import { QUESTIONS } from './questions';
import { ROUTES } from './routes';
import type { Effect, Mode, TerminalState } from './types';
import { echo, endWithBlankLine, promptFor } from './utils';

/** The prompt the input shows, which is also the prompt the typed line is echoed with. */
export function currentPrompt(mode: Mode, name: string | null): string {
  return mode.type === 'awaiting' ? QUESTIONS[mode.questionId].text : promptFor(name);
}

/** The input's accessible name, which stands in for the aria-hidden visible prompt. */
export function currentInputLabel(mode: Mode): string {
  return mode.type === 'awaiting' ? QUESTIONS[mode.questionId].label : COMMAND_INPUT_LABEL;
}

/** Returns the echo of the line, then the effects of the first route that claims it, ending with a blank line when they print. */
export function route(line: string, mode: Mode, state: TerminalState): Effect[] {
  const lineEcho = echo(line, currentPrompt(mode, state.name));
  for (const link of ROUTES) {
    const effects = link.handle(line, mode, state);
    if (effects) return [lineEcho, ...endWithBlankLine(effects)];
  }
  // sendToChat always claims the line, so reaching here means ROUTES lost its last link.
  throw new Error('No route claimed the line');
}
