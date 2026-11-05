import { TypingAnimation } from '@components/ui/shadcn-io/terminal';

export default function ReplLoading({ isVisible }: { isVisible: boolean }) {
  // The status region stays mounted so screen readers announce when the text appears.
  return <div role="status">{isVisible && <TypingAnimation>... Loading</TypingAnimation>}</div>;
}
