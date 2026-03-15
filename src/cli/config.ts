import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface CliConfig {
  apiKey?: string;
  baseUrl?: string;
}

export function getConfigDir(): string {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'shorter');
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(xdg, 'shorter');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function loadConfig(): CliConfig {
  const configPath = getConfigPath();
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as CliConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: CliConfig): void {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600,
  });
}

/**
 * Resolve API key with precedence: env var > config file.
 * Returns undefined if neither is set.
 */
export function resolveApiKey(): string | undefined {
  return process.env.SHORTER_API_KEY || loadConfig().apiKey;
}

/**
 * Resolve base URL with precedence: env var > config file > default.
 */
export function resolveBaseUrl(): string {
  return process.env.SHORTER_BASE_URL || loadConfig().baseUrl || 'https://shorter.sh';
}
