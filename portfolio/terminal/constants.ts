import type { Mode, Session } from './types';

export const BANNER_LINES = [
  'Portfolio Agent (Version 2.1.6)',
  '(c) 2026 Connor Abdelnoor. All rights reserved.',
  '',
] as const;

export const GUIDANCE_LINE = 'Ask about the author, or type help for other commands.';

export const UNKNOWN_NAME = 'unknown';
export const COMMAND_INPUT_LABEL = 'Command or question';
export const UNCONFIRMED_IDENTITY_LINE = 'Unconfirmed identity';

export const MAX_NAME_LENGTH = 20;

export const CHAT_ERROR_MESSAGE = 'The agent did not respond. Try again in a moment.';

export const QUESTION_IDS = {
  IDENTIFY: 'identify',
} as const;

export const COMMAND_MODE: Mode = { type: 'command' };

// No sessionId, because each new session needs its own.
export const DEFAULT_SESSION: Omit<Session, 'sessionId'> = { name: null, mode: COMMAND_MODE };

// The version lives in the key, so a format change starts visitors fresh instead of migrating.
export const STORAGE_KEYS = {
  HISTORY: 'history.v2',
  SESSION: 'session.v1',
} as const;

export const LEGACY_HISTORY_KEYS = ['history'] as const;
