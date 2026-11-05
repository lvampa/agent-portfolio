import { COMMANDS, findCommand } from '../registry';
import { route } from '../router';
import type { TerminalState } from '../types';
import { clearScreen, echo, printList, promptFor } from '../utils';

const state: TerminalState = { name: null, clientInfo: null, commands: COMMANDS };

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

  test.each(['cls', 'CLEAR'])('%s clears the screen and the saved history', (line) => {
    expect(route(line, { type: 'command' }, state)).toEqual([
      echo(line, promptFor(null)),
      clearScreen(),
    ]);
  });

  test('whoami lists the name, then the client info only when it loaded, each term with a colon', () => {
    expect(run('whoami')).toEqual([printList([{ term: 'name:', detail: 'unknown' }])]);
    expect(
      run('whoami', { name: 'connor', clientInfo: [{ label: 'ip', value: '127.0.0.1' }] }),
    ).toEqual([
      printList([
        { term: 'name:', detail: 'connor' },
        { term: 'ip:', detail: '127.0.0.1' },
      ]),
    ]);
  });
});
