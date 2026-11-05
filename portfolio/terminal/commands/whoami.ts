import { UNKNOWN_NAME } from '../constants';
import type { Command } from '../types';
import { formatInfoLine, printText } from '../utils';

export const whoami: Command = {
  names: ['whoami'],
  description: 'Show your name and client info.',
  run: (state) => [
    printText(`name: ${state.name ?? UNKNOWN_NAME}`),
    ...(state.clientInfo ?? []).map((infoItem) => printText(formatInfoLine(infoItem))),
  ],
};
