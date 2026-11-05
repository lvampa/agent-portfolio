import { DEFAULT_SESSION, MAX_NAME_LENGTH, UNKNOWN_NAME } from './constants';
import type { HistoryItem } from './history/types';
import type { Effect, InputState, InputStateInput, QuestionId, Session } from './types';

/** The only place names are cleaned. `\` and `>` would break the prompt, so they are stripped. */
export function sanitizeName(raw: string): string | null {
  const stripped = raw.replace(/[\\>]/g, '').trim();
  // Array.from splits on code points, so the cap never cuts an emoji in half.
  const capped = Array.from(stripped).slice(0, MAX_NAME_LENGTH).join('').trimEnd();
  return capped || null;
}

export function promptFor(name: string | null): string {
  return `C:\\Users\\${name ?? UNKNOWN_NAME}>`;
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

export function print(item: HistoryItem): Effect {
  return { type: 'print', item };
}

export function printText(text: string): Effect {
  return print({ type: 'text', text });
}

export function echo(line: string, prompt: string): Effect {
  return print({ type: 'command', line, prompt });
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
