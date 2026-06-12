'use client'

import { EVENTS } from "@app/constants/events";
import { AnimationProvider } from "@app/contexts/AnimationContext";
import { useEventBus } from "@app/contexts/EventBusContext";
import { useInitStorage } from '@app/hooks/useInitStorage';
import { useClientInfo } from "@lib/hooks/useClientInfo";
import { useEffect } from "react";

import Repl from "@/app/components/Repl/Repl"
import { Terminal } from '@/components/ui/shadcn-io/terminal';

export default function Home() {
  const eventBus = useEventBus();
  useInitStorage();

  const { userInfo, isLoading } = useClientInfo();

  useEffect(() => {
    if (!isLoading && userInfo.request && userInfo.parsedUA) {
      eventBus.emit(EVENTS.PAGE_LOAD, userInfo)
    }
  }, [isLoading, userInfo]);

  return (
    <main className="flex justify-center w-full h-screen">
      <Terminal>
        {/*<AnimatedSpan delay={0}>C: \ { ">" } npm install shadcn-ui</AnimatedSpan>*/}
        {/*<TypingAnimation delay={1000} duration={100}>*/}
        {/*  Installing dependencies...*/}
        {/*</TypingAnimation>*/}
        {/*<AnimatedSpan delay={3000}>✓ Package installed successfully</AnimatedSpan>*/}
        {/*<AnimatedSpan delay={3500}>$ npm run dev</AnimatedSpan>*/}
        {/*<TypingAnimation delay={4500} duration={80}>*/}
        {/*  Starting development server...*/}
        {/*</TypingAnimation>*/}
        {/*<AnimatedSpan delay={6500}>🚀 Server ready at http://localhost:3000</AnimatedSpan>*/}

        <AnimationProvider>
          <Repl />
        </AnimationProvider>
      </Terminal>
    </main>
  );
}
