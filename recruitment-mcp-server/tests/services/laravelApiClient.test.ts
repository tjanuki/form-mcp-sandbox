import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { LaravelApiClient, createLaravelApiClient } from '../../src/services/laravelApiClient.js';
import {
  mockRecruitment,
  mockRecruitmentWrapped,
  mockLaravelPaginatedResponse,
} from '../fixtures/recruitments.js';
import { mockListApplicationsResponse, mockApplication } from '../fixtures/applications.js';
import { mockStatistics, mockCountsByStatus } from '../fixtures/statistics.js';

// Mock axios.create to return our mocked instance
vi.mock('axios', async () => {
  const actualAxios = await vi.importActual('axios');
  return {
    ...actualAxios,
    default: {
      ...(actualAxios as typeof axios).default,
      create: vi.fn(() => {
        const instance = (actualAxios as typeof axios).default.create();
        return instance;
      }),
    },
  };
});

describe('LaravelApiClient', () => {
  let mockAxios: MockAdapter;
  let axiosInstance: ReturnType<typeof axios.create>;

  beforeEach(() => {
    // Create a real axios instance and mock it
    axiosInstance = axios.create({
      baseURL: 'http://localhost:8000',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    mockAxios = new MockAdapter(axiosInstance);

    // Mock axios.create to return our mocked instance
    vi.mocked(axios.create).mockReturnValue(axiosInstance);
  });

  afterEach(() => {
    mockAxios.reset();
    mockAxios.restore();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with correct headers', () => {
      const client = new LaravelApiClient('http://test.com', 'my-token');
      expect(client).toBeDefined();
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://test.com',
          headers: expect.objectContaining({
            'Authorization': 'Bearer my-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
          timeout: 10000,
        })
      );
    });

    it('should set timeout to 10000ms', () => {
      new LaravelApiClient('http://test.com', 'my-token');
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
        })
      );
    });
  });

  describe('error interceptor', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should handle 400 Bad Request errors', async () => {
      mockAxios.onGet('/api/recruitments').reply(400, {
        message: 'Bad request',
      });

      await expect(client.listRecruitments()).rejects.toThrow(
        'Laravel API Error (400): Bad request'
      );
    });

    it('should handle 401 Unauthorized errors', async () => {
      mockAxios.onGet('/api/recruitments').reply(401, {
        message: 'Unauthorized',
      });

      await expect(client.listRecruitments()).rejects.toThrow(
        'Laravel API Error (401): Unauthorized'
      );
    });

    it('should handle 403 Forbidden errors', async () => {
      mockAxios.onGet('/api/recruitments/1').reply(403, {
        message: 'Forbidden',
      });

      await expect(client.getRecruitment(1)).rejects.toThrow(
        'Laravel API Error (403): Forbidden'
      );
    });

    it('should handle 404 Not Found errors', async () => {
      mockAxios.onGet('/api/recruitments/999').reply(404, {
        message: 'Recruitment not found',
      });

      await expect(client.getRecruitment(999)).rejects.toThrow(
        'Laravel API Error (404): Recruitment not found'
      );
    });

    it('should handle 500 Server errors', async () => {
      mockAxios.onGet('/api/recruitments').reply(500, {
        message: 'Internal server error',
      });

      await expect(client.listRecruitments()).rejects.toThrow(
        'Laravel API Error (500): Internal server error'
      );
    });

    it('should handle network errors', async () => {
      mockAxios.onGet('/api/recruitments').networkError();

      await expect(client.listRecruitments()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mockAxios.onGet('/api/recruitments').timeout();

      await expect(client.listRecruitments()).rejects.toThrow();
    });

    it('should handle errors without message field', async () => {
      mockAxios.onGet('/api/recruitments').reply(400, {});

      await expect(client.listRecruitments()).rejects.toThrow('Laravel API Error (400)');
    });
  });

  describe('listRecruitments', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should list recruitments with default params', async () => {
      mockAxios.onGet('/api/recruitments').reply(200, mockLaravelPaginatedResponse);

      const result = await client.listRecruitments();

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.current_page).toBe(1);
      expect(result.per_page).toBe(10);
      expect(result.last_page).toBe(1);
    });

    it('should pass filter params to API', async () => {
      mockAxios.onGet('/api/recruitments').reply((config) => {
        expect(config.params).toEqual({
          status: 'published',
          search: 'engineer',
          employment_type: 'full-time',
          limit: 5,
          page: 2,
        });
        return [200, mockLaravelPaginatedResponse];
      });

      await client.listRecruitments({
        status: 'published',
        search: 'engineer',
        employment_type: 'full-time',
        limit: 5,
        page: 2,
      });
    });

    it('should pass created_by param for user-scoped filtering', async () => {
      mockAxios.onGet('/api/recruitments').reply((config) => {
        expect(config.params?.created_by).toBe(123);
        return [200, mockLaravelPaginatedResponse];
      });

      await client.listRecruitments({ created_by: 123 });
    });

    it('should transform Laravel response to flat structure', async () => {
      const laravelResponse = {
        data: [mockRecruitment],
        meta: {
          current_page: 2,
          per_page: 5,
          total: 15,
          last_page: 3,
        },
      };
      mockAxios.onGet('/api/recruitments').reply(200, laravelResponse);

      const result = await client.listRecruitments();

      expect(result.data).toEqual([mockRecruitment]);
      expect(result.current_page).toBe(2);
      expect(result.per_page).toBe(5);
      expect(result.total).toBe(15);
      expect(result.last_page).toBe(3);
    });
  });

  describe('getRecruitment', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should fetch a recruitment by ID', async () => {
      mockAxios.onGet('/api/recruitments/1').reply(200, mockRecruitmentWrapped);

      const result = await client.getRecruitment(1);

      expect(result).toEqual(mockRecruitment);
    });

    it('should handle non-existent recruitment', async () => {
      mockAxios.onGet('/api/recruitments/999').reply(404, {
        message: 'Recruitment not found',
      });

      await expect(client.getRecruitment(999)).rejects.toThrow(
        'Laravel API Error (404): Recruitment not found'
      );
    });
  });

  describe('createRecruitment', () => {
    let client: LaravelApiClient;

    const createParams = {
      title: 'New Position',
      company_name: 'New Company',
      location: 'Remote',
      employment_type: 'full-time' as const,
      description: 'New job description',
      requirements: 'Requirements here',
      responsibilities: 'Responsibilities here',
    };

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should create a recruitment with required fields', async () => {
      mockAxios.onPost('/api/recruitments').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.title).toBe('New Position');
        expect(data.company_name).toBe('New Company');
        return [201, { data: { ...mockRecruitment, ...data } }];
      });

      const result = await client.createRecruitment(createParams);

      expect(result.title).toBe('New Position');
    });

    it('should create a recruitment with optional fields', async () => {
      const paramsWithOptional = {
        ...createParams,
        salary_min: 5000000,
        salary_max: 8000000,
        benefits: 'Great benefits',
        application_deadline: '2025-06-30',
        status: 'draft' as const,
      };

      mockAxios.onPost('/api/recruitments').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.salary_min).toBe(5000000);
        expect(data.benefits).toBe('Great benefits');
        return [201, { data: { ...mockRecruitment, ...data } }];
      });

      const result = await client.createRecruitment(paramsWithOptional);
      expect(result).toBeDefined();
    });
  });

  describe('updateRecruitment', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should update a recruitment with partial data', async () => {
      const updates = { title: 'Updated Title', status: 'closed' as const };

      mockAxios.onPut('/api/recruitments/1').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.title).toBe('Updated Title');
        expect(data.status).toBe('closed');
        return [200, { data: { ...mockRecruitment, ...data } }];
      });

      const result = await client.updateRecruitment(1, updates);

      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe('closed');
    });

    it('should only send provided fields', async () => {
      mockAxios.onPut('/api/recruitments/1').reply((config) => {
        const data = JSON.parse(config.data);
        expect(Object.keys(data)).toEqual(['location']);
        return [200, { data: { ...mockRecruitment, location: 'New Location' } }];
      });

      await client.updateRecruitment(1, { location: 'New Location' });
    });
  });

  describe('deleteRecruitment', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should delete a recruitment', async () => {
      mockAxios.onDelete('/api/recruitments/1').reply(204);

      await expect(client.deleteRecruitment(1)).resolves.toBeUndefined();
    });

    it('should handle delete of non-existent recruitment', async () => {
      mockAxios.onDelete('/api/recruitments/999').reply(404, {
        message: 'Recruitment not found',
      });

      await expect(client.deleteRecruitment(999)).rejects.toThrow(
        'Laravel API Error (404): Recruitment not found'
      );
    });
  });

  describe('publishRecruitment', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should publish a recruitment', async () => {
      const publishedRecruitment = {
        ...mockRecruitment,
        status: 'published',
        published_at: '2025-01-15T10:00:00.000Z',
      };

      mockAxios.onPatch('/api/recruitments/1/publish').reply(200, {
        data: publishedRecruitment,
      });

      const result = await client.publishRecruitment(1);

      expect(result.status).toBe('published');
      expect(result.published_at).toBeDefined();
    });

    it('should handle publishing already published recruitment', async () => {
      mockAxios.onPatch('/api/recruitments/1/publish').reply(400, {
        message: 'Recruitment is already published',
      });

      await expect(client.publishRecruitment(1)).rejects.toThrow(
        'Laravel API Error (400): Recruitment is already published'
      );
    });
  });

  describe('closeRecruitment', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should close a recruitment', async () => {
      const closedRecruitment = {
        ...mockRecruitment,
        status: 'closed',
      };

      mockAxios.onPatch('/api/recruitments/1/close').reply(200, {
        data: closedRecruitment,
      });

      const result = await client.closeRecruitment(1);

      expect(result.status).toBe('closed');
    });
  });

  describe('listApplications', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should list applications for a recruitment', async () => {
      mockAxios.onGet('/api/recruitments/1/applications').reply(200, mockListApplicationsResponse);

      const result = await client.listApplications({ recruitment_id: 1 });

      expect(result.recruitment_id).toBe(1);
      expect(result.recruitment_title).toBe('Senior Software Engineer');
      expect(result.applications).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter applications by status', async () => {
      mockAxios.onGet('/api/recruitments/1/applications').reply((config) => {
        expect(config.params?.status).toBe('pending');
        return [200, {
          ...mockListApplicationsResponse,
          applications: [mockApplication],
          total: 1,
        }];
      });

      const result = await client.listApplications({
        recruitment_id: 1,
        status: 'pending',
      });

      expect(result.total).toBe(1);
    });
  });

  describe('updateApplicationStatus', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should update application status', async () => {
      const updatedApplication = { ...mockApplication, status: 'reviewing' };

      mockAxios.onPatch('/api/applications/1/status').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.status).toBe('reviewing');
        return [200, updatedApplication];
      });

      const result = await client.updateApplicationStatus(1, 'reviewing');

      expect(result.status).toBe('reviewing');
    });
  });

  describe('getStatistics', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should get statistics with no params', async () => {
      mockAxios.onGet('/api/statistics/overview').reply(200, mockStatistics);

      const result = await client.getStatistics();

      expect(result.total_recruitments).toBe(10);
      expect(result.total_applications).toBe(45);
      expect(result.by_status.published).toBe(5);
    });

    it('should pass date params', async () => {
      mockAxios.onGet('/api/statistics/overview').reply((config) => {
        expect(config.params?.date_from).toBe('2025-01-01');
        expect(config.params?.date_to).toBe('2025-01-31');
        return [200, mockStatistics];
      });

      await client.getStatistics({
        date_from: '2025-01-01',
        date_to: '2025-01-31',
      });
    });
  });

  describe('getCountsByStatus', () => {
    let client: LaravelApiClient;

    beforeEach(() => {
      client = new LaravelApiClient('http://localhost:8000', 'test-token');
    });

    it('should get counts by status', async () => {
      mockAxios.onGet('/api/statistics/by-status').reply(200, mockCountsByStatus);

      const result = await client.getCountsByStatus();

      expect(result.draft).toBe(2);
      expect(result.published).toBe(5);
      expect(result.closed).toBe(2);
      expect(result.filled).toBe(1);
    });
  });
});

describe('createLaravelApiClient', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should create client with provided token', () => {
    vi.stubEnv('LARAVEL_API_URL', 'http://api.example.com');

    const client = createLaravelApiClient('custom-token');

    expect(client).toBeInstanceOf(LaravelApiClient);
  });

  it('should fall back to env token when no token provided', () => {
    vi.stubEnv('LARAVEL_API_URL', 'http://api.example.com');
    vi.stubEnv('LARAVEL_API_TOKEN', 'env-token');

    const client = createLaravelApiClient();

    expect(client).toBeInstanceOf(LaravelApiClient);
  });

  it('should use default URL when LARAVEL_API_URL is not set', () => {
    vi.stubEnv('LARAVEL_API_TOKEN', 'test-token');
    vi.stubEnv('LARAVEL_API_URL', '');

    const client = createLaravelApiClient();

    expect(client).toBeInstanceOf(LaravelApiClient);
  });

  it('should throw error when no token available', () => {
    vi.stubEnv('LARAVEL_API_TOKEN', '');

    expect(() => createLaravelApiClient()).toThrow(
      'No API token provided and LARAVEL_API_TOKEN environment variable is not set'
    );
  });
});
