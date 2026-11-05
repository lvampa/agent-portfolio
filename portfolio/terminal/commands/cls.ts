import type { Command } from '../types';
import { clearScreen } from '../utils';

export const cls: Command = {
  names: ['cls', 'clear'],
  description: 'Clear the screen.',
  run: () => [clearScreen()],
};
