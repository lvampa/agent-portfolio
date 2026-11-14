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

  useEffect(() => {
    async function fetchClientInfo() {
      const body = await infoClient.get('');
      const parsed = ClientInfoRequestSchema.safeParse(body);
      if (parsed.success) setRequest(parsed.data);
    }

    // Loading ends only once both have settled, so a failed /info cannot end it before the lazy UA parse,
    // which the chat payload needs even without the info request.
    void Promise.allSettled([getParsedUA().then(setParsedUA), fetchClientInfo()]).then(() =>
      setIsLoading(false),
    );
  }, []);

  const userInfo = useMemo(() => ({ request, parsedUA, referrer }), [request, parsedUA, referrer]);

  return { userInfo, isLoading };
}
