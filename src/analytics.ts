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

    const timeseries = raw.timeseries as { granularity: string; data: RawTimeSeriesPoint[] };
    const topUrls = raw.topUrls as RawTopUrl[];

    return {
      totalClicks: raw.totalClicks as number,
      uniqueVisitors: raw.uniqueVisitors as number | null,
      prevPeriodClicks: raw.prevPeriodClicks as number,
      prevPeriodUnique: raw.prevPeriodUnique as number | null,
      timeseries: {
        granularity: timeseries.granularity,
        data: mapTimeseries(timeseries.data),
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
    const raw = await this.fetch.request<Record<string, unknown>>(`/api/v1/analytics/${shortCode}`, {
      params: {
        start: options?.start !== undefined ? String(options.start) : undefined,
        end: options?.end !== undefined ? String(options.end) : undefined,
        dimension: options?.dimension,
        limit: options?.limit,
        detail: options?.detail ? 'true' : undefined,
      },
    });

    const timeseries = raw.timeseries as { granularity: string; data: RawTimeSeriesPoint[] };
    const mappedTimeseries = {
      granularity: timeseries.granularity,
      data: mapTimeseries(timeseries.data),
    };

    if (options?.detail) {
      // detail=true: server returns url object (already camelCase) + breakdowns
      return {
        url: raw.url as UrlAnalyticsDetailResult['url'],
        summary: raw.summary as UrlAnalyticsDetailResult['summary'],
        timeseries: mappedTimeseries,
        breakdowns: raw.breakdowns as UrlAnalyticsDetailResult['breakdowns'],
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
