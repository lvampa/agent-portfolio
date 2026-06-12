import { ParsedUASchema, UserInfoItemSchema, UserInfoSchema } from '@lib/utils/schemas';

describe('ParsedUASchema', () => {
  test('accepts full parsed UA object', () => {
    const input = {
      ua: 'Mozilla/5.0',
      browser: { name: 'Chrome', version: '120.0' },
      os: { name: 'macOS', version: '14' },
      device: { type: 'desktop' },
      engine: { name: 'Blink' },
      cpu: { architecture: 'amd64' },
    };
    expect(ParsedUASchema.safeParse(input).success).toBe(true);
  });

  test('accepts UA with all optional sub-fields missing', () => {
    const input = {
      ua: '',
      browser: {},
      os: {},
      device: {},
      engine: {},
      cpu: {},
    };
    expect(ParsedUASchema.safeParse(input).success).toBe(true);
  });

  test('rejects non-string ua field', () => {
    expect(ParsedUASchema.safeParse({ ua: 123, browser: {}, os: {}, device: {}, engine: {}, cpu: {} }).success).toBe(false);
  });
});

describe('UserInfoItemSchema', () => {
  test('accepts valid label/value pair', () => {
    expect(UserInfoItemSchema.safeParse({ label: 'ip', value: '1.2.3.4' }).success).toBe(true);
  });

  test('rejects missing label', () => {
    expect(UserInfoItemSchema.safeParse({ value: '1.2.3.4' }).success).toBe(false);
  });
});

describe('UserInfoSchema', () => {
  test('accepts array of info items', () => {
    const input = [
      { label: 'ip', value: '1.2.3.4' },
      { label: 'browser', value: 'Chrome 120' },
    ];
    expect(UserInfoSchema.safeParse(input).success).toBe(true);
  });

  test('rejects non-array', () => {
    expect(UserInfoSchema.safeParse({ label: 'ip', value: '1.2.3.4' }).success).toBe(false);
  });
});
