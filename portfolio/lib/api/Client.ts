import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

import { type ClientInterface } from './types';

export class Client implements ClientInterface {
  private readonly axios: AxiosInstance;

  constructor(private readonly baseURL: string) {
    this.axios = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async get<T = unknown>(url: string): Promise<AxiosResponse<T>> {
    return this.axios.get<T>(url);
  }

  async post<T = unknown>(url: string, payload: unknown): Promise<AxiosResponse<T>> {
    return this.axios.post<T>(url, payload);
  }

  getWebhookUrl(): string {
    return this.baseURL;
  }
}
