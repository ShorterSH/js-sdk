import { ShorterClient } from '../client.js';
import { ShorterError } from '../errors.js';
import { resolveApiKey, resolveBaseUrl, loadConfig, saveConfig } from './config.js';
import { prompt } from './prompt.js';
import * as output from './output.js';
import { isValidApiKey } from '../validation.js';

import { shortenCommand } from './commands/shorten.js';
import { listCommand } from './commands/list.js';
import { deleteCommand } from './commands/delete.js';
import { analyticsCommand } from './commands/analytics.js';
import { configCommand } from './commands/config.js';

const VERSION = '1.0.0';

interface ParsedArgs {
  flags: Record<string, string | true>;
  positional: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string | true> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

function showHelp(): void {
  console.log(`
${output.bold('shorter.sh')} — URL shortener CLI

${output.bold('Usage:')}
  shorter <url>                         Shorten a URL
  shorter list [--page N] [--limit N]   List your URLs
  shorter delete <shortCode> [--yes]    Delete a URL
  shorter analytics [shortCode]         View analytics
  shorter config <set|get|path> [...]   Manage configuration

${output.bold('Options:')}
  --no-copy          Don't copy to clipboard
  --start <date>     Analytics start date
  --end <date>       Analytics end date
  --dimension <dim>  Analytics breakdown dimension
  --yes              Skip confirmation prompts
  -h, --help         Show help
  -v, --version      Show version

${output.bold('Aliases:')}
  ls → list, rm → delete, stats → analytics

${output.bold('Examples:')}
  shorter https://example.com
  shorter list --limit 10
  shorter analytics xK9mP2 --dimension country
  shorter config set api-key sk_your_key_here
`);
}

async function ensureApiKey(): Promise<string> {
  let apiKey = resolveApiKey();
  if (apiKey) return apiKey;

  console.log(output.bold('\nWelcome to shorter.sh!\n'));
  console.log('To get started, you need an API key.');
  console.log(`Get one at: ${output.cyan('https://shorter.sh/dashboard')}\n`);

  const input = await prompt('Enter your API key: ');
  apiKey = input ?? undefined;

  if (!apiKey) {
    output.error('API key is required. Set it with: shorter config set api-key <key>');
    process.exit(1);
  }

  if (!isValidApiKey(apiKey)) {
    output.error('Invalid API key format. Keys must match "sk_" followed by 64 lowercase hex characters.');
    process.exit(1);
  }

  const config = loadConfig();
  config.apiKey = apiKey;
  saveConfig(config);
  output.success('API key saved!\n');

  return apiKey;
}

async function main(): Promise<void> {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  // Help
  if (flags.h === true || flags.help === true || positional[0] === 'help') {
    showHelp();
    return;
  }

  // Version
  if (flags.v === true || flags.version === true) {
    console.log(VERSION);
    return;
  }

  // Config command (doesn't need API key)
  if (positional[0] === 'config') {
    configCommand(positional.slice(1));
    return;
  }

  // Determine command
  let command: string;
  let commandArgs: string[];

  const first = positional[0];

  if (!first) {
    showHelp();
    return;
  }

  if (first.startsWith('http://') || first.startsWith('https://')) {
    command = 'shorten';
    commandArgs = [first];
  } else {
    // Resolve aliases
    const aliases: Record<string, string> = { ls: 'list', rm: 'delete', stats: 'analytics' };
    command = aliases[first] || first;
    commandArgs = positional.slice(1);
  }

  // Ensure API key for all commands
  const apiKey = await ensureApiKey();
  const client = new ShorterClient({ apiKey, baseUrl: resolveBaseUrl() });

  switch (command) {
    case 'shorten':
      if (!commandArgs[0]) {
        output.error('URL is required. Usage: shorter <url>');
        process.exit(1);
      }
      await shortenCommand(client, commandArgs[0], flags);
      break;

    case 'list':
      await listCommand(client, flags);
      break;

    case 'delete':
      if (!commandArgs[0]) {
        output.error('Short code is required. Usage: shorter delete <shortCode>');
        process.exit(1);
      }
      await deleteCommand(client, commandArgs[0], flags);
      break;

    case 'analytics':
      await analyticsCommand(client, commandArgs[0], flags);
      break;

    default:
      output.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  if (err instanceof ShorterError) {
    output.error(err.message);
    if (err.code) {
      console.error(output.dim(`  Code: ${err.code}`));
    }
  } else {
    output.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
  }
  process.exit(1);
});
