import { env } from '@lib/env';

import { Client } from './Client';
import { INFO_PATH } from './constants';

export const chatClient = new Client(env.NEXT_PUBLIC_CHAT_WEBHOOK_URL);
export const infoClient = new Client(INFO_PATH);
