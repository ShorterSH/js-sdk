// ── SDK Public Types ─────────────────────────────────────────────

export interface ShorterClientOptions {
  apiKey?: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

// Shorten
export interface ShortenResult {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
}

// URL List
export interface ShorterUrl {
  id: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string; // ISO 8601
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListUrlsOptions {
  page?: number;
  limit?: number;
}

export interface ListUrlsResult {
  urls: ShorterUrl[];
  pagination: Pagination;
  totalClicks: number;
}

// Delete
export interface DeleteResult {
  message: string;
}

// Analytics shared
export type Dimension = 'country' | 'device_type' | 'browser' | 'os' | 'referrer_domain' | 'language';

export interface TimeRange {
  start?: number | string;
  end?: number | string;
}

export interface TimeSeriesPoint {
  period: number;
  clicks: number;
  uniqueVisitors: number | null;
}

export interface TimeSeries {
  granularity: string;
  data: TimeSeriesPoint[];
}

export interface BreakdownItem {
  value: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueVisitors: number | null;
  prevPeriodClicks: number;
  prevPeriodUnique: number | null;
  topCountry: string | null;
  topReferrer: string | null;
  topDevice: string | null;
  topBrowser: string | null;
}

// Per-URL analytics
export interface UrlAnalyticsOptions extends TimeRange {
  dimension?: Dimension;
  limit?: number;
  detail?: boolean;
}

export interface UrlAnalyticsResult {
  summary: AnalyticsSummary;
  timeseries: TimeSeries;
  breakdown?: { dimension: string; total: number; data: BreakdownItem[] };
}

export interface UrlAnalyticsDetailResult {
  url: { shortCode: string; originalUrl: string; shortUrl: string };
  summary: AnalyticsSummary;
  timeseries: TimeSeries;
  breakdowns: Record<string, { total: number; data: BreakdownItem[] }>;
}

// Overview analytics
export interface TopUrl {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clicks: number;
}

export interface OverviewAnalyticsResult {
  totalClicks: number;
  uniqueVisitors: number | null;
  prevPeriodClicks: number;
  prevPeriodUnique: number | null;
  timeseries: TimeSeries;
  topUrls: TopUrl[];
  countryBreakdown: BreakdownItem[];
  deviceBreakdown: BreakdownItem[];
  browserBreakdown: BreakdownItem[];
  osBreakdown: BreakdownItem[];
  referrerBreakdown: BreakdownItem[];
}

// ── Internal Raw Types (not exported from index.ts) ─────────────

/** Raw URL item from GET /api/v1/urls — snake_case DB fields */
export interface RawUrlItem {
  id: number;
  short_code: string;
  original_url: string;
  click_count: number;
  short_url: string;
  created_at: number; // epoch ms
  creator_ip: string | null;
  user_id: number | null;
  disabled: number;
  validated: number | null;
  validated_at: string | null;
  threat_type: string | null;
  updated_at: string | null;
}

/** Raw timeseries point — snake_case */
export interface RawTimeSeriesPoint {
  period: number;
  clicks: number;
  unique_visitors: number | null;
}

/** Raw top URL from analytics overview — snake_case */
export interface RawTopUrl {
  short_code: string;
  original_url: string;
  clicks: number;
  owner_email: string | null;
  short_url: string;
}
