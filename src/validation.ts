export const API_KEY_RE = /^sk_[a-f0-9]{64}$/;

export function isValidApiKey(apiKey: string): boolean {
  return API_KEY_RE.test(apiKey);
}
