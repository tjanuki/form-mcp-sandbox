/**
 * Input Sanitization Layer
 *
 * Provides sanitization utilities for user inputs before sending to the Laravel API.
 * This layer defends against XSS, script injection, and malformed input at the MCP boundary.
 */

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

/**
 * Regex patterns for dangerous content
 */
const PATTERNS = {
  // Script tags and event handlers
  SCRIPT_TAGS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  EVENT_HANDLERS: /\s*on\w+\s*=\s*["'][^"']*["']/gi,
  JAVASCRIPT_PROTOCOL: /javascript\s*:/gi,
  DATA_PROTOCOL: /data\s*:\s*text\/html/gi,

  // Control characters (except newline, tab, carriage return)
  CONTROL_CHARS: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,

  // Null bytes
  NULL_BYTES: /\x00/g,

  // Multiple spaces (normalize to single space, preserving newlines)
  MULTIPLE_SPACES: /[^\S\n]+/g,

  // HTML tags for stripping
  HTML_TAGS: /<[^>]*>/g,
};

/**
 * Options for string sanitization
 */
export interface SanitizeStringOptions {
  /** Trim leading/trailing whitespace (default: true) */
  trim?: boolean;
  /** Remove HTML tags entirely (default: false) */
  stripHtml?: boolean;
  /** Escape HTML entities (default: true) */
  escapeHtml?: boolean;
  /** Maximum length to truncate to (default: no limit) */
  maxLength?: number;
  /** Normalize Unicode to NFC form (default: true) */
  normalizeUnicode?: boolean;
  /** Allow newlines in the string (default: true) */
  allowNewlines?: boolean;
}

const DEFAULT_OPTIONS: Required<SanitizeStringOptions> = {
  trim: true,
  stripHtml: false,
  escapeHtml: true,
  maxLength: 0, // 0 means no limit
  normalizeUnicode: true,
  allowNewlines: true,
};

/**
 * Sanitize a string value
 */
export function sanitizeString(
  input: string,
  options: SanitizeStringOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let result = input;

  // Remove null bytes first (always)
  result = result.replace(PATTERNS.NULL_BYTES, '');

  // Remove control characters (preserving newlines and tabs if allowed)
  result = result.replace(PATTERNS.CONTROL_CHARS, '');

  // Normalize Unicode
  if (opts.normalizeUnicode) {
    result = result.normalize('NFC');
  }

  // Remove dangerous patterns
  result = result.replace(PATTERNS.SCRIPT_TAGS, '');
  result = result.replace(PATTERNS.EVENT_HANDLERS, '');
  result = result.replace(PATTERNS.JAVASCRIPT_PROTOCOL, '');
  result = result.replace(PATTERNS.DATA_PROTOCOL, '');

  // Strip or escape HTML
  if (opts.stripHtml) {
    result = result.replace(PATTERNS.HTML_TAGS, '');
  } else if (opts.escapeHtml) {
    result = escapeHtml(result);
  }

  // Normalize whitespace
  if (!opts.allowNewlines) {
    result = result.replace(/\n/g, ' ');
  }
  result = result.replace(PATTERNS.MULTIPLE_SPACES, ' ');

  // Trim
  if (opts.trim) {
    result = result.trim();
  }

  // Truncate if needed
  if (opts.maxLength > 0 && result.length > opts.maxLength) {
    result = result.slice(0, opts.maxLength);
  }

  return result;
}

/**
 * Escape HTML entities in a string
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a search query (more lenient, preserves special chars for search)
 */
export function sanitizeSearchQuery(input: string): string {
  return sanitizeString(input, {
    trim: true,
    stripHtml: true,
    escapeHtml: false,
    maxLength: 200,
    allowNewlines: false,
  });
}

/**
 * Sanitize a title or short text field
 */
export function sanitizeTitle(input: string): string {
  return sanitizeString(input, {
    trim: true,
    stripHtml: true,
    escapeHtml: false, // Laravel will handle escaping on output
    maxLength: 255,
    allowNewlines: false,
  });
}

/**
 * Sanitize a description or long text field
 */
export function sanitizeDescription(input: string): string {
  return sanitizeString(input, {
    trim: true,
    stripHtml: true,
    escapeHtml: false, // Laravel will handle escaping on output
    maxLength: 10000,
    allowNewlines: true,
  });
}

/**
 * Sanitize a date string (ISO format validation)
 */
export function sanitizeDateString(input: string): string {
  const sanitized = sanitizeString(input, {
    trim: true,
    stripHtml: true,
    escapeHtml: false,
    maxLength: 30,
    allowNewlines: false,
  });

  // Validate ISO date format (YYYY-MM-DD or ISO 8601)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
  if (!isoDateRegex.test(sanitized)) {
    throw new Error(`Invalid date format: ${sanitized}. Expected ISO 8601 format (YYYY-MM-DD)`);
  }

  return sanitized;
}

/**
 * Recursively sanitize all string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizeStringOptions = {}
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value, options);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item, options)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>, options)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Create a Zod transform function for sanitizing strings
 */
export function zodSanitize(options: SanitizeStringOptions = {}) {
  return (val: string) => sanitizeString(val, options);
}

/**
 * Create a Zod transform for titles
 */
export function zodSanitizeTitle() {
  return (val: string) => sanitizeTitle(val);
}

/**
 * Create a Zod transform for descriptions
 */
export function zodSanitizeDescription() {
  return (val: string) => sanitizeDescription(val);
}

/**
 * Create a Zod transform for search queries
 */
export function zodSanitizeSearch() {
  return (val: string) => sanitizeSearchQuery(val);
}

/**
 * Create a Zod transform for date strings with validation
 */
export function zodSanitizeDate() {
  return (val: string) => sanitizeDateString(val);
}
