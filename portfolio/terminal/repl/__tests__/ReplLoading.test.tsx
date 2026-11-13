import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import ReplLoading from '../ReplLoading';

describe('ReplLoading', () => {
  test('keeps an empty status region mounted when hidden', () => {
    render(<ReplLoading isVisible={false} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
