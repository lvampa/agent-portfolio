import type { Command } from './types';

/** Lowercases every name and throws on a duplicate, so a clash fails at module load. */
export function createRegistry(commands: readonly Command[]): readonly Command[] {
  const seen = new Set<string>();
  return commands.map((command) => {
    const names = command.names.map((name) => name.toLowerCase());
    names.forEach((name) => {
      if (seen.has(name)) throw new Error(`Duplicate command name: ${name}`);
      seen.add(name);
    });
    return { ...command, names };
  });
}

export function findCommand(commands: readonly Command[], name: string): Command | undefined {
  const lowerName = name.toLowerCase();
  return commands.find((command) => command.names.includes(lowerName));
}

export const COMMANDS = createRegistry([]);
