import type { Statistics } from '../../src/types/recruitment.types.js';

export const mockStatistics: Statistics = {
  total_recruitments: 10,
  by_status: {
    draft: 2,
    published: 5,
    closed: 2,
    filled: 1,
  },
  by_employment_type: {
    'full-time': 6,
    'part-time': 2,
    contract: 1,
    internship: 1,
  },
  total_applications: 45,
  recent_activity: [
    {
      recruitment_title: 'Senior Software Engineer',
      action: 'published',
      timestamp: '2025-01-15T10:00:00.000Z',
    },
    {
      recruitment_title: 'Junior Developer',
      action: 'created',
      timestamp: '2025-01-14T09:00:00.000Z',
    },
    {
      recruitment_title: 'Product Manager',
      action: 'closed',
      timestamp: '2025-01-13T15:00:00.000Z',
    },
  ],
};

export const mockCountsByStatus: Record<string, number> = {
  draft: 2,
  published: 5,
  closed: 2,
  filled: 1,
};
