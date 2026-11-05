import { createRegistry } from '../registry';
import type { Command } from '../types';

function command(...names: string[]): Command {
  return { names, description: '', run: () => [] };
}

describe('createRegistry', () => {
  test('throws when an alias appears twice, ignoring case', () => {
    expect(() => createRegistry([command('help', 'h'), command('history', 'H')])).toThrow(
      'Duplicate command name: h',
    );
  });
});
