import type { ClientInfoRequest } from '@lib/hooks/types';

/** Parsed UA result from ua-parser-js (subset we use). */
export interface ParsedUA {
  ua: string;
  browser: { name?: string; version?: string; major?: string; type?: string };
  os: { name?: string; version?: string };
  device: { type?: string; vendor?: string; model?: string };
  engine: { name?: string; version?: string };
  cpu: { architecture?: string };
}

/** User info collected on init: API client info + parsed user-agent. */
export interface UserInfo {
  /** From the info API (Cloudflare Worker). */
  client: ClientInfoRequest | null;
  /** From ua-parser-js. */
  ua: ParsedUA;
}

/**
 * Collects user info from API client data and the UA parser result.
 * Run when the page loads with data from useClientInfo and UAParser.
 */
export function collectUserInfo(
  clientInfo: ClientInfoRequest | null,
  parsedUA: ParsedUA
): UserInfo {
  return {
    client: clientInfo,
    ua: parsedUA,
  };
}
