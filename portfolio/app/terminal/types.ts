import type { UserInfo } from '@lib/utils/types';
import type { z } from 'zod';

import type { EffectSchema, ModeSchema, QuestionIdSchema, SessionSchema } from './schemas';

export type Effect = z.infer<typeof EffectSchema>;
export type Mode = z.infer<typeof ModeSchema>;
export type QuestionId = z.infer<typeof QuestionIdSchema>;
export type Session = z.infer<typeof SessionSchema>;

export interface TerminalState {
  name: string | null;
  /** From buildUserInfoForUi, or null when client info failed to load. */
  clientInfo: UserInfo | null;
  // Passed in so help can list the registry without importing it, which would be a cycle.
  commands: readonly Command[];
}

export interface Command {
  /** The first name is the one help shows first. */
  names: readonly string[];
  description: string;
  /** `args` is the rest of the line after the first word. */
  run(args: string, state: TerminalState): Effect[];
}

export interface Question {
  id: QuestionId;
  /** Shown as the input prompt while waiting for the answer. */
  text: string;
  onAnswer(answer: string, state: TerminalState): Effect[];
}

export type InputState = 'starting' | 'busy' | 'animating' | 'awaiting' | 'idle';

export interface InputStateInput {
  /** Everything loaded and the startup ran or was skipped. */
  hasStarted: boolean;
  busy: boolean;
  isAnimating: boolean;
  mode: Mode;
}
