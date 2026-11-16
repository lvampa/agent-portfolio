import { startupEffects } from '../startup';
import type { Command } from '../types';
import { clearHistory, resetSession } from '../utils';

export const reset: Command = {
  names: ['reset'],
  description: 'Forget everything and start over.',
  // The startup is built for a visitor with no name, since the session is wiped before it runs.
  run: (state) => [clearHistory(), resetSession(), ...startupEffects({ ...state, name: null })],
};
