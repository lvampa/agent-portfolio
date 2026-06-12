import { TypingAnimation } from '@/components/ui/shadcn-io/terminal';

export default function ReplLoading({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return <TypingAnimation>... Loading</TypingAnimation>;
}
