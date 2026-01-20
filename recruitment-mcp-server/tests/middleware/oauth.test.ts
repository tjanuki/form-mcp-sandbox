import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { Request } from 'express';
import {
  extractBearerToken,
  validateOAuthToken,
  invalidateToken,
  clearTokenCache,
} from '../../src/middleware/oauth.js';
import {
  mockAdminUser,
  mockValidIntrospectResponse,
  mockInactiveIntrospectResponse,
  mockIntrospectResponseWithoutRole,
  mockIntrospectResponseMissingFields,
  mockValidToken,
} from '../fixtures/users.js';

describe('OAuth Middleware', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    clearTokenCache();
    vi.stubEnv('LARAVEL_API_URL', 'http://localhost:8000');
  });

  afterEach(() => {
    mockAxios.reset();
    mockAxios.restore();
    clearTokenCache();
    vi.unstubAllEnvs();
  });

  describe('extractBearerToken', () => {
    it('should extract valid bearer token', () => {
      const req = {
        headers: {
          authorization: 'Bearer my-token-123',
        },
      } as Request;

      const token = extractBearerToken(req);

      expect(token).toBe('my-token-123');
    });

    it('should return null when no authorization header', () => {
      const req = {
        headers: {},
      } as Request;

      const token = extractBearerToken(req);

      expect(token).toBeNull();
    });

    it('should return null for non-Bearer scheme', () => {
      const req = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
      } as Request;

      const token = extractBearerToken(req);

      expect(token).toBeNull();
    });

    it('should handle case-insensitive Bearer scheme', () => {
      const req = {
        headers: {
          authorization: 'BEARER my-token',
        },
      } as Request;

      const token = extractBearerToken(req);

      expect(token).toBe('my-token');
    });

    it('should return null for malformed authorization header', () => {
      const req = {
        headers: {
          authorization: 'Bearer',
        },
      } as Request;

      const token = extractBearerToken(req);

      expect(token).toBeNull();
    });

    it('should return null for header with extra parts', () => {
      const req = {
        headers: {
          authorization: 'Bearer token extra',
        },
      } as Request;

      const token = extractBearerToken(req);

      expect(token).toBeNull();
    });
  });

  describe('validateOAuthToken', () => {
    it('should return user for valid token', async () => {
      mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(200, mockValidIntrospectResponse);

      const user = await validateOAuthToken(mockValidToken);

      expect(user).toEqual({
        user_id: mockValidIntrospectResponse.user_id,
        email: mockValidIntrospectResponse.email,
        name: mockValidIntrospectResponse.name,
        role: mockValidIntrospectResponse.role,
      });
    });

    it('should return null for inactive token', async () => {
      mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(200, mockInactiveIntrospectResponse);

      const user = await validateOAuthToken('inactive-token');

      expect(user).toBeNull();
    });

    it('should return null when required user fields are missing', async () => {
      mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(200, mockIntrospectResponseMissingFields);

      const user = await validateOAuthToken('missing-fields-token');

      expect(user).toBeNull();
    });

    it('should default role to viewer when not provided', async () => {
      mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(200, mockIntrospectResponseWithoutRole);

      const user = await validateOAuthToken('no-role-token');

      expect(user).not.toBeNull();
      expect(user?.role).toBe('viewer');
    });

    it('should send token in request body', async () => {
      mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.token).toBe('test-token');
        return [200, mockValidIntrospectResponse];
      });

      await validateOAuthToken('test-token');
    });

    describe('caching', () => {
      it('should cache valid token', async () => {
        mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').replyOnce(200, mockValidIntrospectResponse);

        // First call - hits API
        const user1 = await validateOAuthToken(mockValidToken);
        expect(user1).not.toBeNull();

        // Second call - should use cache
        const user2 = await validateOAuthToken(mockValidToken);
        expect(user2).not.toBeNull();
        expect(user2).toEqual(user1);

        // Only one API call should have been made
        expect(mockAxios.history.post.length).toBe(1);
      });

      it('should remove inactive token from cache', async () => {
        // First, cache a valid token
        mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').replyOnce(200, mockValidIntrospectResponse);
        await validateOAuthToken(mockValidToken);

        // Now the token becomes inactive
        mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').replyOnce(200, mockInactiveIntrospectResponse);

        // Manually clear cache to simulate TTL expiration
        clearTokenCache();

        const user = await validateOAuthToken(mockValidToken);
        expect(user).toBeNull();
      });

      it('should respect token expiration from exp claim', async () => {
        vi.useFakeTimers();

        const shortLivedResponse = {
          ...mockValidIntrospectResponse,
          exp: Math.floor(Date.now() / 1000) + 10, // expires in 10 seconds
        };

        mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(200, shortLivedResponse);

        // First call
        await validateOAuthToken('short-lived-token');
        expect(mockAxios.history.post.length).toBe(1);

        // Advance time past expiration
        vi.advanceTimersByTime(15000);

        // Second call should hit API again
        await validateOAuthToken('short-lived-token');
        expect(mockAxios.history.post.length).toBe(2);

        vi.useRealTimers();
      });
    });

    describe('error handling', () => {
      it('should return null on network error', async () => {
        mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').networkError();

        const user = await validateOAuthToken('network-error-token');

        expect(user).toBeNull();
      });

      it('should return null on timeout', async () => {
        mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').timeout();

        const user = await validateOAuthToken('timeout-token');

        expect(user).toBeNull();
      });

      it('should return null on HTTP error (401)', async () => {
        mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(401, {
          error: 'Unauthorized',
        });

        const user = await validateOAuthToken('unauthorized-token');

        expect(user).toBeNull();
      });

      it('should return null on HTTP error (500)', async () => {
        mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(500, {
          error: 'Internal server error',
        });

        const user = await validateOAuthToken('server-error-token');

        expect(user).toBeNull();
      });
    });
  });

  describe('invalidateToken', () => {
    it('should remove token from cache', async () => {
      // First, cache a token
      mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(200, mockValidIntrospectResponse);
      await validateOAuthToken(mockValidToken);
      expect(mockAxios.history.post.length).toBe(1);

      // Invalidate the token
      invalidateToken(mockValidToken);

      // Next validation should hit API again
      await validateOAuthToken(mockValidToken);
      expect(mockAxios.history.post.length).toBe(2);
    });

    it('should not throw when invalidating non-cached token', () => {
      expect(() => invalidateToken('non-existent-token')).not.toThrow();
    });
  });

  describe('clearTokenCache', () => {
    it('should clear all cached tokens', async () => {
      // Cache multiple tokens
      mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(200, mockValidIntrospectResponse);

      await validateOAuthToken('token-1');
      await validateOAuthToken('token-2');
      await validateOAuthToken('token-3');

      // Each unique token makes one API call
      expect(mockAxios.history.post.length).toBe(3);

      // Clear cache
      clearTokenCache();

      // All tokens should need revalidation
      await validateOAuthToken('token-1');
      await validateOAuthToken('token-2');
      await validateOAuthToken('token-3');

      expect(mockAxios.history.post.length).toBe(6);
    });
  });

  describe('environment configuration', () => {
    it('should use custom LARAVEL_API_URL', async () => {
      vi.stubEnv('LARAVEL_API_URL', 'http://custom-api.example.com');

      mockAxios.onPost('http://custom-api.example.com/api/oauth/token/introspect').reply(200, mockValidIntrospectResponse);

      const user = await validateOAuthToken(mockValidToken);

      expect(user).not.toBeNull();
      expect(mockAxios.history.post[0].url).toBe('http://custom-api.example.com/api/oauth/token/introspect');
    });

    it('should use default URL when env not set', async () => {
      vi.stubEnv('LARAVEL_API_URL', '');

      mockAxios.onPost('http://localhost:8000/api/oauth/token/introspect').reply(200, mockValidIntrospectResponse);

      await validateOAuthToken(mockValidToken);

      expect(mockAxios.history.post[0].url).toBe('http://localhost:8000/api/oauth/token/introspect');
    });
  });
});
