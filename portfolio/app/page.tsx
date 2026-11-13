'use client';

import { Terminal } from '@components/ui/shadcn-io/terminal';
import { useClientInfo } from '@lib/hooks/useClientInfo';
import { buildChatVisitor, buildUserInfoForUi } from '@lib/utils/clientInfo';
import Repl from '@terminal/repl/Repl';
import { useMemo } from 'react';
import { useStickToBottom } from 'use-stick-to-bottom';

export default function Home() {
  const { userInfo, isLoading } = useClientInfo();

  // A failed info request skips the client info step, as before, even though the UA parsed.
  const clientInfo = useMemo(
    () => (userInfo.request ? buildUserInfoForUi(userInfo) : null),
    [userInfo],
  );

  const visitor = useMemo(() => buildChatVisitor(userInfo), [userInfo]);

  // Instant, like a real terminal; the default spring animation would lag behind streamed text.
  const { scrollRef, contentRef } = useStickToBottom({ initial: 'instant', resize: 'instant' });

  return (
    // main is the only scroller, so its scrollbar sits at the window edge as the page's did.
    <main ref={scrollRef} className="h-dvh w-full overflow-auto">
      <div ref={contentRef} className="flex justify-center">
        <Terminal>
          <Repl clientInfo={clientInfo} isClientInfoLoading={isLoading} visitor={visitor} />
        </Terminal>
      </div>
    </main>
  );
}
