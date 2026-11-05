/** Read at call time, not at import, so tests can set the flag per test. */
export function isHistoryDisabled(): boolean {
  return process.env.NEXT_PUBLIC_NO_HISTORY === 'true';
}
