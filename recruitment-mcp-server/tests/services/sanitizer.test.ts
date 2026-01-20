import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  escapeHtml,
  sanitizeSearchQuery,
  sanitizeTitle,
  sanitizeDescription,
  sanitizeDateString,
  sanitizeObject,
  zodSanitize,
  zodSanitizeTitle,
  zodSanitizeDescription,
  zodSanitizeSearch,
  zodSanitizeDate,
} from '../../src/services/sanitizer.js';
import { z } from 'zod';

describe('sanitizer', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace by default', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\x00world')).toBe('helloworld');
    });

    it('should remove control characters', () => {
      expect(sanitizeString('hello\x01\x02\x03world')).toBe('helloworld');
    });

    it('should preserve newlines by default', () => {
      expect(sanitizeString('hello\nworld')).toBe('hello\nworld');
    });

    it('should remove newlines when allowNewlines is false', () => {
      expect(sanitizeString('hello\nworld', { allowNewlines: false })).toBe('hello world');
    });

    it('should normalize multiple spaces to single space', () => {
      expect(sanitizeString('hello    world')).toBe('hello world');
    });

    it('should escape HTML entities by default', () => {
      // Note: script tags are removed first, then remaining content is escaped
      expect(sanitizeString('<b>hello</b> & "world"')).toBe(
        '&lt;b&gt;hello&lt;/b&gt; &amp; &quot;world&quot;'
      );
    });

    it('should remove script tags before escaping', () => {
      // Script tags are removed entirely, leaving nothing to escape
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('');
    });

    it('should strip HTML tags when stripHtml is true', () => {
      expect(sanitizeString('<b>hello</b> <i>world</i>', { stripHtml: true })).toBe(
        'hello world'
      );
    });

    it('should remove script tags', () => {
      expect(
        sanitizeString('before<script>malicious()</script>after', { escapeHtml: false })
      ).toBe('beforeafter');
    });

    it('should remove event handlers', () => {
      expect(
        sanitizeString('<img onerror="alert(1)" src="x">', { escapeHtml: false })
      ).toBe('<img src="x">');
    });

    it('should remove javascript: protocol', () => {
      expect(
        sanitizeString('javascript:alert(1)', { escapeHtml: false })
      ).toBe('alert(1)');
    });

    it('should truncate to maxLength', () => {
      expect(sanitizeString('hello world', { maxLength: 5 })).toBe('hello');
    });

    it('should normalize Unicode to NFC', () => {
      // e + combining acute accent should become single character é
      const input = 'cafe\u0301'; // e + combining acute
      const result = sanitizeString(input);
      expect(result).toBe('café');
      expect(result.length).toBe(4);
    });

    it('should not trim when trim is false', () => {
      expect(sanitizeString('  hello  ', { trim: false, escapeHtml: false })).toBe(
        ' hello '
      );
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should escape less than', () => {
      expect(escapeHtml('a < b')).toBe('a &lt; b');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('a "b" c')).toBe('a &quot;b&quot; c');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("a 'b' c")).toBe('a &#x27;b&#x27; c');
    });

    it('should escape all entities in one string', () => {
      expect(escapeHtml('<a href="test">O\'Brien & Co</a>')).toBe(
        '&lt;a href=&quot;test&quot;&gt;O&#x27;Brien &amp; Co&lt;/a&gt;'
      );
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeSearchQuery('<b>engineer</b>')).toBe('engineer');
    });

    it('should truncate to 200 characters', () => {
      const longQuery = 'a'.repeat(300);
      expect(sanitizeSearchQuery(longQuery).length).toBe(200);
    });

    it('should remove newlines', () => {
      expect(sanitizeSearchQuery('hello\nworld')).toBe('hello world');
    });

    it('should preserve search operators', () => {
      expect(sanitizeSearchQuery('senior engineer')).toBe('senior engineer');
    });
  });

  describe('sanitizeTitle', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeTitle('<script>bad</script>Software Engineer')).toBe(
        'Software Engineer'
      );
    });

    it('should truncate to 255 characters', () => {
      const longTitle = 'a'.repeat(300);
      expect(sanitizeTitle(longTitle).length).toBe(255);
    });

    it('should remove newlines', () => {
      expect(sanitizeTitle('Software\nEngineer')).toBe('Software Engineer');
    });

    it('should handle normal titles', () => {
      expect(sanitizeTitle('Senior Software Engineer')).toBe('Senior Software Engineer');
    });
  });

  describe('sanitizeDescription', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeDescription('<p>We are looking for...</p>')).toBe(
        'We are looking for...'
      );
    });

    it('should truncate to 10000 characters', () => {
      const longDesc = 'a'.repeat(15000);
      expect(sanitizeDescription(longDesc).length).toBe(10000);
    });

    it('should preserve newlines', () => {
      expect(sanitizeDescription('Line 1\nLine 2\nLine 3')).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle multiline job descriptions', () => {
      const description = `We are looking for a talented engineer.

Requirements:
- 5+ years experience
- Strong communication skills

Benefits:
- Competitive salary
- Remote work`;
      expect(sanitizeDescription(description)).toBe(description);
    });
  });

  describe('sanitizeDateString', () => {
    it('should accept valid ISO date (YYYY-MM-DD)', () => {
      expect(sanitizeDateString('2024-12-31')).toBe('2024-12-31');
    });

    it('should accept valid ISO datetime', () => {
      expect(sanitizeDateString('2024-12-31T23:59:59')).toBe('2024-12-31T23:59:59');
    });

    it('should accept ISO datetime with milliseconds', () => {
      expect(sanitizeDateString('2024-12-31T23:59:59.999')).toBe(
        '2024-12-31T23:59:59.999'
      );
    });

    it('should accept ISO datetime with Z timezone', () => {
      expect(sanitizeDateString('2024-12-31T23:59:59Z')).toBe('2024-12-31T23:59:59Z');
    });

    it('should accept ISO datetime with offset timezone', () => {
      expect(sanitizeDateString('2024-12-31T23:59:59+09:00')).toBe(
        '2024-12-31T23:59:59+09:00'
      );
    });

    it('should reject invalid date format', () => {
      expect(() => sanitizeDateString('12/31/2024')).toThrow('Invalid date format');
    });

    it('should reject date with script injection', () => {
      expect(() => sanitizeDateString('<script>alert(1)</script>')).toThrow(
        'Invalid date format'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeDateString('  2024-12-31  ')).toBe('2024-12-31');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values in flat objects', () => {
      const input = {
        title: '  <b>Hello</b>  ',
        count: 42,
        active: true,
      };
      const result = sanitizeObject(input, { stripHtml: true, escapeHtml: false });
      expect(result).toEqual({
        title: 'Hello',
        count: 42,
        active: true,
      });
    });

    it('should sanitize nested objects', () => {
      const input = {
        outer: {
          inner: '  <script>bad</script>Good  ',
        },
      };
      const result = sanitizeObject(input, { stripHtml: true, escapeHtml: false });
      expect(result.outer.inner).toBe('Good');
    });

    it('should sanitize arrays of strings', () => {
      const input = {
        tags: ['  tag1  ', '  <b>tag2</b>  '],
      };
      const result = sanitizeObject(input, { stripHtml: true, escapeHtml: false });
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    it('should sanitize arrays of objects', () => {
      const input = {
        items: [{ name: '  <i>Item 1</i>  ' }, { name: '  Item 2  ' }],
      };
      const result = sanitizeObject(input, { stripHtml: true, escapeHtml: false });
      expect(result.items).toEqual([{ name: 'Item 1' }, { name: 'Item 2' }]);
    });

    it('should preserve null and undefined', () => {
      const input = {
        name: 'test',
        value: null,
        other: undefined,
      };
      const result = sanitizeObject(input);
      expect(result.value).toBeNull();
      expect(result.other).toBeUndefined();
    });
  });

  describe('Zod integration', () => {
    describe('zodSanitize', () => {
      it('should work as a Zod transform', () => {
        const schema = z.string().transform(zodSanitize());
        const result = schema.parse('  hello world  ');
        expect(result).toBe('hello world');
      });

      it('should accept custom options', () => {
        const schema = z.string().transform(zodSanitize({ maxLength: 5 }));
        const result = schema.parse('hello world');
        expect(result).toBe('hello');
      });
    });

    describe('zodSanitizeTitle', () => {
      it('should sanitize titles in Zod schema', () => {
        const schema = z.object({
          title: z.string().transform(zodSanitizeTitle()),
        });
        const result = schema.parse({ title: '  <b>Senior Engineer</b>  ' });
        expect(result.title).toBe('Senior Engineer');
      });
    });

    describe('zodSanitizeDescription', () => {
      it('should sanitize descriptions in Zod schema', () => {
        const schema = z.object({
          description: z.string().transform(zodSanitizeDescription()),
        });
        const result = schema.parse({
          description: '<p>Job description</p>\n\nMore details',
        });
        expect(result.description).toBe('Job description\n\nMore details');
      });
    });

    describe('zodSanitizeSearch', () => {
      it('should sanitize search queries in Zod schema', () => {
        const schema = z.object({
          query: z.string().transform(zodSanitizeSearch()),
        });
        const result = schema.parse({ query: '  <b>engineer</b>  ' });
        expect(result.query).toBe('engineer');
      });
    });

    describe('zodSanitizeDate', () => {
      it('should validate and sanitize dates in Zod schema', () => {
        const schema = z.object({
          deadline: z.string().transform(zodSanitizeDate()),
        });
        const result = schema.parse({ deadline: '  2024-12-31  ' });
        expect(result.deadline).toBe('2024-12-31');
      });

      it('should throw on invalid date in Zod schema', () => {
        const schema = z.object({
          deadline: z.string().transform(zodSanitizeDate()),
        });
        expect(() => schema.parse({ deadline: 'invalid' })).toThrow();
      });
    });
  });

  describe('XSS attack vectors', () => {
    // Test common XSS attack vectors that include HTML tags
    // Note: standalone strings like "' onclick=alert(1) '" are not XSS vectors
    // because they need to be rendered in an HTML attribute context to be dangerous
    const xssVectors = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<body onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      'javascript:alert(1)',
      '<a href="javascript:alert(1)">click</a>',
      '<div style="background:url(javascript:alert(1))">',
      '"><script>alert(1)</script>',
      '<script>document.write("<img src=x onerror=alert(1)>")</script>',
      '<scr<script>ipt>alert(1)</scr</script>ipt>',
      'data:text/html,<script>alert(1)</script>',
    ];

    it.each(xssVectors)('should neutralize XSS vector: %s', (vector) => {
      const sanitized = sanitizeString(vector, { stripHtml: true, escapeHtml: false });
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).not.toContain('onload=');
      expect(sanitized).not.toContain('onclick=');
      expect(sanitized).not.toContain('javascript:');
    });
  });
});
