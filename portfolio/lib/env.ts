import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_CHAT_WEBHOOK_URL: z.url(),
    NEXT_PUBLIC_INFO_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_CHAT_WEBHOOK_URL: process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL,
    NEXT_PUBLIC_INFO_URL: process.env.NEXT_PUBLIC_INFO_URL,
  },
  emptyStringAsUndefined: true,
});
