import { Client } from '@lib/api/Client';
import { z } from 'zod';

export * from './types';

const envSchema = z.object({
  NEXT_PUBLIC_CHAT_WEBHOOK_URL: z.url(),
  NEXT_PUBLIC_INFO_URL: z.url(),
});

// Next.js only inlines NEXT_PUBLIC_ vars read as literal `process.env.NAME`, so list them out.
// Parsing at load makes `next build` fail instead of shipping a bundle with an empty base URL.
const env = envSchema.parse({
  NEXT_PUBLIC_CHAT_WEBHOOK_URL: process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL,
  NEXT_PUBLIC_INFO_URL: process.env.NEXT_PUBLIC_INFO_URL,
});

export const chatClient = new Client(env.NEXT_PUBLIC_CHAT_WEBHOOK_URL);
export const infoClient = new Client(env.NEXT_PUBLIC_INFO_URL);
