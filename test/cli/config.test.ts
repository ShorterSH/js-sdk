import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { getConfigPath, loadConfig, saveConfig, resolveApiKey } from '../../src/cli/config.js';

describe('CLI config', () => {
  let tmpDir: string;
  let originalXdg: string | undefined;
  let originalAppData: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shorter-test-'));
    originalXdg = process.env.XDG_CONFIG_HOME;
    originalAppData = process.env.APPDATA;
    originalApiKey = process.env.SHORTER_API_KEY;

    if (process.platform === 'win32') {
      process.env.APPDATA = tmpDir;
    } else {
      process.env.XDG_CONFIG_HOME = tmpDir;
    }
    delete process.env.SHORTER_API_KEY;
  });

  afterEach(() => {
    if (originalXdg !== undefined) process.env.XDG_CONFIG_HOME = originalXdg;
    else delete process.env.XDG_CONFIG_HOME;
    if (originalAppData !== undefined) process.env.APPDATA = originalAppData;
    else delete process.env.APPDATA;
    if (originalApiKey !== undefined) process.env.SHORTER_API_KEY = originalApiKey;
    else delete process.env.SHORTER_API_KEY;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getConfigPath returns platform-specific path', () => {
    const configPath = getConfigPath();
    expect(configPath).toContain('shorter');
    expect(configPath).toContain('config.json');
  });

  it('loadConfig returns empty object for missing file', () => {
    expect(loadConfig()).toEqual({});
  });

  it('saveConfig and loadConfig roundtrip', () => {
    const config = { apiKey: 'sk_test123', baseUrl: 'https://custom.url' };
    saveConfig(config);
    expect(loadConfig()).toEqual(config);
  });

  it('resolveApiKey prefers env var', () => {
    saveConfig({ apiKey: 'sk_from_config' });
    process.env.SHORTER_API_KEY = 'sk_from_env';
    expect(resolveApiKey()).toBe('sk_from_env');
  });

  it('resolveApiKey falls back to config', () => {
    saveConfig({ apiKey: 'sk_from_config' });
    expect(resolveApiKey()).toBe('sk_from_config');
  });

  it('resolveApiKey returns undefined when nothing set', () => {
    expect(resolveApiKey()).toBeUndefined();
  });
});
