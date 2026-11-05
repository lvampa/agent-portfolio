import { ROUTES, sendToChat } from '../routes';

describe('ROUTES', () => {
  test('sendToChat is last, since it claims every line', () => {
    expect(ROUTES.at(-1)).toBe(sendToChat);
  });
});
