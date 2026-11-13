import type { HistoryState, RevealProgress } from './types';

export const LINE_REVEAL_MS = 60;
export const STREAM_MS_PER_CHAR = 4;
export const REVEAL_TICK_MS = 16;
export const CLIENT_INFO_PAUSE_MS = 150;
export const ECHO_PAUSE_MS = 150;

// Past every step, so a fully shown item renders the same whatever its steps are.
export const REVEALED: RevealProgress = { step: Infinity, chars: Infinity, isDone: true };

export const EMPTY_STATE: HistoryState = { items: [], revealedCount: 0, generation: 0 };

export const LIST_LINE = /^\s*[-*] /;

// Markdown links, bold, bare URLs, and emails. Only https links, so no other scheme becomes clickable.
export const INLINE_TOKEN =
  /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|\*\*([^*\n]+?)\*\*|(https:\/\/[^\s<>]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
export const TRAILING_PUNCTUATION = /[.,;:!?)\]'"]+$/;
