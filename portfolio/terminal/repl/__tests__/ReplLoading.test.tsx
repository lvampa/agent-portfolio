import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import ReplLoading from '../ReplLoading';

describe('ReplLoading', () => {
  test('announces itself as a status with the full text before typing ends', () => {
    render(<ReplLoading isVisible={true} />);

    expect(screen.getByRole('status')).toHaveTextContent('... Loading');
    expect(screen.getByText('... Loading')).toHaveClass('sr-only');
  });

  test('keeps an empty status region mounted when hidden', () => {
    render(<ReplLoading isVisible={false} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
