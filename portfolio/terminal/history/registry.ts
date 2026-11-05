import { ClientInfo } from './renderers/ClientInfo';
import { Command } from './renderers/Command';
import { ErrorLine } from './renderers/ErrorLine';
import { Message } from './renderers/Message';
import { Text } from './renderers/Text';
import type { Renderers } from './renderers/types';

export const renderers: Renderers = {
  text: Text,
  command: Command,
  message: Message,
  error: ErrorLine,
  clientInfo: ClientInfo,
};
