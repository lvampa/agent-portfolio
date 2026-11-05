import { UNKNOWN_NAME } from '../constants';
import type { Command } from '../types';
import { printList } from '../utils';

export const whoami: Command = {
  names: ['whoami'],
  description: 'Show your name and client info.',
  run: (state) => [
    printList([
      { term: 'name', detail: state.name ?? UNKNOWN_NAME },
      ...(state.clientInfo ?? []).map(({ label, value }) => ({ term: label, detail: value })),
    ]),
  ],
};
