import { QUESTIONS } from './questions';
import { findCommand } from './registry';
import type { Effect, Mode, TerminalState } from './types';
import { chat, echo, promptFor, splitLine } from './utils';

/** The prompt the input shows, which is also the prompt the typed line is echoed with. */
export function currentPrompt(mode: Mode, name: string | null): string {
  return mode.type === 'awaiting' ? QUESTIONS[mode.questionId].text : promptFor(name);
}

/** Returns every effect of a submitted line, starting with its echo. Chat is the fallback. */
export function route(line: string, mode: Mode, state: TerminalState): Effect[] {
  const lineEcho = echo(line, currentPrompt(mode, state.name));

  if (mode.type === 'awaiting') {
    const question = QUESTIONS[mode.questionId];
    return [lineEcho, ...question.onAnswer(line, state), ...mode.then];
  }

  if (!line.trim()) return [lineEcho];

  const { commandName, args } = splitLine(line);
  const command = findCommand(state.commands, commandName);
  if (command) return [lineEcho, ...command.run(args, state)];

  return [lineEcho, chat(line)];
}
