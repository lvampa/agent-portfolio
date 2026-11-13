export const CLIENT_INFO_COMMAND = 'clientinfo';
export const CLIENT_INFO_LOADING_LINE = 'Loading Client Information....';
export const TYPING_MS_PER_CHAR = 15;

// Matches the order of the clientInfo entry in REVEAL_STEPS.
export const CLIENT_INFO_STEPS = { COMMAND: 0, LOADING: 2, FIRST_ROW: 3 } as const;
