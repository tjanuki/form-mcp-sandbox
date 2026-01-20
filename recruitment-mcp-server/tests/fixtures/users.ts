import type { AuthenticatedUser, IntrospectResponse } from '../../src/types/auth.types.js';

export const mockAdminUser: AuthenticatedUser = {
  user_id: 1,
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
};

export const mockRecruiterUser: AuthenticatedUser = {
  user_id: 2,
  email: 'recruiter@example.com',
  name: 'Recruiter User',
  role: 'recruiter',
};

export const mockViewerUser: AuthenticatedUser = {
  user_id: 3,
  email: 'viewer@example.com',
  name: 'Viewer User',
  role: 'viewer',
};

export const mockValidIntrospectResponse: IntrospectResponse = {
  active: true,
  user_id: 1,
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  scope: ['read', 'write'],
  client_id: 'mcp-client',
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

export const mockInactiveIntrospectResponse: IntrospectResponse = {
  active: false,
};

export const mockIntrospectResponseWithoutRole: IntrospectResponse = {
  active: true,
  user_id: 2,
  email: 'user@example.com',
  name: 'No Role User',
};

export const mockIntrospectResponseMissingFields: IntrospectResponse = {
  active: true,
  user_id: 1,
  // missing email and name
};

export const mockValidToken = 'valid-bearer-token-123';
export const mockInvalidToken = 'invalid-token';
export const mockExpiredToken = 'expired-token';
