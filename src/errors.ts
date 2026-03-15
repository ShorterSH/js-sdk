export class ShorterError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ShorterError';
    this.status = status;
    this.code = code;
  }
}

export class ValidationError extends ShorterError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ShorterError {
  constructor(message: string, code: string = 'AUTH_REQUIRED') {
    super(message, 401, code);
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends ShorterError {
  constructor(message: string, code: string = 'FORBIDDEN') {
    super(message, 403, code);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ShorterError {
  constructor(message: string, code: string = 'NOT_FOUND') {
    super(message, 404, code);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ShorterError {
  constructor(message: string, code: string = 'RATE_LIMITED') {
    super(message, 429, code);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends ShorterError {
  constructor(message: string, code: string = 'SERVER_ERROR') {
    super(message, 500, code);
    this.name = 'ServerError';
  }
}

export class NetworkError extends ShorterError {
  constructor(message: string) {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export function mapStatusToError(status: number, message: string, code: string): ShorterError {
  switch (status) {
    case 400: return new ValidationError(message, code);
    case 401: return new AuthenticationError(message, code);
    case 403: return new ForbiddenError(message, code);
    case 404: return new NotFoundError(message, code);
    case 429: return new RateLimitError(message, code);
    default:
      if (status >= 500) return new ServerError(message, code);
      return new ShorterError(message, status, code);
  }
}
