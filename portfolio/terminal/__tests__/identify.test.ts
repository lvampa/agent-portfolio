import { MAX_NAME_LENGTH, STAYING_UNKNOWN_LINE } from '../constants';
import { identify } from '../questions';
import { COMMANDS } from '../registry';
import type { TerminalState } from '../types';
import { printText, setName } from '../utils';

const state: TerminalState = { name: null, clientInfo: null, commands: COMMANDS };

describe('identify', () => {
  test('a name sets it', () => {
    expect(identify.onAnswer('  connor  ', state)).toEqual([setName('connor')]);
  });

  test.each(['', '   ', '>>>', '\\ > \\'])(
    'a blank or all-stripped answer %p stays unknown',
    (answer) => {
      expect(identify.onAnswer(answer, state)).toEqual([printText(STAYING_UNKNOWN_LINE)]);
    },
  );

  test('the cap never splits an emoji', () => {
    const [effect] = identify.onAnswer(`${'a'.repeat(MAX_NAME_LENGTH - 1)}😀😀`, state);
    expect(effect).toEqual(setName(`${'a'.repeat(MAX_NAME_LENGTH - 1)}😀`));
  });
});
