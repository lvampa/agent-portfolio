import { HISTORY_ITEM_TYPES } from '@app/components/History/constants';
import type { HistoryItem } from '@app/components/History/types';
import type { UserInfo } from '@lib/utils/types';

import { DEFAULT_SESSION, MAX_NAME_LENGTH, UNKNOWN_NAME } from './constants';
import type { Effect, InputState, InputStateInput, QuestionId, Session } from './types';

/** The only place names are cleaned. `\` and `>` would break the prompt, so they are stripped. */
export function sanitizeName(raw: string): string | null {
  const stripped = raw.replace(/[\\>]/g, '').trim();
  // Array.from splits on code points, so the cap never cuts an emoji in half.
  const capped = Array.from(stripped).slice(0, MAX_NAME_LENGTH).join('').trimEnd();
  return capped || null;
}

export function promptFor(name: string | null): string {
  return `C:\\Users\\${name ?? UNKNOWN_NAME} >`;
}

export function splitLine(line: string): { commandName: string; args: string } {
  const [, commandName = '', args = ''] = /^\s*(\S*)\s*([\s\S]*)$/.exec(line) ?? [];
  return { commandName, args: args.trimEnd() };
}

/** Checks run in the order of the InputState union, so starting wins over everything. */
export function getInputState({
  hasStarted,
  busy,
  isAnimating,
  mode,
}: InputStateInput): InputState {
  if (!hasStarted) return 'starting';
  if (busy) return 'busy';
  if (isAnimating) return 'animating';
  if (mode.type === 'awaiting') return 'awaiting';
  return 'idle';
}

export function acceptsInput(inputState: InputState): boolean {
  return inputState === 'idle' || inputState === 'awaiting';
}

/** Re-sanitizes a stored name, so an edited value cannot break the prompt. */
export function normalizeSession(stored: Session | null): Session {
  if (!stored) return DEFAULT_SESSION;
  const name = stored.name === null ? null : sanitizeName(stored.name);
  return { name, mode: stored.mode };
}

export function userInfoItem(clientInfo: UserInfo): HistoryItem {
  return { type: HISTORY_ITEM_TYPES.USER, value: JSON.stringify(clientInfo) };
}

export function printItem(item: HistoryItem): Effect {
  return { type: 'print', item };
}

export function printLine(text: string): Effect {
  return printItem({ type: HISTORY_ITEM_TYPES.OUTPUT, value: text });
}

export function echo(line: string, prompt: string): Effect {
  return printItem({ type: HISTORY_ITEM_TYPES.COMMAND, value: line, prompt });
}

export function clearScreen(): Effect {
  return { type: 'clear' };
}

export function setName(name: string): Effect {
  return { type: 'setName', name };
}

export function ask(questionId: QuestionId): Effect {
  return { type: 'ask', questionId };
}

export function chat(message: string): Effect {
  return { type: 'chat', message };
}
