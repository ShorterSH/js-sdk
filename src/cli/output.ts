const isColorSupported = !process.env.NO_COLOR && process.stdout.isTTY;

function wrap(code: string, text: string): string {
  return isColorSupported ? `\x1b[${code}m${text}\x1b[0m` : text;
}

export const bold = (s: string) => wrap('1', s);
export const dim = (s: string) => wrap('2', s);
export const green = (s: string) => wrap('32', s);
export const red = (s: string) => wrap('31', s);
export const yellow = (s: string) => wrap('33', s);
export const cyan = (s: string) => wrap('36', s);
export const gray = (s: string) => wrap('90', s);

export function success(msg: string): void {
  console.log(`${green('✓')} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${red('✗')} ${msg}`);
}

export function warning(msg: string): void {
  console.log(`${yellow('!')} ${msg}`);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function table(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] || '').length), 0);
    return Math.max(h.length, maxRow);
  });

  const headerLine = headers.map((h, i) => bold(h.padEnd(widths[i]))).join('  ');
  const separator = widths.map((w) => '─'.repeat(w)).join('  ');

  console.log(headerLine);
  console.log(dim(separator));

  for (const row of rows) {
    const line = row.map((cell, i) => cell.padEnd(widths[i])).join('  ');
    console.log(line);
  }
}

export function progressBar(value: number, max: number, width: number = 20): string {
  const ratio = max > 0 ? value / max : 0;
  const filled = Math.round(ratio * width);
  return '█'.repeat(filled) + dim('░'.repeat(width - filled));
}
