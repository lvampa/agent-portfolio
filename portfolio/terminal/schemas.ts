import { randomUuid } from '@lib/utils/uuid';
import { z } from 'zod';

import { QUESTION_IDS } from './constants';
import { HistoryItemSchema } from './history/schemas';

export const QuestionIdSchema = z.enum(QUESTION_IDS);

// Effects have a schema because a pending question stores them in the session.
export const EffectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('print'), item: HistoryItemSchema }),
  z.object({ type: z.literal('clear') }),
  z.object({ type: z.literal('newConversation') }),
  z.object({ type: z.literal('setName'), name: z.string() }),
  z.object({ type: z.literal('ask'), questionId: QuestionIdSchema }),
  z.object({ type: z.literal('chat'), message: z.string() }),
]);

export const ModeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('command') }),
  z.object({
    type: z.literal('awaiting'),
    questionId: QuestionIdSchema,
    then: z.array(EffectSchema),
  }),
]);

export const SessionSchema = z.object({
  name: z.string().nullable(),
  // An unknown question id or a stale effect drops back to command mode but keeps the name.
  mode: ModeSchema.catch({ type: 'command' }),
  // A session stored before ids existed gets one on load, so session.v1 needs no new key.
  sessionId: z.uuid().catch(() => randomUuid()),
});
