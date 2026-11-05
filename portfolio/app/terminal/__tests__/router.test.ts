import { help } from '../commands';
import { GUIDANCE_LINE, QUESTION_IDS } from '../constants';
import { identify } from '../questions';
import { COMMANDS } from '../registry';
import { route } from '../router';
import type { Effect, Mode, TerminalState } from '../types';
import { chat, echo, printLine, promptFor, setName } from '../utils';

const state: TerminalState = { name: null, clientInfo: null, commands: COMMANDS };
const commandMode: Mode = { type: 'command' };
const awaitingIdentify: Mode = {
  type: 'awaiting',
  questionId: QUESTION_IDS.IDENTIFY,
  then: [printLine(GUIDANCE_LINE)],
};
const prompt = promptFor(null);

describe('route', () => {
  test.each<[string, string, Mode, Effect[]]>([
    [
      'an awaiting mode sends the line to the question, then appends then',
      'connor',
      awaitingIdentify,
      [echo('connor', identify.text), setName('connor'), printLine(GUIDANCE_LINE)],
    ],
    [
      'a command name matches case-insensitively',
      'HELP',
      commandMode,
      [echo('HELP', prompt), ...help.run('', state)],
    ],
    [
      'an unknown line goes to the chat',
      'who is connor?',
      commandMode,
      [echo('who is connor?', prompt), chat('who is connor?')],
    ],
    [
      'a command word followed by more text goes to the chat',
      'help me understand his AWS work',
      commandMode,
      [echo('help me understand his AWS work', prompt), chat('help me understand his AWS work')],
    ],
    ['a blank line in command mode is only echoed', '  ', commandMode, [echo('  ', prompt)]],
  ])('%s', (_description, line, mode, expected) => {
    expect(route(line, mode, state)).toEqual(expected);
  });
});
