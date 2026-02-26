import { AxiosResponse } from "axios";

export interface ClientInterface {
  post<T = unknown>(url: string, payload: unknown): Promise<AxiosResponse<T>>;
  get<T = unknown>(url: string): Promise<AxiosResponse<T>>;
  getWebhookUrl(): string;
}