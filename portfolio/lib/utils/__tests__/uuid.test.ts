import { randomUuid } from '../uuid';

const V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('randomUuid', () => {
  test('returns a v4 UUID without crypto.randomUUID, as on plain-http dev', () => {
    // jsdom's crypto has getRandomValues but no randomUUID, like an insecure context.
    expect(typeof crypto.randomUUID).toBe('undefined');

    const ids = [randomUuid(), randomUuid()];

    ids.forEach((id) => expect(id).toMatch(V4_UUID));
    expect(ids[0]).not.toBe(ids[1]);
  });
});
