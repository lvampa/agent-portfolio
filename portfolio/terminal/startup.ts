import { BANNER_LINES, GUIDANCE_LINE, QUESTION_IDS } from './constants';
import type { Effect, TerminalState } from './types';
import { ask, newConversation, print, printText, promptFor } from './utils';

export function startupEffects(state: TerminalState): Effect[] {
  return [
    // A replayed startup means empty history, so the agent should not remember the last conversation.
    newConversation(),
    ...BANNER_LINES.map(printText),
    ...(state.clientInfo
      ? [print({ type: 'clientInfo', info: state.clientInfo, prompt: promptFor(state.name) })]
      : []),
    ...(state.name ? [] : [printText(''), ask(QUESTION_IDS.IDENTIFY)]),
    printText(''),
    printText(GUIDANCE_LINE),
    printText(''),
  ];
}
