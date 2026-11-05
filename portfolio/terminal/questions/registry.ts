import type { Question, QuestionId } from '../types';
import { identify } from './identify';

// Keyed by id so a pending question can be persisted as its id and looked up after a reload.
export const QUESTIONS: Record<QuestionId, Question> = {
  identify,
};
