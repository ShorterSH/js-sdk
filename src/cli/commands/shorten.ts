import { ShorterClient } from '../../client.js';
import { copyToClipboard } from '../clipboard.js';
import * as output from '../output.js';

export async function shortenCommand(
  client: ShorterClient,
  url: string,
  flags: Record<string, string | true>,
): Promise<void> {
  const result = await client.shorten(url);

  output.success(output.bold(output.green(result.shortUrl)));

  if (flags['no-copy'] !== true) {
    const copied = copyToClipboard(result.shortUrl);
    if (copied) {
      console.log(`  ${output.dim('Copied to clipboard!')}`);
    }
  }
}
