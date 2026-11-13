import type { UserInfo } from '@lib/utils/types';
import type { z } from 'zod';

import type { Ports } from './ports';
import type { EffectSchema, ModeSchema, QuestionIdSchema, SessionSchema } from './schemas';

export type Effect = z.infer<typeof EffectSchema>;
export type EffectType = Effect['type'];
export type EffectOf<K extends EffectType> = Extract<Effect, { type: K }>;
export type Mode = z.infer<typeof ModeSchema>;
export type QuestionId = z.infer<typeof QuestionIdSchema>;
export type Session = z.infer<typeof SessionSchema>;

export interface TerminalState {
  name: string | null;
  /** Keys the agent's memory. A new one starts on cls and when the startup replays. */
  sessionId: string;
  /** From buildUserInfoForUi, or null when client info failed to load. */
  clientInfo: UserInfo | null;
  // Passed in so help can list the registry without importing it, which would be a cycle.
  commands: readonly Command[];
}

export interface Command {
  /** The first name is the one help shows first. */
  names: readonly string[];
  description: string;
  run(state: TerminalState): Effect[];
}

export interface Question {
  id: QuestionId;
  /** Shown as the input prompt while waiting for the answer. */
  text: string;
  /** The input's accessible name while waiting, since the visible prompt is aria-hidden. */
  label: string;
  /** Keys that answer at once, without Enter. Other single keys do not type. */
  answerKeys?: readonly string[];
  /** `subject` is what the question is about, such as the message a retry resends. */
  onAnswer(answer: string, state: TerminalState, subject?: string): Effect[];
}

/** One link in the routing chain. Returns null to pass the line to the next link. */
export interface Route {
  name: string;
  handle(line: string, mode: Mode, state: TerminalState): Effect[] | null;
}

export type EffectOutcome = 'continue' | 'stop';

export interface EffectContext {
  ports: Ports;
  /** The effects after this one, including follow-ups, which an ask parks in the awaiting mode. */
  rest: Effect[];
}

export type EffectHandlers = {
  [K in EffectType]: (
    effect: EffectOf<K>,
    context: EffectContext,
  ) => EffectOutcome | Promise<Effect[]>;
};

export type InputState = 'starting' | 'busy' | 'revealing' | 'awaiting' | 'idle';

export interface InputStateInput {
  /** Everything loaded and the startup ran or was skipped. */
  hasStarted: boolean;
  busy: boolean;
  isRevealing: boolean;
  mode: Mode;
}
