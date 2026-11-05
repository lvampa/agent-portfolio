import type { Command } from '../types';
import { clearScreen, newConversation } from '../utils';

export const cls: Command = {
  names: ['cls', 'clear'],
  description: 'Clear the screen.',
  run: () => [clearScreen(), newConversation()],
};
