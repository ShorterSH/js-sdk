import { ShorterClient } from '../../client.js';
import * as output from '../output.js';
import type { BreakdownItem } from '../../types.js';

function formatChange(current: number, previous: number): string {
  if (previous === 0) return '';
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  const color = pct >= 0 ? output.green : output.red;
  return color(` (${sign}${pct.toFixed(1)}%)`);
}

function printBreakdown(title: string, items: BreakdownItem[], maxItems: number = 5): void {
  if (!items || items.length === 0) return;
  console.log(`\n${output.bold(title)}`);
  const topItems = items.slice(0, maxItems);
  const maxClicks = topItems[0]?.clicks || 1;
  for (const item of topItems) {
    const bar = output.progressBar(item.clicks, maxClicks);
    console.log(
      `  ${(item.value || 'Unknown').padEnd(8)}${output.formatNumber(item.clicks).padStart(8)}  ${item.percentage.toFixed(1).padStart(5)}%  ${bar}`
    );
  }
}

export async function analyticsCommand(
  client: ShorterClient,
  shortCode: string | undefined,
  flags: Record<string, string | true>,
): Promise<void> {
  const start = flags.start ? String(flags.start) : undefined;
  const end = flags.end ? String(flags.end) : undefined;
  const dimension = flags.dimension ? String(flags.dimension) : undefined;

  if (!shortCode) {
    // Overview
    const data = await client.analytics.overview({ start, end });

    console.log(output.bold('\nAnalytics Overview') + output.dim(' (last 30 days)\n'));
    console.log(`  Total Clicks:      ${output.bold(output.formatNumber(data.totalClicks))}${formatChange(data.totalClicks, data.prevPeriodClicks)}`);
    if (data.uniqueVisitors !== null) {
      console.log(`  Unique Visitors:   ${output.bold(output.formatNumber(data.uniqueVisitors))}${formatChange(data.uniqueVisitors, data.prevPeriodUnique ?? 0)}`);
    }

    if (data.topUrls.length > 0) {
      console.log(`\n${output.bold('Top URLs')}`);
      for (const url of data.topUrls.slice(0, 5)) {
        console.log(`  ${url.shortUrl.padEnd(30)} ${output.formatNumber(url.clicks).padStart(6)} clicks  ${output.dim(output.truncate(url.originalUrl, 40))}`);
      }
    }

    printBreakdown('Countries', data.countryBreakdown);
    printBreakdown('Devices', data.deviceBreakdown);
    printBreakdown('Browsers', data.browserBreakdown);

    console.log();
  } else {
    // Per-URL analytics
    const opts: Record<string, unknown> = { start, end };
    if (dimension) {
      opts.dimension = dimension;
    }

    const data = await client.analytics.url(shortCode, opts as Parameters<typeof client.analytics.url>[1]);

    console.log(output.bold(`\nAnalytics for ${shortCode}\n`));
    console.log(`  Total Clicks:      ${output.bold(output.formatNumber(data.summary.totalClicks))}${formatChange(data.summary.totalClicks, data.summary.prevPeriodClicks)}`);
    if (data.summary.uniqueVisitors !== null) {
      console.log(`  Unique Visitors:   ${output.bold(output.formatNumber(data.summary.uniqueVisitors))}${formatChange(data.summary.uniqueVisitors, data.summary.prevPeriodUnique ?? 0)}`);
    }

    if (data.summary.topCountry) console.log(`  Top Country:       ${data.summary.topCountry}`);
    if (data.summary.topReferrer) console.log(`  Top Referrer:      ${data.summary.topReferrer}`);
    if (data.summary.topDevice) console.log(`  Top Device:        ${data.summary.topDevice}`);

    if ('breakdown' in data && data.breakdown) {
      printBreakdown(data.breakdown.dimension, data.breakdown.data);
    }

    console.log();
  }
}
