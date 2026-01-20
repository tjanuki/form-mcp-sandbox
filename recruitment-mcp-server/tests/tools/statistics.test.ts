import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getRecruitmentStatisticsSchema,
  getRecruitmentStatistics,
} from '../../src/tools/statistics.js';
import type { LaravelApiClient } from '../../src/services/laravelApiClient.js';
import { mockStatistics } from '../fixtures/statistics.js';
import { mockAdminUser, mockRecruiterUser } from '../fixtures/users.js';

describe('Statistics Tools', () => {
  let mockApiClient: {
    getStatistics: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockApiClient = {
      getStatistics: vi.fn(),
    };
  });

  describe('Schema Validation', () => {
    describe('getRecruitmentStatisticsSchema', () => {
      it('should accept empty params', () => {
        const result = getRecruitmentStatisticsSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should accept date_from param', () => {
        const result = getRecruitmentStatisticsSchema.safeParse({
          date_from: '2025-01-01',
        });
        expect(result.success).toBe(true);
      });

      it('should accept date_to param', () => {
        const result = getRecruitmentStatisticsSchema.safeParse({
          date_to: '2025-12-31',
        });
        expect(result.success).toBe(true);
      });

      it('should accept both date params', () => {
        const result = getRecruitmentStatisticsSchema.safeParse({
          date_from: '2025-01-01',
          date_to: '2025-12-31',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date_from).toBe('2025-01-01');
          expect(result.data.date_to).toBe('2025-12-31');
        }
      });
    });
  });

  describe('getRecruitmentStatistics', () => {
    it('should return formatted statistics', async () => {
      mockApiClient.getStatistics.mockResolvedValue(mockStatistics);

      const result = await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        {}
      );

      expect(result.structuredContent.total_recruitments).toBe(10);
      expect(result.structuredContent.total_applications).toBe(45);
      expect(result.structuredContent.by_status).toBeDefined();
    });

    it('should return text content with summary', async () => {
      mockApiClient.getStatistics.mockResolvedValue(mockStatistics);

      const result = await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        {}
      );

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Recruitment Statistics');
      expect(result.content[0].text).toContain('Total recruitments: 10');
      expect(result.content[0].text).toContain('Total applications: 45');
    });

    it('should include status breakdown in text', async () => {
      mockApiClient.getStatistics.mockResolvedValue(mockStatistics);

      const result = await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        {}
      );

      expect(result.content[0].text).toContain('By status:');
      expect(result.content[0].text).toContain('draft: 2');
      expect(result.content[0].text).toContain('published: 5');
    });

    it('should add created_by filter for non-admin users', async () => {
      mockApiClient.getStatistics.mockResolvedValue(mockStatistics);

      await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        {},
        { user: mockRecruiterUser }
      );

      expect(mockApiClient.getStatistics).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: mockRecruiterUser.user_id })
      );
    });

    it('should not add created_by filter for admin users', async () => {
      mockApiClient.getStatistics.mockResolvedValue(mockStatistics);

      await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        {},
        { user: mockAdminUser }
      );

      expect(mockApiClient.getStatistics).toHaveBeenCalledWith(
        expect.not.objectContaining({ created_by: expect.any(Number) })
      );
    });

    it('should pass date params to API', async () => {
      mockApiClient.getStatistics.mockResolvedValue(mockStatistics);

      await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        { date_from: '2025-01-01', date_to: '2025-06-30' }
      );

      expect(mockApiClient.getStatistics).toHaveBeenCalledWith({
        date_from: '2025-01-01',
        date_to: '2025-06-30',
      });
    });

    it('should combine date params with user filter', async () => {
      mockApiClient.getStatistics.mockResolvedValue(mockStatistics);

      await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        { date_from: '2025-01-01' },
        { user: mockRecruiterUser }
      );

      expect(mockApiClient.getStatistics).toHaveBeenCalledWith({
        date_from: '2025-01-01',
        created_by: mockRecruiterUser.user_id,
      });
    });

    it('should handle empty by_status', async () => {
      const emptyStats = {
        ...mockStatistics,
        by_status: {},
      };
      mockApiClient.getStatistics.mockResolvedValue(emptyStats);

      const result = await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        {}
      );

      expect(result.structuredContent.by_status).toEqual({});
    });

    it('should work without user context', async () => {
      mockApiClient.getStatistics.mockResolvedValue(mockStatistics);

      const result = await getRecruitmentStatistics(
        mockApiClient as unknown as LaravelApiClient,
        {}
      );

      expect(mockApiClient.getStatistics).toHaveBeenCalledWith({});
      expect(result.structuredContent.total_recruitments).toBe(10);
    });
  });
});
