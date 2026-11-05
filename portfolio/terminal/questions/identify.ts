import { QUESTION_IDS, UNCONFIRMED_IDENTITY_LINE } from '../constants';
import type { Question } from '../types';
import { printText, sanitizeName, setName } from '../utils';

export const identify: Question = {
  id: QUESTION_IDS.IDENTIFY,
  text: 'User unknown, please identify:',
  onAnswer: (answer) => {
    const name = sanitizeName(answer);
    return name
      ? [setName(name), printText(`Confirmed identity: ${name}`)]
      : [printText(UNCONFIRMED_IDENTITY_LINE)];
  },
};
