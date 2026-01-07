import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Recruitment,
  Application,
  PaginatedResponse,
  Statistics,
  ListRecruitmentsParams,
  CreateRecruitmentParams,
  UpdateRecruitmentParams,
  StatisticsParams,
  ListApplicationsParams,
} from '../types/recruitment.types.js';

export class LaravelApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, token: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    // Error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const message = (error.response.data as any)?.message || error.message;

          throw new Error(`Laravel API Error (${status}): ${message}`);
        } else if (error.request) {
          throw new Error('Laravel API is unreachable. Please check the server.');
        } else {
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  // ==================== Recruitment Endpoints ====================

  /**
   * List all recruitments with optional filters
   */
  async listRecruitments(
    params?: ListRecruitmentsParams
  ): Promise<PaginatedResponse<Recruitment>> {
    const response = await this.client.get<{
      data: Recruitment[];
      meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>('/api/recruitments', {
      params,
    });

    // Transform Laravel's nested response to flat structure
    return {
      data: response.data.data,
      current_page: response.data.meta.current_page,
      per_page: response.data.meta.per_page,
      total: response.data.meta.total,
      last_page: response.data.meta.last_page,
    };
  }

  /**
   * Get a single recruitment by ID
   */
  async getRecruitment(id: number): Promise<Recruitment> {
    const response = await this.client.get<{ data: Recruitment }>(`/api/recruitments/${id}`);
    return response.data.data;
  }

  /**
   * Create a new recruitment
   */
  async createRecruitment(data: CreateRecruitmentParams): Promise<Recruitment> {
    const response = await this.client.post<{ data: Recruitment }>('/api/recruitments', data);
    return response.data.data;
  }

  /**
   * Update an existing recruitment
   */
  async updateRecruitment(
    id: number,
    data: UpdateRecruitmentParams
  ): Promise<Recruitment> {
    const response = await this.client.put<{ data: Recruitment }>(`/api/recruitments/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a recruitment
   */
  async deleteRecruitment(id: number): Promise<void> {
    await this.client.delete(`/api/recruitments/${id}`);
  }

  /**
   * Publish a recruitment (change status to 'published')
   */
  async publishRecruitment(id: number): Promise<Recruitment> {
    const response = await this.client.patch<{ data: Recruitment }>(
      `/api/recruitments/${id}/publish`
    );
    return response.data.data;
  }

  /**
   * Close a recruitment (change status to 'closed')
   */
  async closeRecruitment(id: number): Promise<Recruitment> {
    const response = await this.client.patch<{ data: Recruitment }>(
      `/api/recruitments/${id}/close`
    );
    return response.data.data;
  }

  // ==================== Application Endpoints ====================

  /**
   * List applications for a specific recruitment
   */
  async listApplications(params: ListApplicationsParams): Promise<{
    recruitment_id: number;
    recruitment_title: string;
    applications: Application[];
    total: number;
  }> {
    const { recruitment_id, status } = params;
    const response = await this.client.get<{
      recruitment_id: number;
      recruitment_title: string;
      applications: Application[];
      total: number;
    }>(
      `/api/recruitments/${recruitment_id}/applications`,
      { params: { status } }
    );
    return response.data;
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    id: number,
    status: string
  ): Promise<Application> {
    const response = await this.client.patch<Application>(
      `/api/applications/${id}/status`,
      { status }
    );
    return response.data;
  }

  // ==================== Statistics Endpoints ====================

  /**
   * Get recruitment statistics
   */
  async getStatistics(params?: StatisticsParams): Promise<Statistics> {
    const response = await this.client.get<Statistics>('/api/statistics/overview', {
      params,
    });
    return response.data;
  }

  /**
   * Get counts by status
   */
  async getCountsByStatus(): Promise<Record<string, number>> {
    const response = await this.client.get<Record<string, number>>(
      '/api/statistics/by-status'
    );
    return response.data;
  }
}

/**
 * Create and export a singleton instance
 */
export function createLaravelApiClient(): LaravelApiClient {
  const apiUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000';
  const apiToken = process.env.LARAVEL_API_TOKEN || '';

  if (!apiToken) {
    throw new Error('LARAVEL_API_TOKEN environment variable is required');
  }

  return new LaravelApiClient(apiUrl, apiToken);
}
