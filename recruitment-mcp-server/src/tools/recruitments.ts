import { z } from 'zod';
import type { LaravelApiClient } from '../services/laravelApiClient.js';
import type { AuthenticatedUser } from '../types/auth.types.js';

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

// ==================== Tool Context ====================

export interface ToolContext {
  user?: AuthenticatedUser;
}

/**
 * Check if user is admin
 */
function isAdmin(user?: AuthenticatedUser): boolean {
  return user?.role === 'admin';
}

// ==================== Tool Implementations ====================

export async function listRecruitments(
  apiClient: LaravelApiClient,
  params: z.infer<typeof listRecruitmentsSchema>,
  context?: ToolContext
) {
  // For non-admin users, filter to only show their own recruitments
  const apiParams: {
    status?: typeof params.status;
    search?: string;
    employment_type?: typeof params.employment_type;
    limit: number;
    page: number;
    created_by?: number;
  } = { ...params };

  if (context?.user && !isAdmin(context.user)) {
    apiParams.created_by = context.user.user_id;
    console.error(`   🔒 User-scoped filter: created_by=${context.user.user_id}`);
  }

  const result = await apiClient.listRecruitments(apiParams);

  console.error(`   📊 API returned ${result.data.length} recruitments`);
  console.error(`   📄 Pagination: page ${result.current_page}/${result.last_page}, total ${result.total}`);

  const recruitments = result.data.map((r) => ({
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
  }));

  return {
    structuredContent: {
      recruitments,
      total: result.total,
      current_page: result.current_page,
      per_page: result.per_page,
      last_page: result.last_page,
    },
    content: [
      {
        type: 'text' as const,
        text: `Found ${result.total} recruitment(s) (page ${result.current_page}/${result.last_page}). ${recruitments.map(r => `${r.id}: ${r.title} at ${r.company_name} (${r.status})`).join('; ')}`,
      },
    ],
  };
}

export async function getRecruitmentDetails(
  apiClient: LaravelApiClient,
  params: z.infer<typeof getRecruitmentDetailsSchema>,
  context?: ToolContext
) {
  // Authorization is handled by Laravel policy via the OAuth token
  const recruitment = await apiClient.getRecruitment(params.recruitment_id);

  const details = {
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
  };

  return {
    structuredContent: { recruitment: details },
    content: [
      {
        type: 'text' as const,
        text: `Recruitment #${details.id}: ${details.title} at ${details.company_name}. Location: ${details.location}. Type: ${details.employment_type}. Status: ${details.status}. ${details.salary_range ? `Salary: ${details.salary_range}.` : ''} Applications: ${details.applications_count}. Description: ${details.description}`,
      },
    ],
  };
}

export async function createRecruitment(
  apiClient: LaravelApiClient,
  params: z.infer<typeof createRecruitmentSchema>,
  context?: ToolContext
) {
  // created_by is set by Laravel using the authenticated user from the OAuth token
  const recruitment = await apiClient.createRecruitment(params);

  return {
    structuredContent: {
      action: 'created',
      recruitment: {
        id: recruitment.id,
        title: recruitment.title,
        company_name: recruitment.company_name,
        status: recruitment.status,
      },
    },
    content: [
      {
        type: 'text' as const,
        text: `Successfully created recruitment #${recruitment.id}: "${recruitment.title}" at ${recruitment.company_name}. Status: ${recruitment.status}.`,
      },
    ],
  };
}

export async function updateRecruitment(
  apiClient: LaravelApiClient,
  params: z.infer<typeof updateRecruitmentSchema>,
  context?: ToolContext
) {
  // Authorization is handled by Laravel policy via the OAuth token
  const recruitment = await apiClient.updateRecruitment(
    params.recruitment_id,
    params.updates
  );

  return {
    structuredContent: {
      action: 'updated',
      recruitment: {
        id: recruitment.id,
        title: recruitment.title,
        company_name: recruitment.company_name,
        status: recruitment.status,
      },
    },
    content: [
      {
        type: 'text' as const,
        text: `Successfully updated recruitment #${recruitment.id}: "${recruitment.title}" at ${recruitment.company_name}. Status: ${recruitment.status}.`,
      },
    ],
  };
}

export async function deleteRecruitment(
  apiClient: LaravelApiClient,
  params: z.infer<typeof deleteRecruitmentSchema>,
  context?: ToolContext
) {
  // Authorization is handled by Laravel policy via the OAuth token
  await apiClient.deleteRecruitment(params.recruitment_id);

  return {
    structuredContent: {
      action: 'deleted',
      recruitment_id: params.recruitment_id,
    },
    content: [
      {
        type: 'text' as const,
        text: `Successfully deleted recruitment #${params.recruitment_id}.`,
      },
    ],
  };
}

export async function publishRecruitment(
  apiClient: LaravelApiClient,
  params: z.infer<typeof publishRecruitmentSchema>,
  context?: ToolContext
) {
  // Authorization is handled by Laravel policy via the OAuth token
  const recruitment = await apiClient.publishRecruitment(params.recruitment_id);

  return {
    structuredContent: {
      action: 'published',
      recruitment: {
        id: recruitment.id,
        title: recruitment.title,
        status: recruitment.status,
      },
    },
    content: [
      {
        type: 'text' as const,
        text: `Successfully published recruitment #${recruitment.id}: "${recruitment.title}".`,
      },
    ],
  };
}
