import type { ChatResult } from '@lib/hooks/types';
import { randomUuid } from '@lib/utils/uuid';

import {
  CHAT_FAILURES,
  DEFAULT_SESSION,
  MAX_NAME_LENGTH,
  QUESTION_IDS,
  UNKNOWN_NAME,
} from './constants';
import type { HistoryItem, ListRow } from './history/types';
import type { Effect, InputState, InputStateInput, QuestionId, Session } from './types';

/** The only place names are cleaned. `\` and `>` would break the prompt, so they are stripped. */
export function sanitizeName(raw: string): string | null {
  const stripped = raw.replace(/[\\>]/g, '').trim();
  // Array.from splits on code points, so the cap never cuts an emoji in half.
  const capped = Array.from(stripped).slice(0, MAX_NAME_LENGTH).join('').trimEnd();
  return capped || null;
}

/** A client info label as a list term. The colon is data, so List stays generic and help keeps none. */
export function infoTerm(label: string): string {
  return `${label}:`;
}

export function promptFor(name: string | null): string {
  return `C:\\Users\\${name ?? UNKNOWN_NAME}>`;
}

/** Checks run in the order of the InputState union, so starting wins over everything. */
export function getInputState({
  hasStarted,
  busy,
  isRevealing,
  mode,
}: InputStateInput): InputState {
  if (!hasStarted) return 'starting';
  if (busy) return 'busy';
  if (isRevealing) return 'revealing';
  if (mode.type === 'awaiting') return 'awaiting';
  return 'idle';
}

export function acceptsInput(inputState: InputState): boolean {
  return inputState === 'idle' || inputState === 'awaiting';
}

/** Re-sanitizes a stored name, so an edited value cannot break the prompt. */
export function normalizeSession(stored: Session | null): Session {
  if (!stored) return { ...DEFAULT_SESSION, sessionId: randomUuid() };
  const name = stored.name === null ? null : sanitizeName(stored.name);
  return { name, mode: stored.mode, sessionId: stored.sessionId };
}

export function print(item: HistoryItem): Effect {
  return { type: 'print', item };
}

export function printText(text: string): Effect {
  return print({ type: 'text', text });
}

export function printList(items: ListRow[]): Effect {
  return print({ type: 'list', items });
}

export function echo(line: string, prompt: string): Effect {
  return print({ type: 'command', line, prompt });
}

export function clearScreen(): Effect {
  return { type: 'clear' };
}

export function newConversation(): Effect {
  return { type: 'newConversation' };
}

export function setName(name: string): Effect {
  return { type: 'setName', name };
}

export function ask(questionId: QuestionId, subject?: string): Effect {
  return subject === undefined ? { type: 'ask', questionId } : { type: 'ask', questionId, subject };
}

export function chat(message: string): Effect {
  return { type: 'chat', message };
}

/** A reply prints each message then a blank line. A failure prints its lines, then offers to resend the message. */
export function chatResultEffects(result: ChatResult, message: string): Effect[] {
  if (result.ok) {
    return [
      ...result.replies.map((reply) => print({ type: 'message', text: reply.output })),
      printText(''),
    ];
  }
  return [...CHAT_FAILURES[result.failure].map(print), ask(QUESTION_IDS.RETRY_CHAT, message)];
}

function isBlankLine(effect: Effect): boolean {
  return effect.type === 'print' && effect.item.type === 'text' && effect.item.text === '';
}

/** Output ends with one blank line. A chat or a question ends its own output, and a blank line already there is not doubled. */
export function endWithBlankLine(effects: Effect[]): Effect[] {
  const last = effects.at(-1);
  const printsOutput = effects.some((effect) => effect.type === 'print');
  const endsOwnOutput = !last || last.type === 'chat' || last.type === 'ask' || isBlankLine(last);
  return printsOutput && !endsOwnOutput ? [...effects, printText('')] : effects;
}
