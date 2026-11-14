import { REQUEST_TIMEOUT_MS } from '@lib/api/constants';
import type { ChatFailure } from '@lib/hooks/types';

import { LINKEDIN_URL, STATIC_PORTFOLIO_URL } from '../app/constants';
import type { HistoryItem, HistoryItemOf } from './history/types';
import type { Mode, Session } from './types';

export const BANNER_LINES = [
  'Portfolio Agent (Version 2.1.6)',
  '(c) 2026 Connor Abdelnoor. All rights reserved.',
] as const;

export const PORTFOLIO_LINK: HistoryItemOf<'link'> = {
  type: 'link',
  text: 'Traditional portfolio @: ',
  label: STATIC_PORTFOLIO_URL,
  href: STATIC_PORTFOLIO_URL,
};

export const GUIDANCE_LINE = 'Ask about the author, or type help for other commands.';

export const UNKNOWN_NAME = 'unknown';
export const COMMAND_INPUT_LABEL = 'Command or question';
export const UNCONFIRMED_IDENTITY_LINE = 'Unconfirmed identity';

export const MAX_NAME_LENGTH = 20;

const CHAT_ERROR_MESSAGE = 'The agent did not respond. Try again in a moment.';

// Every failure offers a retry. Even a 429 may be the per-minute limit rather than the daily one.
export const CHAT_FAILURES: Record<ChatFailure, HistoryItem[]> = {
  timeout: [
    { type: 'error', text: `The agent did not respond in ${REQUEST_TIMEOUT_MS / 1000} seconds.` },
  ],
  network: [
    { type: 'error', text: 'Could not reach the agent. It may be offline. Try again in a moment.' },
  ],
  quota: [
    {
      type: 'error',
      text: "Connor's free tier agent is refusing to work any more for the moment.",
    },
    {
      type: 'link',
      text: 'Try again later or just message Connor on LinkedIn @ ',
      label: LINKEDIN_URL,
      href: LINKEDIN_URL,
    },
  ],
  server: [{ type: 'error', text: CHAT_ERROR_MESSAGE }],
};

export const QUESTION_IDS = {
  IDENTIFY: 'identify',
  RETRY_CHAT: 'retryChat',
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
