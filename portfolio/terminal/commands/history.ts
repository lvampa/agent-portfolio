import type { Command } from '../types';
import { printList, printText } from '../utils';

export const history: Command = {
  names: ['history'],
  description: "List the commands you've typed.",
  run: (state) =>
    state.commandHistory.length
      ? [
          printList(
            state.commandHistory.map((line, index) => ({ term: String(index + 1), detail: line })),
          ),
        ]
      : [printText('No commands yet.')],
};
