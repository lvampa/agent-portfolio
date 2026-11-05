import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Only next.config.ts reads it, for the dev server's /info rewrite.
    DEV_INFO_URL: z.url().optional(),
  },
  client: {
    NEXT_PUBLIC_CHAT_WEBHOOK_URL: z.url(),
  },
  runtimeEnv: {
    DEV_INFO_URL: process.env.DEV_INFO_URL,
    NEXT_PUBLIC_CHAT_WEBHOOK_URL: process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL,
  },
  emptyStringAsUndefined: true,
});
