import {
  ChatResponseItemSchema,
  ChatResponseSchema,
  ClientInfoRequestSchema,
} from '@lib/hooks/schemas';

describe('ClientInfoRequestSchema', () => {
  const validRequest = {
    ip: '1.2.3.4',
    country: 'US',
    city: 'New York',
    latitude: '40.7',
    longitude: '-74.0',
    asn: 'AS12345',
    organization: 'Acme ISP',
    timezone: 'America/New_York',
    deviceType: 'desktop',
    userAgent: 'Mozilla/5.0',
    acceptLanguage: 'en-US',
    acceptEncoding: 'gzip',
    referer: '',
    tlsVersion: 'TLSv1.3',
    tlsCipher: 'TLS_AES_256_GCM_SHA384',
    timestamp: '2026-06-12T00:00:00Z',
  };

  test('accepts a valid client info request', () => {
    expect(ClientInfoRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  test('accepts null for nullable fields', () => {
    expect(
      ClientInfoRequestSchema.safeParse({
        ...validRequest,
        ip: null,
        country: null,
        userAgent: null,
      }).success,
    ).toBe(true);
  });

  test('accepts numeric latitude/longitude', () => {
    expect(
      ClientInfoRequestSchema.safeParse({ ...validRequest, latitude: 40.7, longitude: -74.0 })
        .success,
    ).toBe(true);
  });

  test('rejects missing required field', () => {
    const { city: _city, ...withoutCity } = validRequest;
    expect(ClientInfoRequestSchema.safeParse(withoutCity).success).toBe(false);
  });
});

describe('ChatResponseSchema', () => {
  test('accepts valid chat response array', () => {
    expect(ChatResponseSchema.safeParse([{ output: 'Hello!' }]).success).toBe(true);
  });

  test('accepts empty array', () => {
    expect(ChatResponseSchema.safeParse([]).success).toBe(true);
  });

  test('rejects item without output field', () => {
    expect(ChatResponseSchema.safeParse([{ text: 'Hello' }]).success).toBe(false);
  });

  test('rejects non-array', () => {
    expect(ChatResponseSchema.safeParse({ output: 'Hello' }).success).toBe(false);
  });
});

describe('ChatResponseItemSchema', () => {
  test('accepts item with output string', () => {
    expect(ChatResponseItemSchema.safeParse({ output: 'response text' }).success).toBe(true);
  });

  test('rejects non-string output', () => {
    expect(ChatResponseItemSchema.safeParse({ output: 42 }).success).toBe(false);
  });
});
