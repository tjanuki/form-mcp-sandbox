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

  const statusSummary = Object.entries(stats.by_status || {})
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ');

  return {
    structuredContent: stats,
    content: [
      {
        type: 'text' as const,
        text: `Recruitment Statistics: Total recruitments: ${stats.total_recruitments}. By status: ${statusSummary}. Total applications: ${stats.total_applications}.`,
      },
    ],
  };
}
