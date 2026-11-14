import { chatClient } from '@lib/api';
import { ChatResponseSchema } from '@lib/hooks/schemas';

import type { ChatRequest, ChatResult } from './types';
import { toChatFailure } from './utils';

/** Never rejects. A failed or invalid reply resolves to the kind of failure. */
export async function sendChat(request: ChatRequest): Promise<ChatResult> {
  try {
    const body = await chatClient.post('webhooks', request);
    const parsed = ChatResponseSchema.safeParse(body);
    return parsed.success ? { ok: true, replies: parsed.data } : { ok: false, failure: 'server' };
  } catch (caught) {
    return { ok: false, failure: toChatFailure(caught) };
  }
}
