import { COMMANDS, findCommand } from '../registry';
import { route } from '../router';
import type { TerminalState } from '../types';
import { startupEffects } from '../startup';
import {
  clearHistory,
  echo,
  printList,
  printText,
  promptFor,
  resetSession,
  scrollClear,
} from '../utils';

const state: TerminalState = {
  name: null,
  sessionId: 'session-1',
  clientInfo: null,
  commands: COMMANDS,
  commandHistory: [],
};

function run(name: string, overrides: Partial<TerminalState> = {}) {
  const command = findCommand(COMMANDS, name);
  if (!command) throw new Error(`No command named ${name}`);
  return command.run({ ...state, ...overrides });
}

describe('commands', () => {
  test('help lists every registered command with all its names', () => {
    const [effect, ...rest] = run('help');
    const rows = effect.type === 'print' && effect.item.type === 'list' ? effect.item.items : [];

    expect(rest).toEqual([]);
    expect(rows).toHaveLength(COMMANDS.length);
    expect(rows).toContainEqual({ term: 'help, h', detail: 'List the commands.' });
  });

  test.each(['cls', 'CLEAR'])('%s only scrolls, so history and the conversation stay', (line) => {
    expect(route(line, { type: 'command' }, state)).toEqual([
      echo(line, promptFor(null)),
      scrollClear(),
    ]);
  });

  test('reset wipes the output and the session, then replays the startup for a visitor with no name', () => {
    const named = { ...state, name: 'connor' };

    expect(run('reset', { name: 'connor' })).toEqual([
      clearHistory(),
      resetSession(),
      ...startupEffects({ ...named, name: null }),
    ]);
  });

  test('history numbers the typed commands, oldest first', () => {
    expect(run('history', { commandHistory: ['help', 'whoami'] })).toEqual([
      printList([
        { term: '1', detail: 'help' },
        { term: '2', detail: 'whoami' },
      ]),
    ]);
  });

  test('whoami lists the name and session, then the client info only when it loaded, each term with a colon', () => {
    expect(run('whoami')).toEqual([
      printList([
        { term: 'name:', detail: 'unknown' },
        { term: 'session:', detail: 'session-1' },
      ]),
    ]);
    expect(
      run('whoami', { name: 'connor', clientInfo: [{ label: 'ip', value: '127.0.0.1' }] }),
    ).toEqual([
      printList([
        { term: 'name:', detail: 'connor' },
        { term: 'session:', detail: 'session-1' },
        { term: 'ip:', detail: '127.0.0.1' },
      ]),
    ]);
  });
});
