'use client'

import {
  Terminal,
  TypingAnimation,
  AnimatedSpan,
} from '@/components/ui/shadcn-io/terminal';

import Repl from "@/app/components/Repl/Repl"
import { useInitStorage } from '@app/hooks/useInitStorage';

export default function Home() {
  useInitStorage();

  return (
    <main className="bg-background flex justify-center w-full h-screen">
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

        <Repl />
      </Terminal>
    </main>
  );
}
