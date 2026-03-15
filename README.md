# shorter.sh

CLI and SDK for the [shorter.sh](https://shorter.sh) URL shortener. Zero runtime dependencies, Node >=18.

## Installation

```bash
npm install shorter.sh
```

## CLI

```bash
# First run will prompt for your API key
shorter https://example.com
# ✓ https://shorter.sh/xK9mP2
#   Copied to clipboard!

shorter list
shorter list --page 2 --limit 10

shorter delete xK9mP2
shorter delete xK9mP2 --yes

shorter analytics
shorter analytics xK9mP2
shorter analytics xK9mP2 --dimension country

shorter config set api-key sk_your_key_here
shorter config set base-url https://custom.domain
shorter config get api-key
shorter config path
```

### Options

| Flag | Description |
|------|-------------|
| `--no-copy` | Don't copy short URL to clipboard |
| `--yes` | Skip delete confirmation prompt |
| `--page N` | Page number for list |
| `--limit N` | Items per page for list |
| `--start DATE` | Analytics start date (ISO or timestamp) |
| `--end DATE` | Analytics end date (ISO or timestamp) |
| `--dimension DIM` | Analytics breakdown: `country`, `device_type`, `browser`, `os`, `referrer_domain`, `language` |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

### Aliases

- `shorter ls` → `shorter list`
- `shorter rm` → `shorter delete`
- `shorter stats` → `shorter analytics`

### Environment Variables

- `SHORTER_API_KEY` — API key (overrides config file)
- `SHORTER_BASE_URL` — Base URL (overrides config file)
- `NO_COLOR` — Disable colored output

## SDK

```typescript
import { ShorterClient } from 'shorter.sh';

const client = new ShorterClient({
  apiKey: 'sk_your_key_here',     // or set SHORTER_API_KEY env var
  baseUrl: 'https://shorter.sh',  // optional
});

// Shorten a URL
const { shortCode, shortUrl, originalUrl } = await client.shorten('https://example.com');

// List your URLs
const { urls, pagination, totalClicks } = await client.list({ page: 1, limit: 50 });

// Delete a URL
await client.delete('xK9mP2');

// Analytics overview
const overview = await client.analytics.overview({ start: '2024-01-01', end: '2024-01-31' });

// Per-URL analytics
const stats = await client.analytics.url('xK9mP2', { dimension: 'country' });

// Detailed analytics (all breakdowns)
const detail = await client.analytics.url('xK9mP2', { detail: true });
```

### Error Handling

```typescript
import { ShorterClient, ValidationError, RateLimitError, NetworkError } from 'shorter.sh';

try {
  await client.shorten('not-a-url');
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(err.message); // "Invalid URL"
    console.log(err.code);    // "INVALID_URL"
    console.log(err.status);  // 400
  }
}
```

Error classes: `ShorterError` (base), `ValidationError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `RateLimitError`, `ServerError`, `NetworkError`.

### Custom Fetch

```typescript
const client = new ShorterClient({
  apiKey: 'sk_...',
  fetch: myCustomFetch,  // inject for testing or custom behavior
});
```

## License

MIT
