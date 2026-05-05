import { ValidationError } from './errors.js';

export const API_KEY_RE = /^sk_[a-f0-9]{64}$/;
export const SHORT_CODE_RE = /^[a-zA-Z0-9]{6}$/;

export function isValidApiKey(apiKey: string): boolean {
  return API_KEY_RE.test(apiKey);
}

export function assertShortCode(shortCode: string): string {
  if (!SHORT_CODE_RE.test(shortCode)) {
    throw new ValidationError('Invalid short code format. Short codes must be 6 alphanumeric characters.', 'INVALID_SHORT_CODE');
  }
  return shortCode;
}

export function assertPositiveInt(
  value: unknown,
  field: string,
  { max }: { max?: number } = {}
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a positive integer`, 'INVALID_PAGINATION');
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(`${field} must be <= ${max}`, 'INVALID_PAGINATION');
  }
  return value;
}
