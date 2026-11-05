import { Storage } from '@lib/storage';

import { LEGACY_HISTORY_KEYS, STORAGE_KEYS } from './constants';

export const historyStore = new Storage(STORAGE_KEYS.HISTORY, LEGACY_HISTORY_KEYS);
// Not named sessionStorage, which would shadow window.sessionStorage.
export const sessionStore = new Storage(STORAGE_KEYS.SESSION);
