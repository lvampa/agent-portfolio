import { BANNER_LINES, GUIDANCE_LINE, QUESTION_IDS } from './constants';
import { HISTORY_ITEM_TYPES } from './history/constants';
import type { Effect, TerminalState } from './types';
import { ask, print, printText } from './utils';

export function startupEffects(state: TerminalState): Effect[] {
  return [
    ...BANNER_LINES.map(printText),
    ...(state.clientInfo
      ? [print({ type: HISTORY_ITEM_TYPES.CLIENT_INFO, info: state.clientInfo })]
      : []),
    ...(state.name ? [] : [ask(QUESTION_IDS.IDENTIFY)]),
    printText(GUIDANCE_LINE),
  ];
}
