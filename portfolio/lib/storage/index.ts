import { LEGACY_HISTORY_KEYS, STORAGE_KEYS } from './constants';
import { Storage } from './Storage';

export type { Storage };
export { isHistoryDisabled } from './utils';
export const storage = new Storage(STORAGE_KEYS.HISTORY, LEGACY_HISTORY_KEYS);
export const sessionStore = new Storage(STORAGE_KEYS.SESSION);
