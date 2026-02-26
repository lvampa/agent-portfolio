import { buildUserInfoForUi, getParsedUA } from '../clientInfo';
import type { ClientInfo } from '@lib/hooks/types';

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
    const userInfo: ClientInfo = { request: null, parsedUA: null };
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
        deviceType: '',
        userAgent: null,
        acceptLanguage: null,
        acceptEncoding: null,
        referer: 'https://example.com',
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
    };
    const result = buildUserInfoForUi(userInfo);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(7);
    const byLabel = Object.fromEntries((result!).map(({ label, value }) => [label, value]));
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
    };
    const result = buildUserInfoForUi(userInfo);
    expect(result).not.toBeNull();
    const byLabel = Object.fromEntries((result!).map(({ label, value }) => [label, value]));
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
    };
    const result = buildUserInfoForUi(userInfo);
    expect(result).not.toBeNull();
    const botRisk = result!.find(({ label }) => label === 'botRisk');
    expect(botRisk?.value).toBe('high');
  });
});
