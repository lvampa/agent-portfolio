import type { ChatResult } from '@lib/hooks/types';

import type { HistoryItem } from './history/types';
import type { Mode } from './types';

/** Everything the interpreter can do to the outside. Contexts and hooks are the adapters. */
export interface Ports {
  history: { append(item: HistoryItem): void; clear(): void };
  session: { setName(name: string): void; setMode(mode: Mode): void; newConversation(): void };
  chat: { send(message: string): Promise<ChatResult> };
}
