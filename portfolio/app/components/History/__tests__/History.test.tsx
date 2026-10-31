import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import { History } from '../History';

jest.mock('@app/contexts/HistoryContext', () => ({
  useHistory: () => ({
    items: [
      { value: 'hello', type: 'command' },
      { value: 'hi there', type: 'message' },
      { value: 'Something went wrong.', type: 'error' },
    ],
  }),
}));

describe('History', () => {
  test('renders items inside a log region', () => {
    render(<History />);

    const log = screen.getByRole('log');
    expect(log).toHaveTextContent('hello');
    expect(log).toHaveTextContent('hi there');
    expect(log).toHaveTextContent('Something went wrong.');
  });
});
