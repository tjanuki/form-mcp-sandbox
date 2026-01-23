/**
 * OAuth 2.0 middleware for MCP server
 * Validates Bearer tokens via Laravel's introspection endpoint
 */

import axios from 'axios';
import type { Request } from 'express';
import type { AuthenticatedUser, IntrospectResponse } from '../types/auth.types.js';

// Token cache to reduce API calls (5 minute TTL)
interface CachedToken {
  token: string;
  user: AuthenticatedUser;
  expiresAt: number;
  refreshThreshold: number; // Refresh when this time is reached
}

const tokenCache = new Map<string, CachedToken>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const REFRESH_BUFFER_MS = 60 * 1000; // Start refreshing 1 minute before expiry

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Introspect a token via Laravel's endpoint
 * Internal helper for both validation and refresh
 */
async function introspectToken(token: string): Promise<IntrospectResponse | null> {
  const laravelUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000';
  const introspectUrl = `${laravelUrl}/api/oauth/token/introspect`;

  try {
    const response = await axios.post<IntrospectResponse>(
      introspectUrl,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`   OAuth: Introspect failed with status ${error.response.status}`);
      } else if (error.request) {
        console.error('   OAuth: Laravel introspect endpoint unreachable');
      }
    } else {
      console.error('   OAuth: Unexpected error during token validation:', error);
    }
    return null;
  }
}

/**
 * Proactively refresh a token that is approaching expiry
 * Returns true if refresh was successful, false otherwise
 */
async function refreshTokenIfNeeded(cachedToken: CachedToken): Promise<boolean> {
  const now = Date.now();

  // Token is still valid and not yet at refresh threshold
  if (now < cachedToken.refreshThreshold) {
    return true;
  }

  // Token is past refresh threshold but still valid - proactively refresh
  if (now < cachedToken.expiresAt) {
    console.log('   OAuth: Proactively refreshing token before expiry');
    const data = await introspectToken(cachedToken.token);

    if (data && data.active && data.user_id && data.email && data.name) {
      const user: AuthenticatedUser = {
        user_id: data.user_id,
        email: data.email,
        name: data.name,
        role: (data.role as AuthenticatedUser['role']) || 'viewer',
      };

      const expiresAt = data.exp
        ? Math.min(data.exp * 1000, Date.now() + CACHE_TTL_MS)
        : Date.now() + CACHE_TTL_MS;

      const refreshThreshold = calculateRefreshThreshold(expiresAt);

      tokenCache.set(cachedToken.token, {
        token: cachedToken.token,
        user,
        expiresAt,
        refreshThreshold,
      });

      console.log('   OAuth: Token refreshed successfully');
      return true;
    }

    // Refresh failed but token might still be valid - keep using cached
    if (now < cachedToken.expiresAt) {
      console.log('   OAuth: Refresh failed, using existing cached token');
      return true;
    }
  }

  // Token has expired
  tokenCache.delete(cachedToken.token);
  return false;
}

/**
 * Calculate when to start refreshing a token
 * Refreshes 1 minute before expiry, or at 80% of TTL, whichever is earlier
 */
function calculateRefreshThreshold(expiresAt: number): number {
  const now = Date.now();
  const ttl = expiresAt - now;
  const eightyPercentTtl = now + ttl * 0.8;
  const oneMinuteBefore = expiresAt - REFRESH_BUFFER_MS;

  return Math.min(eightyPercentTtl, oneMinuteBefore);
}

/**
 * Validate an OAuth token via Laravel's introspection endpoint
 * Returns user info if valid, null if invalid
 */
export async function validateOAuthToken(token: string): Promise<AuthenticatedUser | null> {
  // Check cache first
  const cached = tokenCache.get(token);
  if (cached) {
    const now = Date.now();

    // Token is expired
    if (now >= cached.expiresAt) {
      console.log('   OAuth: Cached token has expired');
      tokenCache.delete(token);
    } else if (now >= cached.refreshThreshold) {
      // Token is approaching expiry, proactively refresh
      const refreshed = await refreshTokenIfNeeded(cached);
      if (refreshed) {
        const updatedCached = tokenCache.get(token);
        if (updatedCached) {
          console.log('   OAuth: Using refreshed cached token');
          return updatedCached.user;
        }
      }
      // If refresh failed and token expired, continue to full validation
    } else {
      // Token is still fresh
      console.log('   OAuth: Using cached token validation');
      return cached.user;
    }
  }

  console.log('   OAuth: Validating token via Laravel introspect...');
  const data = await introspectToken(token);

  if (!data) {
    return null;
  }

  if (!data.active) {
    console.log('   OAuth: Token is not active');
    tokenCache.delete(token);
    return null;
  }

  if (!data.user_id || !data.email || !data.name) {
    console.log('   OAuth: Token missing required user fields');
    return null;
  }

  const user: AuthenticatedUser = {
    user_id: data.user_id,
    email: data.email,
    name: data.name,
    role: (data.role as AuthenticatedUser['role']) || 'viewer',
  };

  // Cache the validated token
  const expiresAt = data.exp
    ? Math.min(data.exp * 1000, Date.now() + CACHE_TTL_MS)
    : Date.now() + CACHE_TTL_MS;

  const refreshThreshold = calculateRefreshThreshold(expiresAt);

  tokenCache.set(token, { token, user, expiresAt, refreshThreshold });
  console.log(`   OAuth: Token valid for user ${user.email} (${user.role})`);

  return user;
}

/**
 * Clear a token from cache (e.g., on logout or revocation)
 */
export function invalidateToken(token: string): void {
  tokenCache.delete(token);
}

/**
 * Clear all cached tokens
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}
