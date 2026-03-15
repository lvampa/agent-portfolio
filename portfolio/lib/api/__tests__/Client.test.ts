import axios from 'axios';
import { Client } from '../client';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Client', () => {
  const mockPost = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create = jest.fn().mockReturnValue({
      post: mockPost,
    });
  });

  describe('constructor', () => {
    test('uses provided chat URL', () => {
      const client = new Client('https://example.com/webhook');
      expect(client.getWebhookUrl()).toBe('https://example.com/webhook');
    });

    test('creates axios instance with JSON content type', () => {
      new Client('https://example.com');
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://example.com',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('post', () => {
    test('sends POST request with payload and returns response data', async () => {
      const response = { reply: 'Hello back' };
      mockPost.mockResolvedValue({ data: response });

      const client = new Client('https://example.com/webhook');
      const result = await client.post({ message: 'Hello' });

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        'https://example.com/webhook',
        { message: 'Hello' }
      );
      expect(result).toEqual(response);
    });

    test('propagates axios errors', async () => {
      const networkError = new Error('Network Error');
      mockPost.mockRejectedValue(networkError);

      const client = new Client('https://example.com/webhook');

      await expect(client.post({ message: 'Hi' })).rejects.toThrow('Network Error');
    });

    test('returns typed response when generic is provided', async () => {
      const response = { id: 1, text: 'typed' };
      mockPost.mockResolvedValue({ data: response });

      const client = new Client('https://example.com/webhook');
      const result = await client.post<{ id: number; text: string }>({ message: 'Hi' });

      expect(result).toEqual(response);
      expect(result.id).toBe(1);
      expect(result.text).toBe('typed');
    });
  });
});
