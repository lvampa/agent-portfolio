import type { RevealProgress } from './types';

export const LINE_REVEAL_MS = 60;
export const STREAM_MS_PER_CHAR = 4;
export const REVEAL_TICK_MS = 16;
export const CLIENT_INFO_PAUSE_MS = 150;
export const ECHO_PAUSE_MS = 150;

// Past every step, so a fully shown item renders the same whatever its steps are.
export const REVEALED: RevealProgress = { step: Infinity, chars: Infinity, isDone: true };
