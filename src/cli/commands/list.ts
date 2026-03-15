import { ShorterClient } from '../../client.js';
import * as output from '../output.js';

export async function listCommand(
  client: ShorterClient,
  flags: Record<string, string | true>,
): Promise<void> {
  const page = flags.page ? parseInt(String(flags.page), 10) : undefined;
  const limit = flags.limit ? parseInt(String(flags.limit), 10) : undefined;

  const result = await client.list({ page, limit });

  if (result.urls.length === 0) {
    output.warning('No URLs found. Shorten one with: shorter <url>');
    return;
  }

  const headers = ['SHORT URL', 'ORIGINAL', 'CLICKS', 'CREATED'];
  const rows = result.urls.map((u) => [
    u.shortUrl,
    output.truncate(u.originalUrl, 35),
    output.formatNumber(u.clickCount).padStart(6),
    u.createdAt.split('T')[0],
  ]);

  output.table(headers, rows);

  const { pagination, totalClicks } = result;
  console.log(
    `\n${output.dim(`Page ${pagination.page}/${pagination.totalPages} · ${output.formatNumber(pagination.total)} URLs · ${output.formatNumber(totalClicks)} total clicks`)}`
  );
}
