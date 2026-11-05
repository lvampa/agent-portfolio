'use client';

import { Terminal } from '@components/ui/shadcn-io/terminal';
import { useClientInfo } from '@lib/hooks/useClientInfo';
import { buildUserInfoForUi } from '@lib/utils/clientInfo';
import { AnimationProvider } from '@terminal/AnimationContext';
import { HISTORY_ITEM_TYPES } from '@terminal/history';
import { useHistory } from '@terminal/history/HistoryContext';
import Repl from '@terminal/repl/Repl';
import { useEffect } from 'react';

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
    <main className="flex h-screen w-full justify-center">
      <Terminal>
        <AnimationProvider>
          <Repl />
        </AnimationProvider>
      </Terminal>
    </main>
  );
}
