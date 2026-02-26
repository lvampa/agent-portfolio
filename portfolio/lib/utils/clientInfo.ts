import { UAParser } from 'ua-parser-js';
import type { UserInfo, ParsedUA } from './types';
import type { ClientInfo, ClientInfoRequest } from '@lib/hooks/types';

export type { UserInfo, UserInfoItem, ParsedUA } from './types';

/**
 * Parse the current browser user agent. Returns null when run outside the browser (e.g. SSR).
 */
export function getParsedUA(): ParsedUA | null {
  if (typeof window === 'undefined') return null;
  const result = new UAParser().getResult();
  return {
    ua: result.ua,
    browser: result.browser,
    os: result.os,
    device: result.device,
    engine: result.engine,
    cpu: result.cpu,
  };
}

const BOT_UA_PATTERNS = /bot|crawler|spider|headless|curl|wget|python|java|scraper|phantom|selenium/i;

function getBotRisk(parsedUA: ParsedUA): 'low' | 'high' {
  const ua = parsedUA.ua ?? '';
  const deviceType = parsedUA.device?.type ?? '';
  const browserType = parsedUA.browser?.type ?? '';
  if (deviceType === 'bot' || browserType === 'bot' || BOT_UA_PATTERNS.test(ua)) {
    return 'high';
  }
  return 'low';
}

function formatLocation(requestInfo: ClientInfoRequest | null): string {
  const city = requestInfo?.city ?? '';
  const country = requestInfo?.country ?? '';
  return [city, country].filter(Boolean).join(', ') || 'Unknown';
}

function formatClient(parsedUA: ParsedUA): { browser: string; os: string; device: string } {
  const b = parsedUA.browser;
  const o = parsedUA.os;
  const d = parsedUA.device;
  return {
    browser: [b?.name, b?.version].filter(Boolean).join(' ') || 'Unknown',
    os: [o?.name, o?.version].filter(Boolean).join(' ') || 'Unknown',
    device: d?.type ?? d?.model ?? d?.vendor ?? 'Unknown',
  };
}

/**
 * Builds presentable { label, value }[] for UI from raw userInfo.
 * Returns null when parsedUA is missing (e.g. SSR).
 */
export function buildUserInfoForUi(userInfo: ClientInfo): UserInfo | null {
  const { request, parsedUA } = userInfo;
  if (!parsedUA) return null;
  const location = formatLocation(request);
  const client = formatClient(parsedUA);
  const botRisk = getBotRisk(parsedUA);
  const referer = request?.referer ?? '';
  const ip = request?.ip ?? '';

  return [
    { label: 'location', value: location },
    { label: 'ip', value: ip },
    { label: 'browser', value: client.browser },
    { label: 'os', value: client.os },
    { label: 'device', value: client.device },
    { label: 'botRisk', value: botRisk },
    { label: 'referer', value: referer },
  ];
}
