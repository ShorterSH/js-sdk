import { describe, it, expect } from 'vitest';
import { ShorterClient } from '../src/client.js';
import { ValidationError } from '../src/errors.js';
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

describe('AnalyticsClient.overview', () => {
  it('maps snake_case fields in timeseries and topUrls', async () => {
    const { client } = makeClient({
      body: {
        success: true,
        totalClicks: 5420,
        uniqueVisitors: 3100,
        prevPeriodClicks: 4800,
        prevPeriodUnique: 2700,
        timeseries: {
          granularity: 'daily',
          data: [
            { period: 1705276800, clicks: 100, unique_visitors: 80 },
            { period: 1705363200, clicks: 120, unique_visitors: 95 },
          ],
        },
        topUrls: [
          { short_code: 'xK9mP2', short_url: 'https://shorter.sh/xK9mP2', original_url: 'https://example.com', clicks: 580, owner_email: null },
        ],
        countryBreakdown: [{ value: 'US', clicks: 2100, percentage: 38.7 }],
        deviceBreakdown: [],
        browserBreakdown: [],
        osBreakdown: [],
        referrerBreakdown: [],
      },
    });

    const result = await client.analytics.overview();

    expect(result.totalClicks).toBe(5420);
    expect(result.uniqueVisitors).toBe(3100);
    expect(result.prevPeriodClicks).toBe(4800);

    // Timeseries mapped
    expect(result.timeseries.data[0].uniqueVisitors).toBe(80);
    expect(result.timeseries.data[1].uniqueVisitors).toBe(95);
    expect(result.timeseries.granularity).toBe('daily');

    // TopUrls mapped
    expect(result.topUrls[0].shortCode).toBe('xK9mP2');
    expect(result.topUrls[0].shortUrl).toBe('https://shorter.sh/xK9mP2');
    expect(result.topUrls[0].originalUrl).toBe('https://example.com');
    expect(result.topUrls[0].clicks).toBe(580);

    // Breakdowns passed through
    expect(result.countryBreakdown[0].value).toBe('US');
  });

  it('passes start/end query params', async () => {
    const { client, mock } = makeClient({
      body: {
        success: true,
        totalClicks: 0, uniqueVisitors: null,
        prevPeriodClicks: 0, prevPeriodUnique: null,
        timeseries: { granularity: 'daily', data: [] },
        topUrls: [],
        countryBreakdown: [], deviceBreakdown: [], browserBreakdown: [], osBreakdown: [], referrerBreakdown: [],
      },
    });

    await client.analytics.overview({ start: '2024-01-01', end: '2024-01-31' });
    expect(mock.calls[0].url).toContain('start=2024-01-01');
    expect(mock.calls[0].url).toContain('end=2024-01-31');
  });
});

describe('AnalyticsClient.url', () => {
  it('returns summary and timeseries for basic call', async () => {
    const { client } = makeClient({
      body: {
        success: true,
        summary: {
          totalClicks: 127,
          uniqueVisitors: 95,
          prevPeriodClicks: 100,
          prevPeriodUnique: 80,
          topCountry: 'US',
          topReferrer: 'google.com',
          topDevice: 'Desktop',
          topBrowser: 'Chrome',
        },
        timeseries: {
          granularity: 'daily',
          data: [{ period: 1705276800, clicks: 50, unique_visitors: 40 }],
        },
      },
    });

    const result = await client.analytics.url('xK9mP2');

    expect(result.summary.totalClicks).toBe(127);
    expect(result.timeseries.data[0].uniqueVisitors).toBe(40);
    expect(result.breakdown).toBeUndefined();
  });

  it('returns breakdown when dimension specified', async () => {
    const { client } = makeClient({
      body: {
        success: true,
        summary: {
          totalClicks: 127, uniqueVisitors: 95,
          prevPeriodClicks: 100, prevPeriodUnique: 80,
          topCountry: 'US', topReferrer: null, topDevice: null, topBrowser: null,
        },
        timeseries: { granularity: 'daily', data: [] },
        breakdown: {
          dimension: 'country',
          total: 127,
          data: [{ value: 'US', clicks: 80, percentage: 63.0 }],
        },
      },
    });

    const result = await client.analytics.url('xK9mP2', { dimension: 'country' });
    expect(result.breakdown?.dimension).toBe('country');
    expect(result.breakdown?.data[0].value).toBe('US');
  });

  it('returns detail result when detail=true', async () => {
    const { client } = makeClient({
      body: {
        success: true,
        url: { shortCode: 'xK9mP2', originalUrl: 'https://example.com', shortUrl: 'https://shorter.sh/xK9mP2' },
        summary: {
          totalClicks: 127, uniqueVisitors: 95,
          prevPeriodClicks: 100, prevPeriodUnique: 80,
          topCountry: 'US', topReferrer: null, topDevice: null, topBrowser: null,
        },
        timeseries: { granularity: 'daily', data: [{ period: 1705276800, clicks: 50, unique_visitors: 40 }] },
        breakdowns: {
          country: { total: 127, data: [{ value: 'US', clicks: 80, percentage: 63.0 }] },
        },
      },
    });

    const result = await client.analytics.url('xK9mP2', { detail: true });
    expect(result.url.shortCode).toBe('xK9mP2');
    expect(result.breakdowns.country.data[0].value).toBe('US');
    expect(result.timeseries.data[0].uniqueVisitors).toBe(40);
  });

  it('validates short code before analytics request', async () => {
    const { client, mock } = makeClient({
      body: {
        success: true,
        summary: {},
        timeseries: { granularity: 'daily', data: [] },
      },
    });

    await expect(client.analytics.url('bad/path')).rejects.toThrow(ValidationError);
    expect(mock.calls).toHaveLength(0);
  });
});
