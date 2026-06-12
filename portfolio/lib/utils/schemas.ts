import { z } from 'zod';

const uaSubSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  major: z.string().optional(),
  type: z.string().optional(),
});

export const ParsedUASchema = z.object({
  ua: z.string(),
  browser: uaSubSchema,
  os: z.object({ name: z.string().optional(), version: z.string().optional() }),
  device: z.object({
    type: z.string().optional(),
    vendor: z.string().optional(),
    model: z.string().optional(),
  }),
  engine: z.object({ name: z.string().optional(), version: z.string().optional() }),
  cpu: z.object({ architecture: z.string().optional() }),
});

export const UserInfoItemSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const UserInfoSchema = z.array(UserInfoItemSchema);
