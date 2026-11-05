import { GUIDANCE_LINE, QUESTION_IDS } from '../constants';
import { identify } from '../questions';
import { createRegistry } from '../registry';
import { route } from '../router';
import type { Command, Effect, Mode, TerminalState } from '../types';
import { chat, echo, printText, promptFor, setName } from '../utils';

// The registry ships empty, so routing is tested against a command that exists only here.
const ping: Command = {
  names: ['ping'],
  description: 'Replies pong.',
  run: () => [printText('pong')],
};
const state: TerminalState = { name: null, clientInfo: null, commands: createRegistry([ping]) };
const commandMode: Mode = { type: 'command' };
const awaitingIdentify: Mode = {
  type: 'awaiting',
  questionId: QUESTION_IDS.IDENTIFY,
  then: [printText(GUIDANCE_LINE)],
};
const prompt = promptFor(null);

describe('route', () => {
  test.each<[string, string, Mode, Effect[]]>([
    [
      'an awaiting mode sends the line to the question, then appends then',
      'connor',
      awaitingIdentify,
      [
        echo('connor', identify.text),
        setName('connor'),
        printText('Confirmed identity: connor'),
        printText(GUIDANCE_LINE),
      ],
    ],
    [
      'a command name matches case-insensitively',
      'PING',
      commandMode,
      [echo('PING', prompt), printText('pong')],
    ],
    [
      'a command word followed by more text goes to the chat',
      'ping me about his AWS work',
      commandMode,
      [echo('ping me about his AWS work', prompt), chat('ping me about his AWS work')],
    ],
    ['a blank line in command mode is only echoed', '  ', commandMode, [echo('  ', prompt)]],
  ])('%s', (_description, line, mode, expected) => {
    expect(route(line, mode, state)).toEqual(expected);
  });
});
