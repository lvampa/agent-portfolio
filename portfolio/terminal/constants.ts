import type { Mode, Session } from './types';

export const BANNER_LINES = [
  'Portfolio Agent (Version 2.1.6)',
  '(c) 2026 Connor Abdelnoor. All rights reserved.',
  '',
] as const;

export const GUIDANCE_LINE = 'Ask about the author, or type help for other commands.';

export const UNKNOWN_NAME = 'unknown';
export const STAYING_UNKNOWN_LINE = `No name given. Staying as ${UNKNOWN_NAME}.`;

export const MAX_NAME_LENGTH = 20;

export const CHAT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export const QUESTION_IDS = {
  IDENTIFY: 'identify',
} as const;

export const COMMAND_MODE: Mode = { type: 'command' };

export const DEFAULT_SESSION: Session = { name: null, mode: COMMAND_MODE };

// The version lives in the key, so a format change starts visitors fresh instead of migrating.
export const STORAGE_KEYS = {
  HISTORY: 'history.v2',
  SESSION: 'session.v1',
} as const;

export const LEGACY_HISTORY_KEYS = ['history'] as const;
