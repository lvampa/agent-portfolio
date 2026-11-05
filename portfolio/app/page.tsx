'use client';

import { HISTORY_ITEM_TYPES } from '@app/components/History';
import { AnimationProvider } from '@app/contexts/AnimationContext';
import { useHistory } from '@app/contexts/HistoryContext';
import { useClientInfo } from '@lib/hooks/useClientInfo';
import { buildUserInfoForUi } from '@lib/utils/clientInfo';
import { useLayoutEffect, useRef } from 'react';

import { Terminal } from '@/components/ui/shadcn-io/terminal';

import Repl from './components/Repl/Repl';

export default function Home() {
  const { append, items, hasLoaded } = useHistory();
  const { userInfo, isLoading } = useClientInfo();

  const hasSeededUserInfo = useRef(false);

  // Seeding before paint keeps the prompt from showing for a frame before the sequence mounts.
  useLayoutEffect(() => {
    if (hasSeededUserInfo.current) return;
    if (!hasLoaded || isLoading) return;
    if (items.length > 0) return;
    if (!userInfo.request || !userInfo.parsedUA) return;

    const userInfoItems = buildUserInfoForUi(userInfo);
    if (userInfoItems) {
      hasSeededUserInfo.current = true;
      append({ type: HISTORY_ITEM_TYPES.USER, value: JSON.stringify(userInfoItems) });
    }
  }, [append, hasLoaded, isLoading, items.length, userInfo]);

  return (
    <main className="flex h-screen w-full justify-center">
      <Terminal>
        <AnimationProvider>
          <Repl isReady={hasLoaded && !isLoading} />
        </AnimationProvider>
      </Terminal>
    </main>
  );
}
