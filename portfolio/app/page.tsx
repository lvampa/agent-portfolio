'use client';

import { Terminal } from '@components/ui/shadcn-io/terminal';
import { useClientInfo } from '@lib/hooks/useClientInfo';
import { buildChatVisitor, buildUserInfoForUi } from '@lib/utils/clientInfo';
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

  const visitor = useMemo(() => buildChatVisitor(userInfo), [userInfo]);

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
