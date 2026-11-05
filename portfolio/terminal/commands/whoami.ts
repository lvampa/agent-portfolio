import { UNKNOWN_NAME } from '../constants';
import type { Command } from '../types';
import { printText } from '../utils';

export const whoami: Command = {
  names: ['whoami'],
  description: 'Show your name and client information.',
  run: (state) => [
    printText(`name: ${state.name ?? UNKNOWN_NAME}`),
    ...(state.clientInfo ?? []).map((info) => printText(`${info.label}: ${info.value}`)),
  ],
};
