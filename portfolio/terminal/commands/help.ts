import { HELP_FOOTER } from '../constants';
import type { Command } from '../types';
import { printList, printText } from '../utils';

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
    printText(HELP_FOOTER),
  ],
};
