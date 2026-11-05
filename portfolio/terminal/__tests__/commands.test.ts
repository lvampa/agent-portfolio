import { COMMANDS, findCommand } from '../registry';
import { route } from '../router';
import type { TerminalState } from '../types';
import { clearScreen, echo, printText, promptFor } from '../utils';

const state: TerminalState = { name: null, clientInfo: null, commands: COMMANDS };

function run(name: string, overrides: Partial<TerminalState> = {}) {
  const command = findCommand(COMMANDS, name);
  if (!command) throw new Error(`No command named ${name}`);
  return command.run({ ...state, ...overrides });
}

describe('commands', () => {
  test('help lists every registered command with all its names', () => {
    const lines = run('help');

    expect(lines).toHaveLength(COMMANDS.length);
    expect(lines).toContainEqual(printText('help, h - List the commands.'));
    COMMANDS.forEach((command) => {
      expect(lines).toContainEqual(
        printText(`${command.names.join(', ')} - ${command.description}`),
      );
    });
  });

  test.each(['cls', 'CLEAR'])('%s clears the screen and the saved history', (line) => {
    expect(route(line, { type: 'command' }, state)).toEqual([
      echo(line, promptFor(null)),
      clearScreen(),
    ]);
  });

  test('whoami prints the name, then the client info only when it loaded', () => {
    expect(run('whoami')).toEqual([printText('name: unknown')]);
    expect(
      run('whoami', { name: 'connor', clientInfo: [{ label: 'ip', value: '127.0.0.1' }] }),
    ).toEqual([printText('name: connor'), printText('ip: 127.0.0.1')]);
  });
});
