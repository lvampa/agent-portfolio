import { ClientInfo, Command, ErrorLine, Message, Text } from './renderers';
import type { Renderers } from './renderers/types';

export const renderers: Renderers = {
  text: Text,
  command: Command,
  message: Message,
  error: ErrorLine,
  clientInfo: ClientInfo,
};
