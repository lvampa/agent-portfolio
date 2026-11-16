import { EXAMPLE_QUESTIONS } from '../../app/constants';
import { QUESTION_IDS } from '../constants';
import type { Command } from '../types';
import { ask, printText } from '../utils';

export const examples: Command = {
  names: ['examples'],
  description: 'Show example questions and ask one.',
  run: () => [
    ...EXAMPLE_QUESTIONS.map((question, index) => printText(`${index + 1}. ${question}`)),
    ask(QUESTION_IDS.ASK_EXAMPLE),
  ],
};
