'use client';

import { useCallback, useState } from 'react';

import { chatClient } from '@lib/api';
import type { UseChat } from './types';

export default function useChat(): UseChat {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown>(null);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatClient.post('webhooks', { chatInput: message });
      setData(response.data);
      return response.data;
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error, data };
}
