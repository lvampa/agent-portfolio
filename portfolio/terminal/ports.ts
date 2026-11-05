import type { HistoryItem } from './history/types';
import type { ChatReply, Mode } from './types';

/** Everything the interpreter can do to the outside. Contexts and hooks are the adapters. */
export interface Ports {
  history: { append(item: HistoryItem): void; clear(): void };
  session: { setName(name: string): void; setMode(mode: Mode): void };
  /** Resolves to null when the request fails or the reply does not validate. */
  chat: { send(message: string): Promise<ChatReply[] | null> };
}
