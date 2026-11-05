import { QUESTION_IDS } from '../constants';
import { COMMANDS } from '../registry';
import { startupEffects } from '../startup';
import type { TerminalState } from '../types';
import { ask } from '../utils';

const clientInfo = [{ label: 'ip', value: '127.0.0.1' }];

function effectsFor(overrides: Partial<TerminalState>) {
  return startupEffects({ name: null, clientInfo, commands: COMMANDS, ...overrides });
}

function hasClientInfo(state: Partial<TerminalState>) {
  return effectsFor(state).some(
    (effect) => effect.type === 'print' && effect.item.type === 'clientInfo',
  );
}

describe('startupEffects', () => {
  test('asks for a name when none is saved', () => {
    expect(effectsFor({ name: null })).toContainEqual(ask(QUESTION_IDS.IDENTIFY));
  });

  test('leaves out the question when a name is saved', () => {
    expect(effectsFor({ name: 'connor' })).not.toContainEqual(ask(QUESTION_IDS.IDENTIFY));
  });

  test('skips the client info step when it failed to load', () => {
    expect(hasClientInfo({ clientInfo: null })).toBe(false);
    expect(hasClientInfo({})).toBe(true);
  });
});
