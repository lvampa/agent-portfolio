import type { Command } from '../types';
import { printList } from '../utils';

export const help: Command = {
  names: ['help', 'h'],
  description: 'List the commands.',
  run: (state) => [
    printList(
      state.commands.map((command) => ({
        term: command.names.join(', '),
        detail: command.description,
      })),
    ),
  ],
};
