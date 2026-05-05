import type { FetchWrapper } from './fetch-wrapper.js';
import type {
  TimeRange,
  OverviewAnalyticsResult,
  UrlAnalyticsOptions,
  UrlAnalyticsResult,
  UrlAnalyticsDetailResult,
  TimeSeriesPoint,
  TopUrl,
  RawTimeSeriesPoint,
  RawTopUrl,
} from './types.js';
import { ServerError } from './errors.js';
import { assertShortCode } from './validation.js';

function expectRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ServerError(`Invalid ${name} response from server`, 'INVALID_RESPONSE');
  }
  return value as Record<string, unknown>;
}

function expectArray<T>(value: unknown, name: string): T[] {
  if (!Array.isArray(value)) {
    throw new ServerError(`Invalid ${name} response from server`, 'INVALID_RESPONSE');
  }
  return value as T[];
}

function mapTimeseries(raw: RawTimeSeriesPoint[]): TimeSeriesPoint[] {
  return raw.map((p) => ({
    period: p.period,
    clicks: p.clicks,
    uniqueVisitors: p.unique_visitors,
  }));
}

function mapTopUrl(raw: RawTopUrl): TopUrl {
  return {
    shortCode: raw.short_code,
    shortUrl: raw.short_url,
    originalUrl: raw.original_url,
    clicks: raw.clicks,
  };
}

export class AnalyticsClient {
  private readonly fetch: FetchWrapper;

  constructor(fetchWrapper: FetchWrapper) {
    this.fetch = fetchWrapper;
  }

  async overview(options?: TimeRange): Promise<OverviewAnalyticsResult> {
    const raw = await this.fetch.request<Record<string, unknown>>('/api/v1/analytics/overview', {
      params: {
        start: options?.start !== undefined ? String(options.start) : undefined,
        end: options?.end !== undefined ? String(options.end) : undefined,
      },
    });

    const timeseries = expectRecord(raw.timeseries, 'timeseries') as { granularity: string; data: RawTimeSeriesPoint[] };
    const topUrls = expectArray<RawTopUrl>(raw.topUrls, 'topUrls');

    return {
      totalClicks: raw.totalClicks as number,
      uniqueVisitors: raw.uniqueVisitors as number | null,
      prevPeriodClicks: raw.prevPeriodClicks as number,
      prevPeriodUnique: raw.prevPeriodUnique as number | null,
      timeseries: {
        granularity: timeseries.granularity,
        data: mapTimeseries(expectArray<RawTimeSeriesPoint>(timeseries.data, 'timeseries data')),
      },
      topUrls: topUrls.map(mapTopUrl),
      countryBreakdown: raw.countryBreakdown as OverviewAnalyticsResult['countryBreakdown'],
      deviceBreakdown: raw.deviceBreakdown as OverviewAnalyticsResult['deviceBreakdown'],
      browserBreakdown: raw.browserBreakdown as OverviewAnalyticsResult['browserBreakdown'],
      osBreakdown: raw.osBreakdown as OverviewAnalyticsResult['osBreakdown'],
      referrerBreakdown: raw.referrerBreakdown as OverviewAnalyticsResult['referrerBreakdown'],
    };
  }

  async url(shortCode: string, options?: UrlAnalyticsOptions & { detail: true }): Promise<UrlAnalyticsDetailResult>;
  async url(shortCode: string, options?: UrlAnalyticsOptions): Promise<UrlAnalyticsResult>;
  async url(shortCode: string, options?: UrlAnalyticsOptions): Promise<UrlAnalyticsResult | UrlAnalyticsDetailResult> {
    const safeShortCode = encodeURIComponent(assertShortCode(shortCode));
    const raw = await this.fetch.request<Record<string, unknown>>(`/api/v1/analytics/${safeShortCode}`, {
      params: {
        start: options?.start !== undefined ? String(options.start) : undefined,
        end: options?.end !== undefined ? String(options.end) : undefined,
        dimension: options?.dimension,
        limit: options?.limit,
        detail: options?.detail ? 'true' : undefined,
      },
    });

    const timeseries = expectRecord(raw.timeseries, 'timeseries') as { granularity: string; data: RawTimeSeriesPoint[] };
    const mappedTimeseries = {
      granularity: timeseries.granularity,
      data: mapTimeseries(expectArray<RawTimeSeriesPoint>(timeseries.data, 'timeseries data')),
    };

    if (options?.detail) {
      // detail=true: server returns url object (already camelCase) + breakdowns
      return {
        url: expectRecord(raw.url, 'url') as UrlAnalyticsDetailResult['url'],
        summary: raw.summary as UrlAnalyticsDetailResult['summary'],
        timeseries: mappedTimeseries,
        breakdowns: expectRecord(raw.breakdowns, 'breakdowns') as UrlAnalyticsDetailResult['breakdowns'],
      };
    }

    const result: UrlAnalyticsResult = {
      summary: raw.summary as UrlAnalyticsResult['summary'],
      timeseries: mappedTimeseries,
    };

    if (raw.breakdown) {
      result.breakdown = raw.breakdown as UrlAnalyticsResult['breakdown'];
    }

    return result;
  }
}
