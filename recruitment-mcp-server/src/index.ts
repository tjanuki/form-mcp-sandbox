#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import services and tools
import { createLaravelApiClient } from './services/laravelApiClient.js';
import * as recruitmentTools from './tools/recruitments.js';
import * as applicationTools from './tools/applications.js';
import * as statisticsTools from './tools/statistics.js';

// Load environment variables
config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Laravel API client
const apiClient = createLaravelApiClient();

// Server info
const SERVER_NAME = process.env.MCP_SERVER_NAME || 'recruitment-mcp-server';
const SERVER_VERSION = process.env.MCP_SERVER_VERSION || '1.0.0';

// Create MCP server instance
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ==================== Resources (React Components) ====================

const componentResources = [
  {
    uri: 'component://recruitment-list',
    name: 'Recruitment List Component',
    description: 'Displays a paginated list of recruitments',
    mimeType: 'text/html',
    file: 'RecruitmentList.html',
  },
  {
    uri: 'component://recruitment-detail',
    name: 'Recruitment Detail Component',
    description: 'Shows comprehensive recruitment information',
    mimeType: 'text/html',
    file: 'RecruitmentDetail.html',
  },
  {
    uri: 'component://recruitment-form',
    name: 'Recruitment Form Component',
    description: 'Confirmation view after create/update operations',
    mimeType: 'text/html',
    file: 'RecruitmentForm.html',
  },
  {
    uri: 'component://applications-list',
    name: 'Applications List Component',
    description: 'Displays applications for a recruitment',
    mimeType: 'text/html',
    file: 'ApplicationsList.html',
  },
  {
    uri: 'component://statistics-dashboard',
    name: 'Statistics Dashboard Component',
    description: 'Visual recruitment analytics',
    mimeType: 'text/html',
    file: 'StatisticsDashboard.html',
  },
];

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: componentResources.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    })),
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resource = componentResources.find((r) => r.uri === request.params.uri);

  if (!resource) {
    throw new Error(`Resource not found: ${request.params.uri}`);
  }

  try {
    const componentPath = join(__dirname, 'components', resource.file);
    const content = readFileSync(componentPath, 'utf-8');

    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: content,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to read resource: ${error}`);
  }
});

// ==================== Tools ====================

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_recruitments',
        description:
          'Retrieve and display recruitment listings with optional filters (status, search, employment type)',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['draft', 'published', 'closed', 'filled'],
              description: 'Filter by recruitment status',
            },
            search: {
              type: 'string',
              description: 'Search term to filter recruitments',
            },
            employment_type: {
              type: 'string',
              enum: ['full-time', 'part-time', 'contract', 'internship'],
              description: 'Filter by employment type',
            },
            limit: {
              type: 'number',
              description: 'Number of results per page',
              default: 10,
            },
            page: {
              type: 'number',
              description: 'Page number',
              default: 1,
            },
          },
        },
      },
      {
        name: 'get_recruitment_details',
        description: 'Fetch detailed information about a specific recruitment',
        inputSchema: {
          type: 'object',
          properties: {
            recruitment_id: {
              type: 'number',
              description: 'The ID of the recruitment to retrieve',
            },
          },
          required: ['recruitment_id'],
        },
      },
      {
        name: 'create_recruitment',
        description: 'Create a new recruitment posting',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Job title' },
            company_name: { type: 'string', description: 'Company name' },
            location: { type: 'string', description: 'Job location' },
            employment_type: {
              type: 'string',
              enum: ['full-time', 'part-time', 'contract', 'internship'],
              description: 'Type of employment',
            },
            salary_min: {
              type: 'number',
              description: 'Minimum salary (optional)',
            },
            salary_max: {
              type: 'number',
              description: 'Maximum salary (optional)',
            },
            description: { type: 'string', description: 'Job description' },
            requirements: { type: 'string', description: 'Job requirements' },
            responsibilities: {
              type: 'string',
              description: 'Job responsibilities',
            },
            benefits: {
              type: 'string',
              description: 'Benefits offered (optional)',
            },
            application_deadline: {
              type: 'string',
              description: 'Application deadline (YYYY-MM-DD format, optional)',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published'],
              description: 'Initial status',
              default: 'draft',
            },
          },
          required: [
            'title',
            'company_name',
            'location',
            'employment_type',
            'description',
            'requirements',
            'responsibilities',
          ],
        },
      },
      {
        name: 'update_recruitment',
        description: 'Edit an existing recruitment posting',
        inputSchema: {
          type: 'object',
          properties: {
            recruitment_id: {
              type: 'number',
              description: 'The ID of the recruitment to update',
            },
            updates: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                company_name: { type: 'string' },
                location: { type: 'string' },
                employment_type: {
                  type: 'string',
                  enum: ['full-time', 'part-time', 'contract', 'internship'],
                },
                salary_min: { type: 'number' },
                salary_max: { type: 'number' },
                description: { type: 'string' },
                requirements: { type: 'string' },
                responsibilities: { type: 'string' },
                benefits: { type: 'string' },
                application_deadline: { type: 'string' },
                status: {
                  type: 'string',
                  enum: ['draft', 'published', 'closed', 'filled'],
                },
              },
              description: 'Fields to update',
            },
          },
          required: ['recruitment_id', 'updates'],
        },
      },
      {
        name: 'delete_recruitment',
        description: 'Remove a recruitment posting',
        inputSchema: {
          type: 'object',
          properties: {
            recruitment_id: {
              type: 'number',
              description: 'The ID of the recruitment to delete',
            },
          },
          required: ['recruitment_id'],
        },
      },
      {
        name: 'publish_recruitment',
        description: 'Change recruitment status to published',
        inputSchema: {
          type: 'object',
          properties: {
            recruitment_id: {
              type: 'number',
              description: 'The ID of the recruitment to publish',
            },
          },
          required: ['recruitment_id'],
        },
      },
      {
        name: 'get_recruitment_statistics',
        description: 'Display recruitment analytics and statistics',
        inputSchema: {
          type: 'object',
          properties: {
            date_from: {
              type: 'string',
              description: 'Start date for statistics (YYYY-MM-DD format, optional)',
            },
            date_to: {
              type: 'string',
              description: 'End date for statistics (YYYY-MM-DD format, optional)',
            },
          },
        },
      },
      {
        name: 'list_applications',
        description: 'View applications for a specific recruitment',
        inputSchema: {
          type: 'object',
          properties: {
            recruitment_id: {
              type: 'number',
              description: 'The ID of the recruitment',
            },
            status: {
              type: 'string',
              enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'],
              description: 'Filter by application status (optional)',
            },
          },
          required: ['recruitment_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Recruitment tools
      case 'list_recruitments':
        return await recruitmentTools.listRecruitments(
          apiClient,
          recruitmentTools.listRecruitmentsSchema.parse(args)
        );

      case 'get_recruitment_details':
        return await recruitmentTools.getRecruitmentDetails(
          apiClient,
          recruitmentTools.getRecruitmentDetailsSchema.parse(args)
        );

      case 'create_recruitment':
        return await recruitmentTools.createRecruitment(
          apiClient,
          recruitmentTools.createRecruitmentSchema.parse(args)
        );

      case 'update_recruitment':
        return await recruitmentTools.updateRecruitment(
          apiClient,
          recruitmentTools.updateRecruitmentSchema.parse(args)
        );

      case 'delete_recruitment':
        return await recruitmentTools.deleteRecruitment(
          apiClient,
          recruitmentTools.deleteRecruitmentSchema.parse(args)
        );

      case 'publish_recruitment':
        return await recruitmentTools.publishRecruitment(
          apiClient,
          recruitmentTools.publishRecruitmentSchema.parse(args)
        );

      // Application tools
      case 'list_applications':
        return await applicationTools.listApplications(
          apiClient,
          applicationTools.listApplicationsSchema.parse(args)
        );

      // Statistics tools
      case 'get_recruitment_statistics':
        return await statisticsTools.getRecruitmentStatistics(
          apiClient,
          statisticsTools.getRecruitmentStatisticsSchema.parse(args)
        );

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error executing tool ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// ==================== Start Server ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Recruitment MCP Server running on stdio');
  console.error(`Server: ${SERVER_NAME} v${SERVER_VERSION}`);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
