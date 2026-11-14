import { QUESTIONS } from './questions';
import { findCommand } from './registry';
import type { Route } from './types';
import { chat } from './utils';

const answerPendingQuestion: Route = {
  name: 'answerPendingQuestion',
  handle: (line, mode, state) => {
    if (mode.type !== 'awaiting') return null;
    return [...QUESTIONS[mode.questionId].onAnswer(line, state, mode.subject), ...mode.then];
  },
};

const ignoreBlankLine: Route = {
  name: 'ignoreBlankLine',
  handle: (line) => (line.trim() ? null : []),
};

// Only the whole line counts, so a sentence that starts with a command word goes to the chat.
const runExactCommand: Route = {
  name: 'runExactCommand',
  handle: (line, _mode, state) => findCommand(state.commands, line.trim())?.run(state) ?? null,
};

export const sendToChat: Route = {
  name: 'sendToChat',
  handle: (line) => [chat(line)],
};

/** Tried in order. sendToChat always claims the line, so it must stay last. */
export const ROUTES: readonly Route[] = [
  answerPendingQuestion,
  ignoreBlankLine,
  runExactCommand,
  sendToChat,
];
