'use client';

import { infoClient } from '@lib/api';
import { ClientInfoRequestSchema } from '@lib/hooks/schemas';
import { getParsedUA, getReferrer } from '@lib/utils/clientInfo';
import type { ParsedUA } from '@lib/utils/types';
import { useEffect, useMemo, useState } from 'react';

import type { ClientInfoRequest, UseClientInfo } from './types';

export function useClientInfo(): UseClientInfo {
  const [request, setRequest] = useState<ClientInfoRequest | null>(null);
  const [parsedUA, setParsedUA] = useState<ParsedUA | null>(null);
  // document.referrer never changes during a visit, so it is read once, on the client's first render.
  const [referrer] = useState(getReferrer);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchClientInfo() {
      const body = await infoClient.get('');
      const parsed = ClientInfoRequestSchema.safeParse(body);
      if (parsed.success) {
        setRequest(parsed.data);
      } else {
        setError(new Error('ClientInfoRequest parse failed'));
      }
    }

    // Loading covers the lazy UA parse too, because the startup shows client info only when both are in.
    Promise.all([getParsedUA().then(setParsedUA), fetchClientInfo()])
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setIsLoading(false));
  }, []);

  const userInfo = useMemo(() => ({ request, parsedUA, referrer }), [request, parsedUA, referrer]);

  return { userInfo, isLoading, error };
}
