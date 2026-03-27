import { loadConfig, saveConfig, getConfigPath } from '../config.js';
import * as output from '../output.js';
import { isValidApiKey } from '../../validation.js';

export function configCommand(
  positional: string[],
): void {
  // shorter config set api-key <key>
  // shorter config set base-url <url>
  // shorter config get api-key
  // shorter config get base-url
  // shorter config path

  const action = positional[0];

  if (action === 'path') {
    console.log(getConfigPath());
    return;
  }

  if (action === 'get') {
    const key = positional[1];
    const config = loadConfig();

    if (key === 'api-key') {
      if (config.apiKey) {
        // Mask: show first 5 and last 4 chars
        const masked = config.apiKey.slice(0, 5) + '••••' + config.apiKey.slice(-4);
        console.log(masked);
      } else {
        output.warning('No API key configured.');
      }
    } else if (key === 'base-url') {
      console.log(config.baseUrl || 'https://shorter.sh (default)');
    } else {
      output.error(`Unknown config key: ${key}. Valid keys: api-key, base-url`);
      process.exit(1);
    }
    return;
  }

  if (action === 'set') {
    const key = positional[1];
    const value = positional[2];

    if (!value) {
      output.error(`Missing value for ${key}.`);
      process.exit(1);
    }

    const config = loadConfig();

    if (key === 'api-key') {
      if (!isValidApiKey(value)) {
        output.error('Invalid API key format. Keys must match "sk_" followed by 64 lowercase hex characters.');
        process.exit(1);
      }
      config.apiKey = value;
      saveConfig(config);
      output.success('API key saved.');
    } else if (key === 'base-url') {
      try {
        new URL(value);
      } catch {
        output.error('Invalid URL.');
        process.exit(1);
      }
      config.baseUrl = value;
      saveConfig(config);
      output.success(`Base URL set to ${value}`);
    } else {
      output.error(`Unknown config key: ${key}. Valid keys: api-key, base-url`);
      process.exit(1);
    }
    return;
  }

  output.error('Usage: shorter config <set|get|path> [key] [value]');
  process.exit(1);
}
