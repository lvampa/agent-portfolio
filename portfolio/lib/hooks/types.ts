import type { ParsedUA } from '@lib/utils/types';
import type { z } from 'zod';

import type { ChatResponseSchema, ClientInfoRequestSchema } from './schemas';

export type ClientInfoRequest = z.infer<typeof ClientInfoRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/** Client request + parsed UA (use buildUserInfoForUi for UI display). */
export interface ClientInfo {
  request: ClientInfoRequest | null;
  parsedUA: ParsedUA | null;
}

/** What the agent may know about the visitor. Never the IP. */
export interface ChatVisitor {
  organization: string | null;
  country: string | null;
}

/** The body of a chat request. sessionId keys the agent's memory. */
export interface ChatRequest {
  chatInput: string;
  sessionId: string;
  name: string | null;
  client: ChatVisitor;
}

export interface UseChat {
  sendMessage: (request: ChatRequest) => Promise<ChatResponse | undefined>;
  isLoading: boolean;
  error: Error | null;
}

export interface UseClientInfo {
  /** Request and parsed UA (use buildUserInfoForUi for UI). */
  userInfo: ClientInfo;
  isLoading: boolean;
  error: Error | null;
}
