import { GITHUB_URL, LINKEDIN_URL, STATIC_PORTFOLIO_URL } from '../../app/constants';
import type { Command } from '../types';
import { print } from '../utils';

export const contact: Command = {
  names: ['contact'],
  description: "Show Connor's links.",
  run: () => [
    print({ type: 'link', text: 'GitHub: ', label: GITHUB_URL, href: GITHUB_URL }),
    print({ type: 'link', text: 'LinkedIn: ', label: LINKEDIN_URL, href: LINKEDIN_URL }),
    print({
      type: 'link',
      text: 'Portfolio: ',
      label: STATIC_PORTFOLIO_URL,
      href: STATIC_PORTFOLIO_URL,
    }),
  ],
};
