import type { Command } from '../types';
import { scrollClear } from '../utils';

export const cls: Command = {
  names: ['cls', 'clear'],
  description: 'Clear the screen. Scroll up to see earlier output.',
  run: () => [scrollClear()],
};
