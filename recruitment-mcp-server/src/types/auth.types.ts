/**
 * Authentication types for OAuth 2.0 integration
 */

export interface AuthenticatedUser {
  user_id: number;
  email: string;
  name: string;
  role: 'admin' | 'recruiter' | 'viewer';
}

export interface OAuthSession {
  user: AuthenticatedUser;
  accessToken: string;
  expiresAt?: number;
}

export interface IntrospectResponse {
  active: boolean;
  user_id?: number;
  email?: string;
  name?: string;
  role?: string;
  scope?: string[];
  client_id?: string;
  exp?: number;
}

export interface MCPServerOptions {
  user?: AuthenticatedUser;
  accessToken?: string;
}
