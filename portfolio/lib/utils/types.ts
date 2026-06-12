export interface UserInfoItem {
  label: string;
  value: string;
}

/** Array of { label, value } for display (e.g. location, ip, browser, os, device, botRisk, referer). */
export type UserInfo = UserInfoItem[];

/** Parsed UA result from ua-parser-js (subset we use). */
export interface ParsedUA {
  ua: string;
  browser: { name?: string; version?: string; major?: string; type?: string };
  os: { name?: string; version?: string };
  device: { type?: string; vendor?: string; model?: string };
  engine: { name?: string; version?: string };
  cpu: { architecture?: string };
}
