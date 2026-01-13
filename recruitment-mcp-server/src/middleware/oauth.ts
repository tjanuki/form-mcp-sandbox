/**
 * OAuth 2.0 middleware for MCP server
 * Validates Bearer tokens via Laravel's introspection endpoint
 */

import axios from 'axios';
import type { Request } from 'express';
import type { AuthenticatedUser, IntrospectResponse } from '../types/auth.types.js';

// Token cache to reduce API calls (5 minute TTL)
const tokenCache = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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
 * Validate an OAuth token via Laravel's introspection endpoint
 * Returns user info if valid, null if invalid
 */
export async function validateOAuthToken(token: string): Promise<AuthenticatedUser | null> {
  // Check cache first
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('   OAuth: Using cached token validation');
    return cached.user;
  }

  const laravelUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000';
  const introspectUrl = `${laravelUrl}/api/oauth/token/introspect`;

  try {
    console.log('   OAuth: Validating token via Laravel introspect...');

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

    const data = response.data;

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

    tokenCache.set(token, { user, expiresAt });
    console.log(`   OAuth: Token valid for user ${user.email} (${user.role})`);

    return user;
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
