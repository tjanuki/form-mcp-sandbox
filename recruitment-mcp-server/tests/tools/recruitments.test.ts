import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listRecruitmentsSchema,
  getRecruitmentDetailsSchema,
  createRecruitmentSchema,
  updateRecruitmentSchema,
  deleteRecruitmentSchema,
  publishRecruitmentSchema,
  listRecruitments,
  getRecruitmentDetails,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
  publishRecruitment,
} from '../../src/tools/recruitments.js';
import type { LaravelApiClient } from '../../src/services/laravelApiClient.js';
import {
  mockRecruitment,
  mockPaginatedRecruitments,
  mockRecruitmentsList,
} from '../fixtures/recruitments.js';
import { mockAdminUser, mockRecruiterUser } from '../fixtures/users.js';

describe('Recruitment Tools', () => {
  let mockApiClient: {
    listRecruitments: ReturnType<typeof vi.fn>;
    getRecruitment: ReturnType<typeof vi.fn>;
    createRecruitment: ReturnType<typeof vi.fn>;
    updateRecruitment: ReturnType<typeof vi.fn>;
    deleteRecruitment: ReturnType<typeof vi.fn>;
    publishRecruitment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockApiClient = {
      listRecruitments: vi.fn(),
      getRecruitment: vi.fn(),
      createRecruitment: vi.fn(),
      updateRecruitment: vi.fn(),
      deleteRecruitment: vi.fn(),
      publishRecruitment: vi.fn(),
    };
  });

  describe('Schema Validation', () => {
    describe('listRecruitmentsSchema', () => {
      it('should accept valid params', () => {
        const result = listRecruitmentsSchema.safeParse({
          status: 'published',
          search: 'engineer',
          employment_type: 'full-time',
          limit: 20,
          page: 2,
        });
        expect(result.success).toBe(true);
      });

      it('should provide default values', () => {
        const result = listRecruitmentsSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(10);
          expect(result.data.page).toBe(1);
        }
      });

      it('should reject invalid status', () => {
        const result = listRecruitmentsSchema.safeParse({
          status: 'invalid',
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid employment_type', () => {
        const result = listRecruitmentsSchema.safeParse({
          employment_type: 'freelance',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('getRecruitmentDetailsSchema', () => {
      it('should accept valid recruitment_id', () => {
        const result = getRecruitmentDetailsSchema.safeParse({ recruitment_id: 1 });
        expect(result.success).toBe(true);
      });

      it('should reject missing recruitment_id', () => {
        const result = getRecruitmentDetailsSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject non-numeric recruitment_id', () => {
        const result = getRecruitmentDetailsSchema.safeParse({ recruitment_id: 'abc' });
        expect(result.success).toBe(false);
      });
    });

    describe('createRecruitmentSchema', () => {
      const validCreateData = {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        location: 'Tokyo',
        employment_type: 'full-time',
        description: 'Job description',
        requirements: 'Requirements',
        responsibilities: 'Responsibilities',
      };

      it('should accept valid create data', () => {
        const result = createRecruitmentSchema.safeParse(validCreateData);
        expect(result.success).toBe(true);
      });

      it('should default status to draft', () => {
        const result = createRecruitmentSchema.safeParse(validCreateData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe('draft');
        }
      });

      it('should accept optional fields', () => {
        const result = createRecruitmentSchema.safeParse({
          ...validCreateData,
          salary_min: 5000000,
          salary_max: 8000000,
          benefits: 'Great benefits',
          application_deadline: '2025-06-30',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing required fields', () => {
        const result = createRecruitmentSchema.safeParse({
          title: 'Software Engineer',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('updateRecruitmentSchema', () => {
      it('should accept valid update data', () => {
        const result = updateRecruitmentSchema.safeParse({
          recruitment_id: 1,
          updates: { title: 'New Title' },
        });
        expect(result.success).toBe(true);
      });

      it('should accept partial updates', () => {
        const result = updateRecruitmentSchema.safeParse({
          recruitment_id: 1,
          updates: { status: 'closed' },
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid status in updates', () => {
        const result = updateRecruitmentSchema.safeParse({
          recruitment_id: 1,
          updates: { status: 'invalid' },
        });
        expect(result.success).toBe(false);
      });
    });

    describe('deleteRecruitmentSchema', () => {
      it('should accept valid recruitment_id', () => {
        const result = deleteRecruitmentSchema.safeParse({ recruitment_id: 1 });
        expect(result.success).toBe(true);
      });
    });

    describe('publishRecruitmentSchema', () => {
      it('should accept valid recruitment_id', () => {
        const result = publishRecruitmentSchema.safeParse({ recruitment_id: 1 });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('listRecruitments', () => {
    it('should return formatted recruitment list', async () => {
      mockApiClient.listRecruitments.mockResolvedValue(mockPaginatedRecruitments);

      const result = await listRecruitments(
        mockApiClient as unknown as LaravelApiClient,
        { limit: 10, page: 1 }
      );

      expect(result.structuredContent.recruitments).toHaveLength(3);
      expect(result.structuredContent.total).toBe(3);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Found 3 recruitment(s)');
    });

    it('should format salary range when available', async () => {
      mockApiClient.listRecruitments.mockResolvedValue({
        ...mockPaginatedRecruitments,
        data: [mockRecruitment],
      });

      const result = await listRecruitments(
        mockApiClient as unknown as LaravelApiClient,
        { limit: 10, page: 1 }
      );

      const recruitment = result.structuredContent.recruitments[0];
      expect(recruitment.salary_range).toContain('JPY');
      expect(recruitment.salary_range).toContain('8,000,000');
    });

    it('should add created_by filter for non-admin users', async () => {
      mockApiClient.listRecruitments.mockResolvedValue(mockPaginatedRecruitments);

      await listRecruitments(
        mockApiClient as unknown as LaravelApiClient,
        { limit: 10, page: 1 },
        { user: mockRecruiterUser }
      );

      expect(mockApiClient.listRecruitments).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: mockRecruiterUser.user_id })
      );
    });

    it('should not add created_by filter for admin users', async () => {
      mockApiClient.listRecruitments.mockResolvedValue(mockPaginatedRecruitments);

      await listRecruitments(
        mockApiClient as unknown as LaravelApiClient,
        { limit: 10, page: 1 },
        { user: mockAdminUser }
      );

      expect(mockApiClient.listRecruitments).toHaveBeenCalledWith(
        expect.not.objectContaining({ created_by: expect.any(Number) })
      );
    });

    it('should pass filter params to API', async () => {
      mockApiClient.listRecruitments.mockResolvedValue(mockPaginatedRecruitments);

      await listRecruitments(
        mockApiClient as unknown as LaravelApiClient,
        { status: 'published', search: 'engineer', limit: 5, page: 2 }
      );

      expect(mockApiClient.listRecruitments).toHaveBeenCalledWith({
        status: 'published',
        search: 'engineer',
        limit: 5,
        page: 2,
      });
    });
  });

  describe('getRecruitmentDetails', () => {
    it('should return formatted recruitment details', async () => {
      mockApiClient.getRecruitment.mockResolvedValue(mockRecruitment);

      const result = await getRecruitmentDetails(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.structuredContent.recruitment.id).toBe(1);
      expect(result.structuredContent.recruitment.title).toBe('Senior Software Engineer');
      expect(result.content[0].text).toContain('Recruitment #1');
    });

    it('should format salary range when available', async () => {
      mockApiClient.getRecruitment.mockResolvedValue(mockRecruitment);

      const result = await getRecruitmentDetails(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.structuredContent.recruitment.salary_range).toContain('JPY');
    });

    it('should handle recruitment without salary', async () => {
      const recruitmentNoSalary = { ...mockRecruitment, salary_min: undefined, salary_max: undefined };
      mockApiClient.getRecruitment.mockResolvedValue(recruitmentNoSalary);

      const result = await getRecruitmentDetails(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.structuredContent.recruitment.salary_range).toBeUndefined();
    });

    it('should include applications count', async () => {
      mockApiClient.getRecruitment.mockResolvedValue(mockRecruitment);

      const result = await getRecruitmentDetails(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.structuredContent.recruitment.applications_count).toBe(5);
    });
  });

  describe('createRecruitment', () => {
    const createParams = {
      title: 'New Position',
      company_name: 'New Company',
      location: 'Remote',
      employment_type: 'full-time' as const,
      description: 'Description',
      requirements: 'Requirements',
      responsibilities: 'Responsibilities',
      status: 'draft' as const,
    };

    it('should create recruitment and return formatted result', async () => {
      const createdRecruitment = { ...mockRecruitment, ...createParams, id: 10 };
      mockApiClient.createRecruitment.mockResolvedValue(createdRecruitment);

      const result = await createRecruitment(
        mockApiClient as unknown as LaravelApiClient,
        createParams
      );

      expect(result.structuredContent.action).toBe('created');
      expect(result.structuredContent.recruitment.id).toBe(10);
      expect(result.content[0].text).toContain('Successfully created recruitment #10');
    });

    it('should pass all params to API client', async () => {
      mockApiClient.createRecruitment.mockResolvedValue(mockRecruitment);

      await createRecruitment(
        mockApiClient as unknown as LaravelApiClient,
        createParams
      );

      expect(mockApiClient.createRecruitment).toHaveBeenCalledWith(createParams);
    });
  });

  describe('updateRecruitment', () => {
    it('should update recruitment and return formatted result', async () => {
      const updatedRecruitment = { ...mockRecruitment, title: 'Updated Title' };
      mockApiClient.updateRecruitment.mockResolvedValue(updatedRecruitment);

      const result = await updateRecruitment(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1, updates: { title: 'Updated Title' } }
      );

      expect(result.structuredContent.action).toBe('updated');
      expect(result.content[0].text).toContain('Successfully updated');
    });

    it('should pass correct params to API', async () => {
      mockApiClient.updateRecruitment.mockResolvedValue(mockRecruitment);

      await updateRecruitment(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1, updates: { status: 'closed' } }
      );

      expect(mockApiClient.updateRecruitment).toHaveBeenCalledWith(1, { status: 'closed' });
    });
  });

  describe('deleteRecruitment', () => {
    it('should delete recruitment and return confirmation', async () => {
      mockApiClient.deleteRecruitment.mockResolvedValue(undefined);

      const result = await deleteRecruitment(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.structuredContent.action).toBe('deleted');
      expect(result.structuredContent.recruitment_id).toBe(1);
      expect(result.content[0].text).toContain('Successfully deleted recruitment #1');
    });

    it('should call API with correct ID', async () => {
      mockApiClient.deleteRecruitment.mockResolvedValue(undefined);

      await deleteRecruitment(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 42 }
      );

      expect(mockApiClient.deleteRecruitment).toHaveBeenCalledWith(42);
    });
  });

  describe('publishRecruitment', () => {
    it('should publish recruitment and return formatted result', async () => {
      const publishedRecruitment = { ...mockRecruitment, status: 'published' as const };
      mockApiClient.publishRecruitment.mockResolvedValue(publishedRecruitment);

      const result = await publishRecruitment(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 1 }
      );

      expect(result.structuredContent.action).toBe('published');
      expect(result.structuredContent.recruitment.status).toBe('published');
      expect(result.content[0].text).toContain('Successfully published');
    });

    it('should call API with correct ID', async () => {
      mockApiClient.publishRecruitment.mockResolvedValue(mockRecruitment);

      await publishRecruitment(
        mockApiClient as unknown as LaravelApiClient,
        { recruitment_id: 5 }
      );

      expect(mockApiClient.publishRecruitment).toHaveBeenCalledWith(5);
    });
  });
});
