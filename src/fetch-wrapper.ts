import { mapStatusToError, NetworkError } from './errors.js';

export interface RequestOptions {
  method?: string;
  body?: Record<string, unknown>;
  params?: Record<string, string | number | boolean | undefined>;
}

export class FetchWrapper {
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

    const init: RequestInit = { method, headers };

    if (body) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url, init);
    } catch (err) {
      throw new NetworkError(
        err instanceof Error ? err.message : 'Network request failed'
      );
    }

    const data = await response.json() as Record<string, unknown>;

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
