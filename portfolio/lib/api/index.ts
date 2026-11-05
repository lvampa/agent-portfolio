import { Client } from '@lib/api/Client';
import { env } from '@lib/env';

export * from './types';
export const chatClient = new Client(env.NEXT_PUBLIC_CHAT_WEBHOOK_URL);
export const infoClient = new Client(env.NEXT_PUBLIC_INFO_URL);
