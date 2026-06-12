'use client';

import { HISTORY_ITEM_TYPES } from '@app/components/History';
import { AnimationProvider } from '@app/contexts/AnimationContext';
import { useHistory } from '@app/contexts/HistoryContext';
import { useClientInfo } from '@lib/hooks/useClientInfo';
import { buildUserInfoForUi } from '@lib/utils/clientInfo';
import { useEffect } from 'react';

import { Terminal } from '@/components/ui/shadcn-io/terminal';

import Repl from './components/Repl/Repl';

export default function Home() {
  const { append, items, hasLoaded } = useHistory();
  const { userInfo, isLoading } = useClientInfo();

  useEffect(() => {
    if (!hasLoaded || isLoading) return;
    if (items.length > 0) return;
    if (!userInfo.request || !userInfo.parsedUA) return;

    const userInfoItems = buildUserInfoForUi(userInfo);
    if (userInfoItems) {
      append({ type: HISTORY_ITEM_TYPES.USER, value: JSON.stringify(userInfoItems) });
    }
  }, [hasLoaded, isLoading, userInfo]);

  return (
    <main className="flex justify-center w-full h-screen">
      <Terminal>
        <AnimationProvider>
          <Repl />
        </AnimationProvider>
      </Terminal>
    </main>
  );
}
