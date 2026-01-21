/**
 * Centralized error types for the MCP server
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN_TOOL = 'UNKNOWN_TOOL',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',

  // API errors
  API_ERROR = 'API_ERROR',
  API_UNREACHABLE = 'API_UNREACHABLE',
  REQUEST_FAILED = 'REQUEST_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',

  // Configuration errors
  MISSING_CONFIG = 'MISSING_CONFIG',

  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class McpError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly statusCode?: number;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      statusCode?: number;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'McpError';
    this.code = code;
    this.details = options?.details;
    this.statusCode = options?.statusCode;

    // Maintains proper stack trace for where our error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, McpError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
    };
  }

  /**
   * Check if an error is an McpError
   */
  static isMcpError(error: unknown): error is McpError {
    return error instanceof McpError;
  }
}

/**
 * Factory functions for common error types
 */
export const Errors = {
  unauthorized: (message = 'Unauthorized', details?: Record<string, unknown>) =>
    new McpError(ErrorCode.UNAUTHORIZED, message, { statusCode: 401, details }),

  forbidden: (message = 'Forbidden', details?: Record<string, unknown>) =>
    new McpError(ErrorCode.FORBIDDEN, message, { statusCode: 403, details }),

  notFound: (resource: string, details?: Record<string, unknown>) =>
    new McpError(ErrorCode.NOT_FOUND, `Resource not found: ${resource}`, {
      statusCode: 404,
      details,
    }),

  unknownTool: (toolName: string) =>
    new McpError(ErrorCode.UNKNOWN_TOOL, `Unknown tool: ${toolName}`, {
      statusCode: 400,
      details: { toolName },
    }),

  validationFailed: (message: string, details?: Record<string, unknown>) =>
    new McpError(ErrorCode.VALIDATION_FAILED, message, {
      statusCode: 400,
      details,
    }),

  invalidInput: (field: string, message: string) =>
    new McpError(ErrorCode.INVALID_INPUT, message, {
      statusCode: 400,
      details: { field },
    }),

  apiError: (
    statusCode: number,
    message: string,
    details?: Record<string, unknown>
  ) =>
    new McpError(ErrorCode.API_ERROR, `Laravel API Error (${statusCode}): ${message}`, {
      statusCode,
      details,
    }),

  apiUnreachable: (cause?: Error) =>
    new McpError(
      ErrorCode.API_UNREACHABLE,
      'Laravel API is unreachable. Please check the server.',
      { statusCode: 503, cause }
    ),

  requestFailed: (message: string, cause?: Error) =>
    new McpError(ErrorCode.REQUEST_FAILED, `Request error: ${message}`, {
      statusCode: 500,
      cause,
    }),

  rateLimited: (retryAfter?: number) =>
    new McpError(ErrorCode.RATE_LIMITED, 'Too many requests, please try again later.', {
      statusCode: 429,
      details: retryAfter ? { retryAfter } : undefined,
    }),

  missingConfig: (configName: string) =>
    new McpError(
      ErrorCode.MISSING_CONFIG,
      `Missing required configuration: ${configName}`,
      { details: { configName } }
    ),

  internal: (message: string, cause?: Error) =>
    new McpError(ErrorCode.INTERNAL_ERROR, message, { statusCode: 500, cause }),
};
