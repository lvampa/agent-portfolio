import type { Command } from '../types';
import { printLine } from '../utils';

export const help: Command = {
  names: ['help', 'h'],
  description: 'List the commands.',
  run: (_args, state) =>
    state.commands.map((command) =>
      printLine(`${command.names.join(', ')} - ${command.description}`),
    ),
};
