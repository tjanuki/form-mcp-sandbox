import { z } from 'zod';
import type { LaravelApiClient } from '../services/laravelApiClient.js';

// ==================== Schema Definitions ====================

export const getRecruitmentStatisticsSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

// ==================== Tool Implementations ====================

export async function getRecruitmentStatistics(
  apiClient: LaravelApiClient,
  params: z.infer<typeof getRecruitmentStatisticsSchema>
) {
  const stats = await apiClient.getStatistics(params);

  return {
    content: [
      {
        type: 'resource' as const,
        resource: {
          uri: 'component://statistics-dashboard',
          mimeType: 'text/html',
          text: JSON.stringify(stats),
        },
      },
    ],
  };
}
