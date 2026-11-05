'use client';

import { Terminal } from '@components/ui/shadcn-io/terminal';
import { useClientInfo } from '@lib/hooks/useClientInfo';
import { buildUserInfoForUi } from '@lib/utils/clientInfo';
import { AnimationProvider } from '@terminal/AnimationContext';
import Repl from '@terminal/repl/Repl';
import { useMemo } from 'react';

export default function Home() {
  const { userInfo, isLoading } = useClientInfo();

  // A failed info request skips the client info step, as before, even though the UA parsed.
  const clientInfo = useMemo(
    () => (userInfo.request ? buildUserInfoForUi(userInfo) : null),
    [userInfo],
  );

  // Only what the agent may use to tailor its answers. The IP stays out of the chat.
  const visitor = useMemo(
    () => ({
      organization: userInfo.request?.organization ?? null,
      country: userInfo.request?.country ?? null,
    }),
    [userInfo.request],
  );

  return (
    <main className="flex h-screen w-full justify-center">
      <Terminal>
        <AnimationProvider>
          <Repl clientInfo={clientInfo} isClientInfoLoading={isLoading} visitor={visitor} />
        </AnimationProvider>
      </Terminal>
    </main>
  );
}
