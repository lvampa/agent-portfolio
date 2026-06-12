'use client';

import { chatClient } from '@lib/api';
import { ChatResponseSchema } from '@lib/hooks/schemas';
import { useCallback, useState } from 'react';

import type { UseChat } from './types';

export default function useChat(): UseChat {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatClient.post('webhooks', { chatInput: message });
      const parsed = ChatResponseSchema.safeParse(response.data);
      if (!parsed.success) {
        console.warn('ChatResponse parse failed', parsed.error);
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
