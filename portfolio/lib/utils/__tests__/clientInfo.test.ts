import type { ClientInfo } from '@lib/hooks/types';

import { buildChatVisitor, buildUserInfoForUi, getParsedUA, getReferrer } from '../clientInfo';

describe('getParsedUA', () => {
  test('returns ParsedUA shape when run in browser (jsdom)', () => {
    const result = getParsedUA();
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      ua: expect.any(String),
      browser: expect.any(Object),
      os: expect.any(Object),
      device: expect.any(Object),
      engine: expect.any(Object),
      cpu: expect.any(Object),
    });
  });
});

describe('buildUserInfoForUi', () => {
  test('returns null when parsedUA is null', () => {
    const userInfo: ClientInfo = { request: null, parsedUA: null, referrer: null };
    expect(buildUserInfoForUi(userInfo)).toBeNull();
  });

  test('returns UI array with expected labels and request/UA data', () => {
    const userInfo: ClientInfo = {
      request: {
        ip: '1.2.3.4',
        country: 'US',
        city: 'Seattle',
        latitude: 47.6,
        longitude: -122.3,
        asn: '',
        organization: '',
        timezone: '',
        userAgent: null,
        acceptLanguage: null,
        acceptEncoding: null,
        // The Worker sees the page itself as the referer, so this must not be shown.
        referer: 'https://connorabdelnoor.com/',
        tlsVersion: '',
        tlsCipher: '',
        timestamp: '',
      },
      parsedUA: {
        ua: 'Mozilla/5.0',
        browser: { name: 'Chrome', version: '120.0' },
        os: { name: 'Mac OS', version: '14' },
        device: { type: 'desktop' },
        engine: {},
        cpu: {},
      },
      referrer: 'https://example.com',
    };
    const result = buildUserInfoForUi(userInfo);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(7);
    const byLabel = Object.fromEntries(result!.map(({ label, value }) => [label, value]));
    expect(byLabel.location).toBe('Seattle, US');
    expect(byLabel.ip).toBe('1.2.3.4');
    expect(byLabel.browser).toBe('Chrome 120.0');
    expect(byLabel.os).toBe('Mac OS 14');
    expect(byLabel.device).toBe('desktop');
    expect(byLabel.botRisk).toBe('low');
    expect(byLabel.referer).toBe('https://example.com');
  });

  test('uses Unknown fallbacks when request and UA fields are empty', () => {
    const userInfo: ClientInfo = {
      request: null,
      parsedUA: {
        ua: '',
        browser: {},
        os: {},
        device: {},
        engine: {},
        cpu: {},
      },
      referrer: null,
    };
    const result = buildUserInfoForUi(userInfo);
    expect(result).not.toBeNull();
    const byLabel = Object.fromEntries(result!.map(({ label, value }) => [label, value]));
    expect(byLabel.location).toBe('Unknown');
    expect(byLabel.ip).toBe('');
    expect(byLabel.browser).toBe('Unknown');
    expect(byLabel.os).toBe('Unknown');
    expect(byLabel.device).toBe('Unknown');
    expect(byLabel.referer).toBe('');
  });

  test('returns botRisk high when UA matches bot pattern', () => {
    const userInfo: ClientInfo = {
      request: null,
      parsedUA: {
        ua: 'Googlebot/2.1',
        browser: { type: 'bot' },
        os: {},
        device: {},
        engine: {},
        cpu: {},
      },
      referrer: null,
    };
    const result = buildUserInfoForUi(userInfo);
    expect(result).not.toBeNull();
    const botRisk = result!.find(({ label }) => label === 'botRisk');
    expect(botRisk?.value).toBe('high');
  });
});

describe('buildChatVisitor', () => {
  const userInfo: ClientInfo = {
    request: {
      ip: '1.2.3.4',
      country: 'US',
      city: 'Seattle',
      latitude: 47.6,
      longitude: -122.3,
      asn: 13335,
      organization: 'Acme ISP',
      timezone: 'America/Los_Angeles',
      userAgent: 'Mozilla/5.0',
      acceptLanguage: 'en-US',
      acceptEncoding: 'gzip',
      referer: 'https://connorabdelnoor.com/',
      tlsVersion: 'TLSv1.3',
      tlsCipher: 'AEAD-AES128-GCM-SHA256',
      timestamp: '2026-11-05T00:00:00.000Z',
    },
    parsedUA: {
      ua: 'Mozilla/5.0',
      browser: { name: 'Chrome', version: '120.0' },
      os: { name: 'Mac OS', version: '14' },
      device: { type: 'desktop' },
      engine: {},
      cpu: {},
    },
    referrer: 'https://www.google.com/',
  };

  test('sends the visitor fields, with document.referrer as the referer, and never the IP or coordinates', () => {
    const visitor = buildChatVisitor(userInfo);

    expect(visitor).toEqual({
      city: 'Seattle',
      country: 'US',
      organization: 'Acme ISP',
      browser: 'Chrome 120.0',
      os: 'Mac OS 14',
      device: 'desktop',
      referer: 'https://www.google.com/',
      botRisk: 'low',
    });
    expect(visitor).not.toHaveProperty('ip');
    expect(visitor).not.toHaveProperty('latitude');
    expect(visitor).not.toHaveProperty('longitude');
    expect(JSON.stringify(visitor)).not.toContain('1.2.3.4');
  });

  test('sends nulls when client info did not load', () => {
    expect(
      Object.values(buildChatVisitor({ request: null, parsedUA: null, referrer: null })),
    ).toEqual(Array(8).fill(null));
  });
});

describe('getReferrer', () => {
  test('reads document.referrer, and an empty one means Direct', () => {
    expect(getReferrer()).toBe('Direct');

    jest.spyOn(document, 'referrer', 'get').mockReturnValue('https://www.google.com/');
    expect(getReferrer()).toBe('https://www.google.com/');
  });
});
