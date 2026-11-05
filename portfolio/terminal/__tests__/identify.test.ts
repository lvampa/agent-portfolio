import { MAX_NAME_LENGTH, UNCONFIRMED_IDENTITY_LINE } from '../constants';
import { identify } from '../questions';
import type { TerminalState } from '../types';
import { printText, setName } from '../utils';

const state: TerminalState = {
  name: null,
  sessionId: 'session-1',
  clientInfo: null,
  commands: [],
};

describe('identify', () => {
  test('a name sets it and confirms it', () => {
    expect(identify.onAnswer('  connor  ', state)).toEqual([
      setName('connor'),
      printText('Confirmed identity: connor'),
    ]);
  });

  test.each(['', '   ', '>>>', '\\ > \\'])(
    'a blank or all-stripped answer %p stays unconfirmed',
    (answer) => {
      expect(identify.onAnswer(answer, state)).toEqual([printText(UNCONFIRMED_IDENTITY_LINE)]);
    },
  );

  test('the cap never splits an emoji', () => {
    const [effect] = identify.onAnswer(`${'a'.repeat(MAX_NAME_LENGTH - 1)}😀😀`, state);
    expect(effect).toEqual(setName(`${'a'.repeat(MAX_NAME_LENGTH - 1)}😀`));
  });
});
