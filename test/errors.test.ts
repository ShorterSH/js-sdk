import { describe, it, expect } from 'vitest';
import {
  ShorterError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
  NetworkError,
  mapStatusToError,
} from '../src/errors.js';

describe('Error classes', () => {
  it('ShorterError has correct properties', () => {
    const err = new ShorterError('test', 400, 'TEST');
    expect(err.message).toBe('test');
    expect(err.status).toBe(400);
    expect(err.code).toBe('TEST');
    expect(err.name).toBe('ShorterError');
    expect(err).toBeInstanceOf(Error);
  });

  it('ValidationError defaults', () => {
    const err = new ValidationError('bad input');
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.name).toBe('ValidationError');
    expect(err).toBeInstanceOf(ShorterError);
  });

  it('AuthenticationError', () => {
    const err = new AuthenticationError('no key', 'INVALID_API_KEY');
    expect(err.status).toBe(401);
    expect(err.code).toBe('INVALID_API_KEY');
  });

  it('ForbiddenError', () => {
    const err = new ForbiddenError('suspended', 'ACCOUNT_SUSPENDED');
    expect(err.status).toBe(403);
    expect(err.code).toBe('ACCOUNT_SUSPENDED');
  });

  it('NotFoundError', () => {
    const err = new NotFoundError('not found');
    expect(err.status).toBe(404);
  });

  it('RateLimitError', () => {
    const err = new RateLimitError('slow down');
    expect(err.status).toBe(429);
  });

  it('ServerError', () => {
    const err = new ServerError('oops');
    expect(err.status).toBe(500);
  });

  it('NetworkError has status 0', () => {
    const err = new NetworkError('DNS failed');
    expect(err.status).toBe(0);
    expect(err.code).toBe('NETWORK_ERROR');
  });
});

describe('mapStatusToError', () => {
  it('maps 400 → ValidationError', () => {
    expect(mapStatusToError(400, 'bad', 'INVALID_URL')).toBeInstanceOf(ValidationError);
  });
  it('maps 401 → AuthenticationError', () => {
    expect(mapStatusToError(401, 'auth', 'INVALID_API_KEY')).toBeInstanceOf(AuthenticationError);
  });
  it('maps 403 → ForbiddenError', () => {
    expect(mapStatusToError(403, 'no', 'FORBIDDEN')).toBeInstanceOf(ForbiddenError);
  });
  it('maps 404 → NotFoundError', () => {
    expect(mapStatusToError(404, 'gone', 'NOT_FOUND')).toBeInstanceOf(NotFoundError);
  });
  it('maps 429 → RateLimitError', () => {
    expect(mapStatusToError(429, 'slow', 'RATE_LIMITED')).toBeInstanceOf(RateLimitError);
  });
  it('maps 500 → ServerError', () => {
    expect(mapStatusToError(500, 'error', 'CREATION_FAILED')).toBeInstanceOf(ServerError);
  });
  it('maps 502 → ServerError', () => {
    expect(mapStatusToError(502, 'error', 'UNKNOWN')).toBeInstanceOf(ServerError);
  });
  it('maps unknown status → ShorterError', () => {
    const err = mapStatusToError(418, 'teapot', 'TEAPOT');
    expect(err).toBeInstanceOf(ShorterError);
    expect(err.status).toBe(418);
  });
});
