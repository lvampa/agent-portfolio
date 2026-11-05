import type { Command } from '../types';
import { printText } from '../utils';

export const help: Command = {
  names: ['help', 'h'],
  description: 'List the commands.',
  run: (state) =>
    state.commands.map((command) =>
      printText(`${command.names.join(', ')} - ${command.description}`),
    ),
};
