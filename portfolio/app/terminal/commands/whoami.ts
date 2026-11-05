import { UNKNOWN_NAME } from '../constants';
import type { Command } from '../types';
import { printLine } from '../utils';

export const whoami: Command = {
  names: ['whoami'],
  description: 'Show your name and client information.',
  run: (_args, state) => [
    printLine(state.name ?? UNKNOWN_NAME),
    ...(state.clientInfo ?? []).map((info) => printLine(`${info.label}: ${info.value}`)),
  ],
};
