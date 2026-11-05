import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import ReplLoading from '../ReplLoading';

describe('ReplLoading', () => {
  test('announces itself as a status with the full text available', () => {
    render(<ReplLoading isVisible={true} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('... Loading');
    expect(screen.getByText('... Loading')).toHaveClass('sr-only');
  });

  test('keeps the same DOM node across re-renders', () => {
    const { rerender } = render(<ReplLoading isVisible={true} />);
    const before = screen.getByText('... Loading');

    rerender(<ReplLoading isVisible={true} />);

    expect(screen.getByText('... Loading').parentElement).toBe(before.parentElement);
  });
});
