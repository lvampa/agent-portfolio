import { QUESTION_IDS } from '../constants';
import { startupEffects } from '../startup';
import type { TerminalState } from '../types';
import { ask, print, printText, promptFor } from '../utils';

const clientInfo = [{ label: 'ip', value: '127.0.0.1' }];

function effectsFor(overrides: Partial<TerminalState>) {
  return startupEffects({
    name: null,
    sessionId: 'session-1',
    clientInfo,
    commands: [],
    ...overrides,
  });
}

function hasClientInfo(state: Partial<TerminalState>) {
  return effectsFor(state).some(
    (effect) => effect.type === 'print' && effect.item.type === 'clientInfo',
  );
}

describe('startupEffects', () => {
  test('asks for a name after a blank line when none is saved', () => {
    const effects = effectsFor({ name: null });
    const askIndex = effects.findIndex((effect) => effect.type === 'ask');

    expect(effects[askIndex]).toEqual(ask(QUESTION_IDS.IDENTIFY));
    expect(effects[askIndex - 1]).toEqual(printText(''));
  });

  test('leaves out the question and its blank line when a name is saved', () => {
    const named = effectsFor({ name: 'connor' });
    const unnamed = effectsFor({ name: null });

    expect(named).not.toContainEqual(ask(QUESTION_IDS.IDENTIFY));
    expect(named).toHaveLength(unnamed.length - 2);
  });

  test('types clientinfo after the prompt for the saved name', () => {
    expect(effectsFor({ name: 'connor' })).toContainEqual(
      print({ type: 'clientInfo', info: clientInfo, prompt: promptFor('connor') }),
    );
  });

  test('skips the client info step when it failed to load', () => {
    expect(hasClientInfo({ clientInfo: null })).toBe(false);
    expect(hasClientInfo({})).toBe(true);
  });
});
