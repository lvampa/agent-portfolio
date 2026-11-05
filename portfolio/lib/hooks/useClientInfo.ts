'use client';

import { infoClient } from '@lib/api';
import { ClientInfoRequestSchema } from '@lib/hooks/schemas';
import { getParsedUA, getReferrer } from '@lib/utils/clientInfo';
import { useEffect, useMemo, useState } from 'react';

import type { ClientInfoRequest, UseClientInfo } from './types';

export function useClientInfo(): UseClientInfo {
  const [request, setRequest] = useState<ClientInfoRequest | null>(null);
  const [parsedUA, setParsedUA] = useState<ReturnType<typeof getParsedUA>>(null);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setParsedUA(getParsedUA());
    setReferrer(getReferrer());

    async function fetchClientInfo() {
      try {
        const response = await infoClient.get('');
        const parsed = ClientInfoRequestSchema.safeParse(response.data);
        if (parsed.success) {
          setRequest(parsed.data);
        } else {
          setError(new Error('ClientInfoRequest parse failed'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    void fetchClientInfo();
  }, []);

  const userInfo = useMemo(() => ({ request, parsedUA, referrer }), [request, parsedUA, referrer]);

  return { userInfo, isLoading, error };
}
