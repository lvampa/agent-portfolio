import { Storage } from '@lib/storage';

import { SessionSchema } from '../schemas';

describe('SessionSchema', () => {
  test('a session stored before ids existed loads with a new id and keeps its name', () => {
    localStorage.setItem(
      'session-test',
      JSON.stringify({ name: 'connor', mode: { type: 'command' } }),
    );

    const session = new Storage('session-test').loadValue(SessionSchema);

    expect(session?.name).toBe('connor');
    expect(session?.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
