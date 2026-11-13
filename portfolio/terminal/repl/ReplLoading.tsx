import { usePrefersReducedMotion } from '@lib/hooks/usePrefersReducedMotion';
import { useEffect, useState } from 'react';

import { SPINNER_FRAME_MS, SPINNER_FRAMES, WAITING_LABEL } from './constants';

// Mounted only while visible, so each wait starts from the first frame.
function Spinner() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(
      () => setFrame((current) => (current + 1) % SPINNER_FRAMES.length),
      SPINNER_FRAME_MS,
    );
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return <p>{WAITING_LABEL}</p>;

  return (
    <p>
      <span className="sr-only">{WAITING_LABEL}</span>
      <span aria-hidden>{SPINNER_FRAMES[frame]}</span>
    </p>
  );
}

export default function ReplLoading({ isVisible }: { isVisible: boolean }) {
  // The status region stays mounted so screen readers announce when the label appears.
  return <div role="status">{isVisible && <Spinner />}</div>;
}
