export const CLIENT_INFO_COMMAND = 'clientinfo';
export const CLIENT_INFO_LOADING_LINE = 'Loading Client Information....';
export const TYPING_MS_PER_CHAR = 15;
export const INFO_TYPING_MS_PER_CHAR = 10;

// Each line starts once the line above has finished typing, then a beat.
// The info rows start at CLIENT_INFO_LINES_DELAY_MS: labels appear at once, and values type.
export const CLIENT_INFO_LOADING_DELAY_MS = CLIENT_INFO_COMMAND.length * TYPING_MS_PER_CHAR + 250;
export const CLIENT_INFO_LINES_DELAY_MS =
  CLIENT_INFO_LOADING_DELAY_MS + CLIENT_INFO_LOADING_LINE.length * TYPING_MS_PER_CHAR + 550;
