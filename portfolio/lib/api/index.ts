import { Client } from '@lib/api/Client';

export * from './types';
export const chatClient = new Client(process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL ?? '');
export const infoClient = new Client(process.env.NEXT_PUBLIC_INFO_URL ?? '');
