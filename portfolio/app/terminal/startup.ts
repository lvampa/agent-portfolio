import { BANNER_LINES, GUIDANCE_LINE, QUESTION_IDS } from './constants';
import type { Effect, TerminalState } from './types';
import { ask, printItem, printLine, userInfoItem } from './utils';

export function startupEffects(state: TerminalState): Effect[] {
  return [
    ...BANNER_LINES.map((line) => printLine(line)),
    ...(state.clientInfo ? [printItem(userInfoItem(state.clientInfo))] : []),
    ...(state.name ? [] : [ask(QUESTION_IDS.IDENTIFY)]),
    printLine(GUIDANCE_LINE),
  ];
}
