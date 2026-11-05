export const MAX_STORED_ITEMS = 200;

// The version lives in the key, so a format change starts visitors fresh instead of migrating.
export const STORAGE_KEYS = {
  HISTORY: 'history.v2',
  SESSION: 'session.v1',
} as const;

export const LEGACY_HISTORY_KEYS = ['history'] as const;
