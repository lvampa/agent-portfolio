import type { z } from 'zod';

import type { ParsedUASchema, UserInfoItemSchema, UserInfoSchema } from './schemas';

export type ParsedUA = z.infer<typeof ParsedUASchema>;
export type UserInfoItem = z.infer<typeof UserInfoItemSchema>;
/** Array of { label, value } for display (e.g. location, ip, browser, os, device, botRisk, referer). */
export type UserInfo = z.infer<typeof UserInfoSchema>;
