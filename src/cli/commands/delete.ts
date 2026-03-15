import { ShorterClient } from '../../client.js';
import { confirm } from '../prompt.js';
import * as output from '../output.js';

export async function deleteCommand(
  client: ShorterClient,
  shortCode: string,
  flags: Record<string, string | true>,
): Promise<void> {
  if (!/^[a-zA-Z0-9]{6}$/.test(shortCode)) {
    output.error('Invalid short code. Must be 6 alphanumeric characters.');
    process.exit(1);
  }

  if (flags.yes !== true) {
    const ok = await confirm(`Delete ${output.bold(shortCode)}?`);
    if (!ok) {
      console.log(output.dim('Cancelled.'));
      return;
    }
  }

  await client.delete(shortCode);
  output.success(`Deleted ${output.bold(shortCode)}`);
}
