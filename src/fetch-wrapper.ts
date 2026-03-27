import { mapStatusToError, NetworkError, ServerError } from './errors.js';

export interface RequestOptions {
  method?: string;
  body?: Record<string, unknown>;
  params?: Record<string, string | number | boolean | undefined>;
}

export class FetchWrapper {
  private static readonly REQUEST_TIMEOUT_MS = 10_000;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(baseUrl: string, apiKey: string, fetchFn: typeof globalThis.fetch) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
    this.fetchFn = fetchFn;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FetchWrapper.REQUEST_TIMEOUT_MS);
    const init: RequestInit = { method, headers, signal: controller.signal };

    if (body) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url, init);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new NetworkError(`Request timed out after ${FetchWrapper.REQUEST_TIMEOUT_MS}ms`);
      }
      throw new NetworkError(
        err instanceof Error ? err.message : 'Network request failed'
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const responseBody = await response.text();
    let data: Record<string, unknown> = {};

    if (responseBody) {
      try {
        const parsed = JSON.parse(responseBody);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Invalid JSON object');
        }
        data = parsed as Record<string, unknown>;
      } catch {
        if (!response.ok) {
          throw mapStatusToError(
            response.status,
            `Request failed with status ${response.status}`,
            'INVALID_RESPONSE'
          );
        }
        throw new ServerError('Invalid JSON response from server', 'INVALID_RESPONSE');
      }
    }

    if (!response.ok || data.success === false) {
      throw mapStatusToError(
        response.status,
        (data.message as string) || `Request failed with status ${response.status}`,
        (data.code as string) || 'UNKNOWN_ERROR'
      );
    }

    return data as T;
  }
}
