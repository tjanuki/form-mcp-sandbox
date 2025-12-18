import { z } from 'zod';
import type { LaravelApiClient } from '../services/laravelApiClient.js';

// ==================== Schema Definitions ====================

export const listApplicationsSchema = z.object({
  recruitment_id: z.number(),
  status: z.enum(['pending', 'reviewing', 'shortlisted', 'rejected', 'hired']).optional(),
});

// ==================== Tool Implementations ====================

export async function listApplications(
  apiClient: LaravelApiClient,
  params: z.infer<typeof listApplicationsSchema>
) {
  const applications = await apiClient.listApplications(params);

  // Get recruitment details for context
  const recruitment = await apiClient.getRecruitment(params.recruitment_id);

  return {
    content: [
      {
        type: 'resource' as const,
        resource: {
          uri: 'component://applications-list',
          mimeType: 'text/html',
          text: JSON.stringify({
            recruitment_id: recruitment.id,
            recruitment_title: recruitment.title,
            applications: applications.map((app) => ({
              id: app.id,
              applicant_name: app.applicant_name,
              applicant_email: app.applicant_email,
              status: app.status,
              applied_at: app.applied_at,
            })),
            total: applications.length,
          }),
        },
      },
    ],
  };
}
