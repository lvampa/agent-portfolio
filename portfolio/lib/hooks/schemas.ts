import { z } from 'zod';

export const ClientInfoRequestSchema = z.object({
  ip: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string(),
  latitude: z.union([z.string(), z.number()]),
  longitude: z.union([z.string(), z.number()]),
  // The info Worker sends the ASN as a number.
  asn: z.union([z.string(), z.number()]),
  organization: z.string(),
  timezone: z.string(),
  deviceType: z.string(),
  userAgent: z.string().nullable(),
  acceptLanguage: z.string().nullable(),
  acceptEncoding: z.string().nullable(),
  referer: z.string(),
  tlsVersion: z.string(),
  tlsCipher: z.string(),
  timestamp: z.string(),
});

export const ChatResponseItemSchema = z.object({
  output: z.string(),
});

export const ChatResponseSchema = z.array(ChatResponseItemSchema);
