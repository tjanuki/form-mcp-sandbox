import { z } from 'zod';
import type { LaravelApiClient } from '../services/laravelApiClient.js';

// ==================== Schema Definitions ====================

export const listRecruitmentsSchema = z.object({
  status: z.enum(['draft', 'published', 'closed', 'filled']).optional(),
  search: z.string().optional(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
  limit: z.number().default(10),
  page: z.number().default(1),
});

export const getRecruitmentDetailsSchema = z.object({
  recruitment_id: z.number(),
});

export const createRecruitmentSchema = z.object({
  title: z.string(),
  company_name: z.string(),
  location: z.string(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  description: z.string(),
  requirements: z.string(),
  responsibilities: z.string(),
  benefits: z.string().optional(),
  application_deadline: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const updateRecruitmentSchema = z.object({
  recruitment_id: z.number(),
  updates: z.object({
    title: z.string().optional(),
    company_name: z.string().optional(),
    location: z.string().optional(),
    employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    responsibilities: z.string().optional(),
    benefits: z.string().optional(),
    application_deadline: z.string().optional(),
    status: z.enum(['draft', 'published', 'closed', 'filled']).optional(),
  }),
});

export const deleteRecruitmentSchema = z.object({
  recruitment_id: z.number(),
});

export const publishRecruitmentSchema = z.object({
  recruitment_id: z.number(),
});

// ==================== Tool Implementations ====================

export async function listRecruitments(
  apiClient: LaravelApiClient,
  params: z.infer<typeof listRecruitmentsSchema>
) {
  const result = await apiClient.listRecruitments(params);

  return {
    content: [
      {
        type: 'resource' as const,
        resource: {
          uri: 'component://recruitment-list',
          mimeType: 'text/html',
          text: JSON.stringify({
            recruitments: result.data.map((r) => ({
              id: r.id,
              title: r.title,
              company_name: r.company_name,
              location: r.location,
              employment_type: r.employment_type,
              salary_range: r.salary_min && r.salary_max
                ? `${r.salary_currency} ${r.salary_min.toLocaleString()} - ${r.salary_max.toLocaleString()}`
                : undefined,
              status: r.status,
              published_at: r.published_at,
            })),
            total: result.total,
            current_page: result.current_page,
            per_page: result.per_page,
          }),
        },
      },
    ],
  };
}

export async function getRecruitmentDetails(
  apiClient: LaravelApiClient,
  params: z.infer<typeof getRecruitmentDetailsSchema>
) {
  const recruitment = await apiClient.getRecruitment(params.recruitment_id);

  return {
    content: [
      {
        type: 'resource' as const,
        resource: {
          uri: 'component://recruitment-detail',
          mimeType: 'text/html',
          text: JSON.stringify({
            recruitment: {
              id: recruitment.id,
              title: recruitment.title,
              company_name: recruitment.company_name,
              location: recruitment.location,
              employment_type: recruitment.employment_type,
              salary_range: recruitment.salary_min && recruitment.salary_max
                ? `${recruitment.salary_currency} ${recruitment.salary_min.toLocaleString()} - ${recruitment.salary_max.toLocaleString()}`
                : undefined,
              description: recruitment.description,
              requirements: recruitment.requirements,
              responsibilities: recruitment.responsibilities,
              benefits: recruitment.benefits,
              application_deadline: recruitment.application_deadline,
              status: recruitment.status,
              applications_count: (recruitment as any).applications?.length || recruitment.applications_count || 0,
              created_at: recruitment.created_at,
              published_at: recruitment.published_at,
            },
          }),
        },
      },
    ],
  };
}

export async function createRecruitment(
  apiClient: LaravelApiClient,
  params: z.infer<typeof createRecruitmentSchema>
) {
  const recruitment = await apiClient.createRecruitment(params);

  return {
    content: [
      {
        type: 'resource' as const,
        resource: {
          uri: 'component://recruitment-form',
          mimeType: 'text/html',
          text: JSON.stringify({
            action: 'created',
            recruitment: {
              id: recruitment.id,
              title: recruitment.title,
              company_name: recruitment.company_name,
              status: recruitment.status,
            },
          }),
        },
      },
    ],
  };
}

export async function updateRecruitment(
  apiClient: LaravelApiClient,
  params: z.infer<typeof updateRecruitmentSchema>
) {
  const recruitment = await apiClient.updateRecruitment(
    params.recruitment_id,
    params.updates
  );

  return {
    content: [
      {
        type: 'resource' as const,
        resource: {
          uri: 'component://recruitment-form',
          mimeType: 'text/html',
          text: JSON.stringify({
            action: 'updated',
            recruitment: {
              id: recruitment.id,
              title: recruitment.title,
              company_name: recruitment.company_name,
              status: recruitment.status,
            },
          }),
        },
      },
    ],
  };
}

export async function deleteRecruitment(
  apiClient: LaravelApiClient,
  params: z.infer<typeof deleteRecruitmentSchema>
) {
  await apiClient.deleteRecruitment(params.recruitment_id);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Successfully deleted recruitment #${params.recruitment_id}`,
      },
    ],
  };
}

export async function publishRecruitment(
  apiClient: LaravelApiClient,
  params: z.infer<typeof publishRecruitmentSchema>
) {
  const recruitment = await apiClient.publishRecruitment(params.recruitment_id);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Successfully published recruitment "${recruitment.title}" (ID: ${recruitment.id})`,
      },
    ],
  };
}
