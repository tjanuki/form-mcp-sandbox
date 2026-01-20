import type { Application } from '../../src/types/recruitment.types.js';

export const mockApplication: Application = {
  id: 1,
  recruitment_id: 1,
  applicant_name: 'Taro Yamada',
  applicant_email: 'taro@example.com',
  applicant_phone: '090-1234-5678',
  resume_path: '/uploads/resumes/taro_resume.pdf',
  cover_letter: 'I am very interested in this position...',
  status: 'pending',
  applied_at: '2025-01-10T00:00:00.000Z',
  updated_at: '2025-01-10T00:00:00.000Z',
};

export const mockApplicationsList: Application[] = [
  mockApplication,
  {
    id: 2,
    recruitment_id: 1,
    applicant_name: 'Hanako Sato',
    applicant_email: 'hanako@example.com',
    applicant_phone: '090-9876-5432',
    resume_path: '/uploads/resumes/hanako_resume.pdf',
    cover_letter: 'I would love to join your team...',
    status: 'reviewing',
    applied_at: '2025-01-11T00:00:00.000Z',
    updated_at: '2025-01-12T00:00:00.000Z',
  },
  {
    id: 3,
    recruitment_id: 1,
    applicant_name: 'Kenji Tanaka',
    applicant_email: 'kenji@example.com',
    status: 'shortlisted',
    applied_at: '2025-01-12T00:00:00.000Z',
    updated_at: '2025-01-13T00:00:00.000Z',
  },
];

export const mockListApplicationsResponse = {
  recruitment_id: 1,
  recruitment_title: 'Senior Software Engineer',
  applications: mockApplicationsList,
  total: 3,
};
