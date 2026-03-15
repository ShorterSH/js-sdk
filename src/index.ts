// SDK public barrel export
export { ShorterClient } from './client.js';
export { AnalyticsClient } from './analytics.js';

// Error classes
export {
  ShorterError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
  NetworkError,
} from './errors.js';

// Public types
export type {
  ShorterClientOptions,
  ShortenResult,
  ShorterUrl,
  Pagination,
  ListUrlsOptions,
  ListUrlsResult,
  DeleteResult,
  Dimension,
  TimeRange,
  TimeSeriesPoint,
  TimeSeries,
  BreakdownItem,
  AnalyticsSummary,
  UrlAnalyticsOptions,
  UrlAnalyticsResult,
  UrlAnalyticsDetailResult,
  TopUrl,
  OverviewAnalyticsResult,
} from './types.js';
