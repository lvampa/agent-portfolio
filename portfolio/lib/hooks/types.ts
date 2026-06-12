export interface UseChat {
  sendMessage: (message: string) => Promise<unknown>;
  isLoading: boolean;
  error: Error | null;
  data: unknown;
}

import type { ParsedUA } from '@lib/utils/types';

/** Client request + parsed UA (use buildUserInfoForUi for UI display). */
export interface ClientInfo {
  request: ClientInfoRequest | null;
  parsedUA: ParsedUA | null;
}

export interface UseClientInfo {
  /** Request and parsed UA (use buildUserInfoForUi for UI). */
  userInfo: ClientInfo;
  isLoading: boolean;
  error: Error | null;
}

export interface ClientInfoRequest {
  ip: string | null;
  country: string | null;
  city: string;
  latitude: string | number;
  longitude: string | number;
  asn: string;
  organization: string;
  timezone: string;
  deviceType: string;
  userAgent: string | null;
  acceptLanguage: string | null;
  acceptEncoding: string | null;
  referer: string;
  tlsVersion: string;
  tlsCipher: string;
  timestamp: string;
}
