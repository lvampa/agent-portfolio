import '@testing-library/jest-dom';

import { AnimationProvider, useAnimation } from '@terminal/AnimationContext';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { ClientInfo } from '../renderers/ClientInfo';

beforeEach(() => {
  jest.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }) as unknown as MediaQueryList,
  );
});

function AnimatingProbe() {
  const { isAnimating } = useAnimation();
  return <p>{isAnimating ? 'animating' : 'idle'}</p>;
}

describe('ClientInfo', () => {
  test('under reduced motion, a new sequence shows in full at once and nothing waits on it', () => {
    render(
      <AnimationProvider>
        <ClientInfo
          item={{
            type: 'clientInfo',
            info: [{ label: 'ip', value: '127.0.0.1' }],
            prompt: 'C:\\Users\\unknown>',
          }}
          isRestored={false}
        />
        <AnimatingProbe />
      </AnimationProvider>,
    );

    // A typing line starts with only its screen-reader copy filled in, which carries sr-only.
    expect(screen.getAllByText('127.0.0.1').some((el) => !el.classList.contains('sr-only'))).toBe(
      true,
    );
    expect(screen.getByText('ip:')).not.toHaveClass('opacity-0');
    expect(screen.getByText('idle')).toBeInTheDocument();
  });
});
