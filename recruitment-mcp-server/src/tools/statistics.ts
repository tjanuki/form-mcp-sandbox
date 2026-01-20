import { z } from 'zod';
import type { LaravelApiClient } from '../services/laravelApiClient.js';
import type { AuthenticatedUser } from '../types/auth.types.js';
import { sanitizeDateString } from '../services/sanitizer.js';

// ==================== Sanitized String Schemas ====================

/** Sanitized date string with ISO format validation */
const sanitizedDate = z.string().transform((val) => sanitizeDateString(val));

// ==================== Schema Definitions ====================

export const getRecruitmentStatisticsSchema = z.object({
  date_from: sanitizedDate.optional(),
  date_to: sanitizedDate.optional(),
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

export async function getRecruitmentStatistics(
  apiClient: LaravelApiClient,
  params: z.infer<typeof getRecruitmentStatisticsSchema>,
  context?: ToolContext
) {
  // For non-admin users, filter statistics to only their own recruitments
  const apiParams: {
    date_from?: string;
    date_to?: string;
    created_by?: number;
  } = { ...params };

  if (context?.user && !isAdmin(context.user)) {
    apiParams.created_by = context.user.user_id;
    console.error(`   🔒 User-scoped statistics: created_by=${context.user.user_id}`);
  }

  const stats = await apiClient.getStatistics(apiParams);

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
