import { z } from 'zod';
import type { LaravelApiClient } from '../services/laravelApiClient.js';
import type { AuthenticatedUser } from '../types/auth.types.js';

// ==================== Schema Definitions ====================

export const listApplicationsSchema = z.object({
  recruitment_id: z.number(),
  status: z.enum(['pending', 'reviewing', 'shortlisted', 'rejected', 'hired']).optional(),
});

// ==================== Tool Context ====================

export interface ToolContext {
  user?: AuthenticatedUser;
}

// ==================== Tool Implementations ====================

export async function listApplications(
  apiClient: LaravelApiClient,
  params: z.infer<typeof listApplicationsSchema>,
  context?: ToolContext
) {
  // Note: Authorization for viewing applications is handled by Laravel
  // The API will verify the user owns the recruitment before returning applications
  if (context?.user) {
    console.error(`   👤 User requesting applications: ${context.user.email} (${context.user.role})`);
  }

  const result = await apiClient.listApplications(params);

  const applications = result.applications.map((app) => ({
    id: app.id,
    applicant_name: app.applicant_name,
    applicant_email: app.applicant_email,
    status: app.status,
    applied_at: app.applied_at,
  }));

  return {
    structuredContent: {
      recruitment_id: result.recruitment_id,
      recruitment_title: result.recruitment_title,
      applications,
      total: result.total,
    },
    content: [
      {
        type: 'text' as const,
        text: `Found ${result.total} application(s) for "${result.recruitment_title}" (ID: ${result.recruitment_id}). ${applications.map(a => `${a.applicant_name} (${a.status})`).join('; ')}`,
      },
    ],
  };
}
