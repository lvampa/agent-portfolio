import { Storage } from '@lib/storage';

import { LEGACY_HISTORY_KEYS, STORAGE_KEYS } from './constants';

export const historyStore = new Storage(STORAGE_KEYS.HISTORY, LEGACY_HISTORY_KEYS);
// Not named sessionStorage, which would shadow window.sessionStorage.
export const sessionStore = new Storage(STORAGE_KEYS.SESSION);

/** Local dev flag that makes every load start empty, so the startup replays. Read per call so tests can set it. */
export function isHistoryDisabled(): boolean {
  return process.env.NEXT_PUBLIC_NO_HISTORY === 'true';
}
