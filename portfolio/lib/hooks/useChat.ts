'use client';

import { chatClient } from '@lib/api';
import { ChatResponseSchema } from '@lib/hooks/schemas';
import { useCallback, useState } from 'react';

import type { ChatRequest, UseChat } from './types';

export default function useChat(): UseChat {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (request: ChatRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const body = await chatClient.post('webhooks', request);
      const parsed = ChatResponseSchema.safeParse(body);
      if (!parsed.success) {
        setError(new Error('ChatResponse parse failed'));
        return undefined;
      }
      return parsed.data;
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}
