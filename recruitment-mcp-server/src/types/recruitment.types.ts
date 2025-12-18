// Recruitment types matching Laravel backend schema

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type RecruitmentStatus = 'draft' | 'published' | 'closed' | 'filled';
export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

export interface Recruitment {
  id: number;
  title: string;
  company_name: string;
  location: string;
  employment_type: EmploymentType;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  application_deadline?: string;
  status: RecruitmentStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  applications_count?: number;
}

export interface Application {
  id: number;
  recruitment_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  resume_path?: string;
  cover_letter?: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'viewer';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

export interface Statistics {
  total_recruitments: number;
  by_status: Record<RecruitmentStatus, number>;
  by_employment_type: Record<string, number>;
  total_applications: number;
  recent_activity: Array<{
    recruitment_title: string;
    action: string;
    timestamp: string;
  }>;
}

// API Request/Response types
export interface ListRecruitmentsParams {
  status?: RecruitmentStatus;
  search?: string;
  employment_type?: EmploymentType;
  limit?: number;
  page?: number;
}

export interface CreateRecruitmentParams {
  title: string;
  company_name: string;
  location: string;
  employment_type: EmploymentType;
  salary_min?: number;
  salary_max?: number;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  application_deadline?: string;
  status?: RecruitmentStatus;
}

export interface UpdateRecruitmentParams {
  title?: string;
  company_name?: string;
  location?: string;
  employment_type?: EmploymentType;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  application_deadline?: string;
  status?: RecruitmentStatus;
}

export interface StatisticsParams {
  date_from?: string;
  date_to?: string;
}

export interface ListApplicationsParams {
  recruitment_id: number;
  status?: ApplicationStatus;
}
