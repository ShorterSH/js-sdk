import { describe, it, expect } from 'vitest';
import { ShorterClient } from '../src/client.js';
import { AuthenticationError, ValidationError, NotFoundError, NetworkError } from '../src/errors.js';
import { createMockFetch } from './mock-fetch.js';

const TEST_KEY = 'sk_' + 'a'.repeat(64);

function makeClient(responses: Parameters<typeof createMockFetch>[0]) {
  const mock = createMockFetch(responses);
  const client = new ShorterClient({
    apiKey: TEST_KEY,
    baseUrl: 'https://test.shorter.sh',
    fetch: mock.fetch,
  });
  return { client, mock };
}

describe('ShorterClient constructor', () => {
  it('throws without API key', () => {
    const originalEnv = process.env.SHORTER_API_KEY;
    delete process.env.SHORTER_API_KEY;
    try {
      expect(() => new ShorterClient()).toThrow(AuthenticationError);
    } finally {
      if (originalEnv) process.env.SHORTER_API_KEY = originalEnv;
    }
  });

  it('throws for invalid API key format', () => {
    expect(() => new ShorterClient({ apiKey: 'bad_key' })).toThrow(AuthenticationError);
  });

  it('accepts valid API key', () => {
    const client = new ShorterClient({
      apiKey: TEST_KEY,
      fetch: createMockFetch({ body: {} }).fetch,
    });
    expect(client).toBeInstanceOf(ShorterClient);
    expect(client.analytics).toBeDefined();
  });
});

describe('ShorterClient.shorten', () => {
  it('sends POST and returns camelCase result', async () => {
    const { client, mock } = makeClient({
      status: 201,
      body: {
        success: true,
        shortCode: 'xK9mP2',
        shortUrl: 'https://shorter.sh/xK9mP2',
        originalUrl: 'https://example.com',
      },
    });

    const result = await client.shorten('https://example.com');

    expect(result).toEqual({
      shortCode: 'xK9mP2',
      shortUrl: 'https://shorter.sh/xK9mP2',
      originalUrl: 'https://example.com',
    });

    expect(mock.calls[0].url).toBe('https://test.shorter.sh/api/v1/shorten');
    expect(mock.calls[0].init?.method).toBe('POST');

    const body = JSON.parse(mock.calls[0].init?.body as string);
    expect(body).toEqual({ url: 'https://example.com' });
  });

  it('throws ValidationError on 400', async () => {
    const { client } = makeClient({
      status: 400,
      body: { success: false, message: 'Invalid URL', code: 'INVALID_URL' },
    });

    await expect(client.shorten('bad')).rejects.toThrow(ValidationError);
  });
});

describe('ShorterClient.list', () => {
  it('maps snake_case response to camelCase', async () => {
    const createdAt = 1705334400000; // 2024-01-15T16:00:00.000Z
    const { client, mock } = makeClient({
      body: {
        success: true,
        data: [{
          id: 1,
          short_code: 'xK9mP2',
          short_url: 'https://shorter.sh/xK9mP2',
          original_url: 'https://example.com',
          click_count: 127,
          created_at: createdAt,
          creator_ip: null,
          user_id: 1,
          disabled: 0,
          validated: null,
          validated_at: null,
          threat_type: null,
          updated_at: null,
        }],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        totalClicks: 127,
      },
    });

    const result = await client.list();

    expect(result.urls[0]).toEqual({
      id: 1,
      shortCode: 'xK9mP2',
      shortUrl: 'https://shorter.sh/xK9mP2',
      originalUrl: 'https://example.com',
      clickCount: 127,
      createdAt: new Date(createdAt).toISOString(),
    });
    expect(result.pagination.total).toBe(1);
    expect(result.totalClicks).toBe(127);

    // Check query params
    expect(mock.calls[0].url).toBe('https://test.shorter.sh/api/v1/urls');
  });

  it('passes page and limit params', async () => {
    const { client, mock } = makeClient({
      body: { success: true, data: [], pagination: { page: 2, limit: 10, total: 0, totalPages: 0 }, totalClicks: 0 },
    });

    await client.list({ page: 2, limit: 10 });
    expect(mock.calls[0].url).toContain('page=2');
    expect(mock.calls[0].url).toContain('limit=10');
  });
});

describe('ShorterClient.delete', () => {
  it('sends DELETE to correct path', async () => {
    const { client, mock } = makeClient({
      body: { success: true, message: 'URL deleted' },
    });

    const result = await client.delete('xK9mP2');

    expect(result.message).toBe('URL deleted');
    expect(mock.calls[0].url).toBe('https://test.shorter.sh/api/v1/urls/xK9mP2');
    expect(mock.calls[0].init?.method).toBe('DELETE');
  });

  it('throws NotFoundError on 404', async () => {
    const { client } = makeClient({
      status: 404,
      body: { success: false, message: 'URL not found', code: 'NOT_FOUND' },
    });

    await expect(client.delete('noCode1')).rejects.toThrow(NotFoundError);
  });
});

describe('Network errors', () => {
  it('throws NetworkError when fetch fails', async () => {
    const client = new ShorterClient({
      apiKey: TEST_KEY,
      baseUrl: 'https://test.shorter.sh',
      fetch: () => { throw new Error('DNS resolution failed'); },
    });

    await expect(client.shorten('https://example.com')).rejects.toThrow(NetworkError);
  });
});

describe('Auth header', () => {
  it('sends Bearer token', async () => {
    const { client, mock } = makeClient({
      body: { success: true, data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }, totalClicks: 0 },
    });

    await client.list();
    const headers = mock.calls[0].init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TEST_KEY}`);
  });
});
