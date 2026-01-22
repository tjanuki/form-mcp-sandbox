import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { randomUUID } from 'crypto';
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
import { ErrorCode, McpError, Errors } from '../types/errors.js';
import { logger } from './logger.js';

// Extend AxiosRequestConfig to include metadata for timing
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      requestId: string;
      startTime: number;
    };
  }
}

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

    // Request logging interceptor
    this.client.interceptors.request.use((config) => {
      const requestId = randomUUID();
      config.metadata = {
        requestId,
        startTime: Date.now(),
      };
      config.headers['X-Request-ID'] = requestId;

      logger.debug('API Request', {
        requestId,
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
      });

      return config;
    });

    // Response logging interceptor
    this.client.interceptors.response.use(
      (response) => {
        const { requestId, startTime } = response.config.metadata ?? {};
        const duration = startTime ? Date.now() - startTime : undefined;

        logger.debug('API Response', {
          requestId,
          status: response.status,
          url: response.config.url,
          duration,
        });

        return response;
      },
      (error: AxiosError) => {
        const { requestId, startTime } = error.config?.metadata ?? {};
        const duration = startTime ? Date.now() - startTime : undefined;

        logger.error('API Error', {
          requestId,
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          duration,
        });
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as Record<string, unknown> | undefined;
          const message = (data?.message as string) || error.message;

          // Map HTTP status codes to specific error types
          if (status === 401) {
            throw Errors.unauthorized(message, data);
          } else if (status === 403) {
            throw Errors.forbidden(message, data);
          } else if (status === 404) {
            throw Errors.notFound(message, data);
          } else if (status === 422) {
            throw Errors.validationFailed(message, data);
          } else if (status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            throw Errors.rateLimited(retryAfter ? parseInt(retryAfter, 10) : undefined);
          } else {
            throw Errors.apiError(status, message, data);
          }
        } else if (error.request) {
          throw Errors.apiUnreachable(error);
        } else {
          throw Errors.requestFailed(error.message, error);
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
 * Create a LaravelApiClient instance
 * @param token Optional OAuth token. If not provided, falls back to LARAVEL_API_TOKEN env var
 */
export function createLaravelApiClient(token?: string): LaravelApiClient {
  const apiUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000';
  const apiToken = token || process.env.LARAVEL_API_TOKEN || '';

  if (!apiToken) {
    throw Errors.missingConfig('API token (provide token parameter or set LARAVEL_API_TOKEN)');
  }

  return new LaravelApiClient(apiUrl, apiToken);
}
