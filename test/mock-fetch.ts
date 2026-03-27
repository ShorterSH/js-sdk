interface MockResponse {
  status?: number;
  body: Record<string, unknown> | string;
}

interface MockCall {
  url: string;
  init?: RequestInit;
}

export function createMockFetch(responses: MockResponse | MockResponse[]) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  const calls: MockCall[] = [];

  const mockFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });

    const mock = queue.length > 1 ? queue.shift()! : queue[0];
    const status = mock.status ?? 200;

    return new Response(typeof mock.body === 'string' ? mock.body : JSON.stringify(mock.body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return { fetch: mockFetch as typeof globalThis.fetch, calls };
}
