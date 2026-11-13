import '@testing-library/jest-dom';

import { PORTFOLIO_LINK } from '@terminal/constants';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { LinkLine } from '../renderers/LinkLine';

describe('LinkLine', () => {
  test('the banner links the portfolio URL in a new tab', () => {
    render(<LinkLine item={PORTFOLIO_LINK} />);

    const link = screen.getByRole('link', { name: 'https://connorabdelnoor.github.io' });
    expect(link).toHaveAttribute('href', 'https://connorabdelnoor.github.io');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Traditional portfolio @:', { exact: false })).toContainElement(link);
  });
});
