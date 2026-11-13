import { QUESTION_IDS } from '../constants';
import type { Question } from '../types';
import { chat, printText } from '../utils';

export const retryChat: Question = {
  id: QUESTION_IDS.RETRY_CHAT,
  text: 'Retry? (Y/N)',
  label: 'Retry? Press Y to retry or N to cancel.',
  answerKeys: ['y', 'n'],
  onAnswer: (answer, _state, subject) =>
    answer.toLowerCase() === 'y' && subject !== undefined ? [chat(subject)] : [printText('')],
};
