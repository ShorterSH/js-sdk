import { describe, it, expect } from 'vitest';
import { truncate, formatNumber } from '../../src/cli/output.js';

describe('output utilities', () => {
  it('truncate leaves short strings unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncate adds ellipsis for long strings', () => {
    expect(truncate('hello world', 8)).toBe('hello w…');
  });

  it('truncate handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('formatNumber adds separators', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formatNumber handles small numbers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
  });
});
