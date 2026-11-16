import type { ChatResult } from '@lib/hooks/types';

import type { HistoryItem } from './history/types';
import type { Mode } from './types';

/** Everything the interpreter can do to the outside. Contexts and hooks are the adapters. */
export interface Ports {
  history: { append(item: HistoryItem): void; clear(): void };
  session: {
    setName(name: string): void;
    setMode(mode: Mode): void;
    newConversation(): void;
    /** Back to a first visit: no name, command mode, a new session id. */
    reset(): void;
  };
  chat: { send(message: string): Promise<ChatResult>; cancel(): void };
  screen: {
    /** Scrolls so the prompt sits at the top. Earlier output stays above it. */
    scrollClear(): void;
    /** Drops the space scrollClear made, for when the history it scrolled past is gone. */
    reset(): void;
  };
  /** Cuts the streaming reply where it is and shows the rest of the output at once. */
  reveal: { stop(): void };
}
