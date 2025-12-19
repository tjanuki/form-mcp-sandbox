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
  const result = await apiClient.listApplications(params);

  return {
    content: [
      {
        type: 'resource' as const,
        resource: {
          uri: 'component://applications-list',
          mimeType: 'text/html',
          text: JSON.stringify({
            recruitment_id: result.recruitment_id,
            recruitment_title: result.recruitment_title,
            applications: result.applications.map((app) => ({
              id: app.id,
              applicant_name: app.applicant_name,
              applicant_email: app.applicant_email,
              status: app.status,
              applied_at: app.applied_at,
            })),
            total: result.total,
          }),
        },
      },
    ],
  };
}
