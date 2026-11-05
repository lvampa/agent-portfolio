'use client';

import { AnimationProvider } from '@app/contexts/AnimationContext';
import { useClientInfo } from '@lib/hooks/useClientInfo';
import { buildUserInfoForUi } from '@lib/utils/clientInfo';
import { useMemo } from 'react';

import { Terminal } from '@/components/ui/shadcn-io/terminal';

import Repl from './components/Repl/Repl';

export default function Home() {
  const { userInfo, isLoading } = useClientInfo();

  // A failed info request skips the client info step, as before, even though the UA parsed.
  const clientInfo = useMemo(
    () => (userInfo.request ? buildUserInfoForUi(userInfo) : null),
    [userInfo],
  );

  return (
    <main className="flex h-screen w-full justify-center">
      <Terminal>
        <AnimationProvider>
          <Repl clientInfo={clientInfo} isClientInfoLoading={isLoading} />
        </AnimationProvider>
      </Terminal>
    </main>
  );
}
