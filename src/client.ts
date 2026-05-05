import { FetchWrapper } from './fetch-wrapper.js';
import { AnalyticsClient } from './analytics.js';
import { AuthenticationError } from './errors.js';
import { assertPositiveInt, assertShortCode, isValidApiKey } from './validation.js';
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
    const envKey =
      typeof process !== 'undefined' && typeof process.env?.SHORTER_API_KEY === 'string'
        ? process.env.SHORTER_API_KEY
        : undefined;
    const apiKey = options?.apiKey || envKey;
    if (!apiKey) {
      throw new AuthenticationError(
        'API key is required. Pass it as options.apiKey or set SHORTER_API_KEY environment variable.',
        'AUTH_REQUIRED'
      );
    }
    if (!isValidApiKey(apiKey)) {
      throw new AuthenticationError(
        'Invalid API key format. Keys must match "sk_" followed by 64 lowercase hex characters.',
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
    if (options?.page !== undefined) assertPositiveInt(options.page, 'page');
    if (options?.limit !== undefined) assertPositiveInt(options.limit, 'limit', { max: 100 });

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
    const safeShortCode = encodeURIComponent(assertShortCode(shortCode));
    const data = await this.fetch.request<{
      success: boolean;
      message: string;
    }>(`/api/v1/urls/${safeShortCode}`, {
      method: 'DELETE',
    });

    return { message: data.message };
  }
}
