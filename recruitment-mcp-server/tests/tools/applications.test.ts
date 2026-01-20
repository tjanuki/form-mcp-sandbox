import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listApplicationsSchema,
  listApplications,
} from '../../src/tools/applications.js';
import type { LaravelApiClient } from '../../src/services/laravelApiClient.js';
import { mockListApplicationsResponse, mockApplicationsList } from '../fixtures/applications.js';
import { mockRecruiterUser } from '../fixtures/users.js';

describe('Application Tools', () => {
  let mockApiClient: {
    listApplications: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockApiClient = {
      listApplications: vi.fn(),
    };
  });

  describe('Schema Validation', () => {
    describe('listApplicationsSchema', () => {
      it('should accept valid params with required recruitment_id', () => {
        const result = listApplicationsSchema.safeParse({
          recruitment_id: 1,
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid params with optional status', () => {
        const result = listApplicationsSchema.safeParse({
          recruitment_id: 1,
          status: 'pending',
        });
        expect(result.success).toBe(true);
      });

      it('should accept all valid status values', () => {
        const statuses = ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'];

        statuses.forEach((status) => {
          const result = listApplicationsSchema.safeParse({
            recruitment_id: 1,
            status,
          });
          expect(result.success).toBe(true);
        });
      });

      it('should reject missing recruitment_id', () => {
        const result = listApplicationsSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject invalid status', () => {
        const result = listApplicationsSchema.safeParse({
          recruitment_id: 1,
          status: 'invalid',
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-numeric recruitment_id', () => {
        const result = listApplicationsSchema.safeParse({
          recruitment_id: 'abc',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('listApplications', () => {
    it('should return formatted applications list', async () => {
      mockApiClient.listApplications.mockResolvedValue(mockListApplicationsResponse);

      const result = await listApplications(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.structuredContent.recruitment_id).toBe(1);
      expect(result.structuredContent.recruitment_title).toBe('Senior Software Engineer');
      expect(result.structuredContent.applications).toHaveLength(3);
      expect(result.structuredContent.total).toBe(3);
    });

    it('should format application data correctly', async () => {
      mockApiClient.listApplications.mockResolvedValue(mockListApplicationsResponse);

      const result = await listApplications(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      const application = result.structuredContent.applications[0];
      expect(application.id).toBe(1);
      expect(application.applicant_name).toBe('Taro Yamada');
      expect(application.applicant_email).toBe('taro@example.com');
      expect(application.status).toBe('pending');
      expect(application.applied_at).toBeDefined();
    });

    it('should return text content with summary', async () => {
      mockApiClient.listApplications.mockResolvedValue(mockListApplicationsResponse);

      const result = await listApplications(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Found 3 application(s)');
      expect(result.content[0].text).toContain('Senior Software Engineer');
      expect(result.content[0].text).toContain('Taro Yamada (pending)');
    });

    it('should pass params to API client', async () => {
      mockApiClient.listApplications.mockResolvedValue(mockListApplicationsResponse);

      await listApplications(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 5, status: 'reviewing' }
      );

      expect(mockApiClient.listApplications).toHaveBeenCalledWith({
        recruitment_id: 5,
        status: 'reviewing',
      });
    });

    it('should work with user context', async () => {
      mockApiClient.listApplications.mockResolvedValue(mockListApplicationsResponse);

      const result = await listApplications(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 },
        { user: mockRecruiterUser }
      );

      expect(result.structuredContent.applications).toHaveLength(3);
    });

    it('should handle empty applications list', async () => {
      mockApiClient.listApplications.mockResolvedValue({
        recruitment_id: 1,
        recruitment_title: 'No Applications Job',
        applications: [],
        total: 0,
      });

      const result = await listApplications(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.structuredContent.applications).toHaveLength(0);
      expect(result.structuredContent.total).toBe(0);
      expect(result.content[0].text).toContain('Found 0 application(s)');
    });
  });
});
