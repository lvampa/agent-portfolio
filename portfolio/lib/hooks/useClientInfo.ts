'use client';

import { infoClient } from '@lib/api';
import { getParsedUA } from '@lib/utils/clientInfo';
import { useEffect, useMemo, useState } from 'react';

import type { ClientInfoRequest, UseClientInfo } from './types';

export function useClientInfo(): UseClientInfo {
  const [request, setRequest] = useState<ClientInfoRequest | null>(null);
  const [parsedUA, setParsedUA] = useState<ReturnType<typeof getParsedUA>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchClientInfo() {
      try {
        const response = await infoClient.get<ClientInfoRequest>('');
        setRequest(response.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    void fetchClientInfo();
  }, []);

  useEffect(() => {
    setParsedUA(getParsedUA());
  }, []);

  const userInfo = useMemo(() => ({ request, parsedUA }), [request, parsedUA]);

  return { userInfo, isLoading, error };
}
