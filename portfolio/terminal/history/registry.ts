import {
  CLIENT_INFO_PAUSE_MS,
  ECHO_PAUSE_MS,
  LINE_REVEAL_MS,
  STREAM_MS_PER_CHAR,
} from './constants';
import { ClientInfo } from './renderers/ClientInfo';
import { Command } from './renderers/Command';
import {
  CLIENT_INFO_COMMAND,
  CLIENT_INFO_LOADING_LINE,
  TYPING_MS_PER_CHAR,
} from './renderers/constants';
import { ErrorLine } from './renderers/ErrorLine';
import { LinkLine } from './renderers/LinkLine';
import { List } from './renderers/List';
import { Message } from './renderers/Message';
import { Text } from './renderers/Text';
import type { Renderers, RevealStepsRegistry } from './renderers/types';
import type { HistoryItem, RevealStep } from './types';
import { hold, parseReply, replyLength, stream } from './utils';

export const renderers: Renderers = {
  text: Text,
  command: Command,
  message: Message,
  error: ErrorLine,
  clientInfo: ClientInfo,
  list: List,
  link: LinkLine,
};

const lineHold = () => [hold(LINE_REVEAL_MS)];

// ClientInfo reads these by index: the command, a pause, the loading line, then one per row.
export const REVEAL_STEPS: RevealStepsRegistry = {
  text: lineHold,
  link: lineHold,
  error: lineHold,
  // An empty Enter has no steps, so the prompt does not blink.
  command: (item) => (item.line ? [hold(ECHO_PAUSE_MS)] : []),
  list: (item) => item.items.map(() => hold(LINE_REVEAL_MS)),
  message: (item) => [stream(replyLength(parseReply(item.text)), STREAM_MS_PER_CHAR)],
  clientInfo: (item) =>
    item.info.length
      ? [
          stream(CLIENT_INFO_COMMAND.length, TYPING_MS_PER_CHAR),
          hold(CLIENT_INFO_PAUSE_MS),
          stream(CLIENT_INFO_LOADING_LINE.length, STREAM_MS_PER_CHAR),
          ...item.info.map(({ value }) => stream(value.length, STREAM_MS_PER_CHAR)),
        ]
      : [],
};

export function revealStepsFor(item: HistoryItem): RevealStep[] {
  // TypeScript cannot tie item.type to the matching entry, so the lookup widens the entry's item type.
  return (REVEAL_STEPS[item.type] as (item: HistoryItem) => RevealStep[])(item);
}
