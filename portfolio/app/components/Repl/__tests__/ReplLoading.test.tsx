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

  test('renders nothing when hidden', () => {
    render(<ReplLoading isVisible={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
