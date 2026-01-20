import { vi, beforeEach, afterEach } from 'vitest';

// Set up environment variables for testing
vi.stubEnv('LARAVEL_API_URL', 'http://localhost:8000');
vi.stubEnv('LARAVEL_API_TOKEN', 'test-api-token');

// Silence console.log and console.error during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
