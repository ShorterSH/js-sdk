import { FetchWrapper } from './fetch-wrapper.js';
import { AnalyticsClient } from './analytics.js';
import { AuthenticationError } from './errors.js';
import type {
  ShorterClientOptions,
  ShortenResult,
  ListUrlsOptions,
  ListUrlsResult,
  DeleteResult,
  RawUrlItem,
  ShorterUrl,
} from './types.js';

function mapUrl(raw: RawUrlItem): ShorterUrl {
  return {
    id: raw.id,
    shortCode: raw.short_code,
    shortUrl: raw.short_url,
    originalUrl: raw.original_url,
    clickCount: raw.click_count,
    createdAt: new Date(raw.created_at).toISOString(),
  };
}

export class ShorterClient {
  readonly analytics: AnalyticsClient;
  private readonly fetch: FetchWrapper;

  constructor(options?: ShorterClientOptions) {
    const apiKey = options?.apiKey || (typeof process !== 'undefined' ? process.env.SHORTER_API_KEY : undefined);
    if (!apiKey) {
      throw new AuthenticationError(
        'API key is required. Pass it as options.apiKey or set SHORTER_API_KEY environment variable.',
        'AUTH_REQUIRED'
      );
    }
    if (!apiKey.startsWith('sk_')) {
      throw new AuthenticationError(
        'Invalid API key format. Keys must start with "sk_".',
        'INVALID_API_KEY'
      );
    }

    const baseUrl = options?.baseUrl || 'https://shorter.sh';
    const fetchFn = options?.fetch || globalThis.fetch;

    this.fetch = new FetchWrapper(baseUrl, apiKey, fetchFn);
    this.analytics = new AnalyticsClient(this.fetch);
  }

  async shorten(url: string): Promise<ShortenResult> {
    const data = await this.fetch.request<{
      success: boolean;
      shortCode: string;
      shortUrl: string;
      originalUrl: string;
    }>('/api/v1/shorten', {
      method: 'POST',
      body: { url },
    });

    return {
      shortCode: data.shortCode,
      shortUrl: data.shortUrl,
      originalUrl: data.originalUrl,
    };
  }

  async list(options?: ListUrlsOptions): Promise<ListUrlsResult> {
    const data = await this.fetch.request<{
      success: boolean;
      data: RawUrlItem[];
      pagination: ListUrlsResult['pagination'];
      totalClicks: number;
    }>('/api/v1/urls', {
      params: {
        page: options?.page,
        limit: options?.limit,
      },
    });

    return {
      urls: data.data.map(mapUrl),
      pagination: data.pagination,
      totalClicks: data.totalClicks,
    };
  }

  async delete(shortCode: string): Promise<DeleteResult> {
    const data = await this.fetch.request<{
      success: boolean;
      message: string;
    }>(`/api/v1/urls/${shortCode}`, {
      method: 'DELETE',
    });

    return { message: data.message };
  }
}
