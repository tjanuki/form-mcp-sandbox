import type { Recruitment, PaginatedResponse } from '../../src/types/recruitment.types.js';

export const mockRecruitment: Recruitment = {
  id: 1,
  title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  location: 'Tokyo, Japan',
  employment_type: 'full-time',
  salary_min: 8000000,
  salary_max: 12000000,
  salary_currency: 'JPY',
  description: 'We are looking for a senior software engineer to join our team.',
  requirements: '5+ years of experience in software development',
  responsibilities: 'Lead development of new features',
  benefits: 'Health insurance, remote work',
  application_deadline: '2025-03-31',
  status: 'published',
  created_by: 1,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  published_at: '2025-01-02T00:00:00.000Z',
  applications_count: 5,
};

export const mockRecruitmentDraft: Recruitment = {
  id: 2,
  title: 'Junior Developer',
  company_name: 'Startup Inc',
  location: 'Remote',
  employment_type: 'contract',
  salary_min: 4000000,
  salary_max: 6000000,
  salary_currency: 'JPY',
  description: 'Entry-level position for developers',
  requirements: '1+ years of experience',
  responsibilities: 'Assist with development tasks',
  status: 'draft',
  created_by: 2,
  created_at: '2025-01-05T00:00:00.000Z',
  updated_at: '2025-01-05T00:00:00.000Z',
  applications_count: 0,
};

export const mockRecruitmentsList: Recruitment[] = [
  mockRecruitment,
  mockRecruitmentDraft,
  {
    id: 3,
    title: 'Product Manager',
    company_name: 'Tech Corp',
    location: 'Osaka, Japan',
    employment_type: 'full-time',
    salary_min: 7000000,
    salary_max: 10000000,
    salary_currency: 'JPY',
    description: 'Product management role',
    requirements: '3+ years of PM experience',
    responsibilities: 'Lead product development',
    status: 'closed',
    created_by: 1,
    created_at: '2025-01-03T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z',
    published_at: '2025-01-03T00:00:00.000Z',
    applications_count: 10,
  },
];

export const mockPaginatedRecruitments: PaginatedResponse<Recruitment> = {
  data: mockRecruitmentsList,
  total: 3,
  current_page: 1,
  per_page: 10,
  last_page: 1,
};

export const mockLaravelPaginatedResponse = {
  data: mockRecruitmentsList,
  meta: {
    current_page: 1,
    per_page: 10,
    total: 3,
    last_page: 1,
  },
};

export const mockRecruitmentWrapped = {
  data: mockRecruitment,
};
