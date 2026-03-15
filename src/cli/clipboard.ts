import { execSync } from 'node:child_process';

export function copyToClipboard(text: string): boolean {
  try {
    const platform = process.platform;
    let cmd: string;

    if (platform === 'darwin') {
      cmd = 'pbcopy';
    } else if (platform === 'win32') {
      cmd = 'clip.exe';
    } else {
      // Linux: try xclip, xsel, wl-copy in order
      cmd = tryLinuxClipboard(text);
      return cmd !== '';
    }

    execSync(cmd, {
      input: text,
      stdio: ['pipe', 'ignore', 'ignore'],
      timeout: 3000,
    });
    return true;
  } catch {
    return false;
  }
}

function tryLinuxClipboard(text: string): string {
  const commands = [
    'xclip -selection clipboard',
    'xsel --clipboard --input',
    'wl-copy',
  ];

  for (const cmd of commands) {
    try {
      execSync(cmd, {
        input: text,
        stdio: ['pipe', 'ignore', 'ignore'],
        timeout: 3000,
      });
      return cmd;
    } catch {
      continue;
    }
  }
  return '';
}
