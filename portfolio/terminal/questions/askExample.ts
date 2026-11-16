import { EXAMPLE_QUESTIONS } from '../../app/constants';
import { QUESTION_IDS } from '../constants';
import type { Question } from '../types';
import { chat, echo, printText, promptFor } from '../utils';

const SKIP_KEY = 'n';
const lastNumber = EXAMPLE_QUESTIONS.length;

export const askExample: Question = {
  id: QUESTION_IDS.ASK_EXAMPLE,
  text: `Ask which? (1-${lastNumber}, N to skip)`,
  label: `Ask which? Press 1 to ${lastNumber} to ask that question, or N to skip.`,
  answerKeys: [...EXAMPLE_QUESTIONS.map((_, index) => String(index + 1)), SKIP_KEY],
  // The chosen question is echoed at the normal prompt, so the reply has its question above it and Up can recall it.
  onAnswer: (answer, state) => {
    const question = EXAMPLE_QUESTIONS[Number(answer) - 1];
    return question ? [echo(question, promptFor(state.name)), chat(question)] : [printText('')];
  },
};
