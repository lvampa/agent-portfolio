import { QUESTION_IDS, STAYING_UNKNOWN_LINE } from '../constants';
import type { Question } from '../types';
import { printLine, sanitizeName, setName } from '../utils';

export const identify: Question = {
  id: QUESTION_IDS.IDENTIFY,
  text: 'Please Identify:',
  onAnswer: (answer) => {
    const name = sanitizeName(answer);
    return name ? [setName(name)] : [printLine(STAYING_UNKNOWN_LINE)];
  },
};
