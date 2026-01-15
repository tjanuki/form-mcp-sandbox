#!/usr/bin/env node
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { createMCPServer } from './index.js';
import { extractBearerToken, validateOAuthToken } from './middleware/oauth.js';
import type { OAuthSession } from './types/auth.types.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Store active SSE transports by session ID
const activeTransports = new Map<string, SSEServerTransport>();

// Store OAuth sessions by session ID (for user context on /message requests)
const sessionUsers = new Map<string, OAuthSession>();

// Check if OAuth is enabled (can be disabled for local development)
const OAUTH_ENABLED = process.env.OAUTH_ENABLED !== 'false';

// ==================== Middleware ====================

// Enable CORS for ChatGPT domains
app.use(cors({
  origin: [
    'https://chatgpt.com',
    'https://chat.openai.com',
    'http://localhost:*', // For local testing
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  exposedHeaders: ['MCP-Session-Id'],
}));

app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ==================== Routes ====================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'recruitment-mcp-server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// OAuth Authorization Server Metadata (RFC 8414)
// ChatGPT uses this to discover OAuth endpoints
app.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
  const laravelUrl = process.env.LARAVEL_OAUTH_URL || process.env.LARAVEL_API_URL || 'http://localhost:8004';

  res.json({
    issuer: laravelUrl,
    authorization_endpoint: `${laravelUrl}/oauth/authorize`,
    token_endpoint: `${laravelUrl}/oauth/token`,
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    response_types_supported: ['code'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['*'],
  });
});

// Server info endpoint
app.get('/info', (req: Request, res: Response) => {
  res.json({
    name: 'recruitment-mcp-server',
    version: '1.0.0',
    description: 'MCP server for recruitment management system',
    capabilities: {
      tools: 8,
      resources: 5
    },
    endpoints: {
      sse: '/sse',
      health: '/health',
      info: '/info'
    }
  });
});

// SSE handler function
const handleSSEConnection = async (req: Request, res: Response) => {
  console.log('📡 New SSE connection request');
  console.log('   Origin:', req.headers.origin || 'unknown');
  console.log('   User-Agent:', req.headers['user-agent'] || 'unknown');

  try {
    let oauthSession: OAuthSession | undefined;

    // OAuth validation (if enabled)
    if (OAUTH_ENABLED) {
      const token = extractBearerToken(req);

      if (!token) {
        console.log('❌ OAuth: No Bearer token provided');
        return res.status(401).json({
          error: 'Authorization required',
          message: 'Bearer token must be provided in Authorization header'
        });
      }

      const user = await validateOAuthToken(token);

      if (!user) {
        console.log('❌ OAuth: Token validation failed');
        return res.status(401).json({
          error: 'Invalid or expired token',
          message: 'The provided token is invalid or has expired'
        });
      }

      oauthSession = { user, accessToken: token };
      console.log(`✅ OAuth: Authenticated as ${user.email} (${user.role})`);
    } else {
      console.log('⚠️  OAuth: Disabled (OAUTH_ENABLED=false)');
    }

    // Create a new MCP server instance for this connection
    const server = createMCPServer(oauthSession ? {
      user: oauthSession.user,
      accessToken: oauthSession.accessToken
    } : undefined);

    // Create SSE transport (it will generate its own sessionId internally)
    const transport = new SSEServerTransport('/message', res);

    // Store transport using its internally generated sessionId
    activeTransports.set(transport.sessionId, transport);

    // Store OAuth session for this connection (for /message requests)
    if (oauthSession) {
      sessionUsers.set(transport.sessionId, oauthSession);
    }

    console.log('✅ MCP server connected via SSE');
    console.log('   Session ID:', transport.sessionId);
    console.log('   Active transports:', activeTransports.size);

    // Connect the server to the transport
    await server.connect(transport);

    // Handle client disconnect
    res.on('close', () => {
      console.log('❌ Client disconnected - Session:', transport.sessionId);
      activeTransports.delete(transport.sessionId);
      sessionUsers.delete(transport.sessionId);
    });

  } catch (error) {
    console.error('❌ Error setting up SSE connection:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to establish MCP connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

// SSE endpoint for MCP connections (with and without trailing slash)
app.get('/sse', handleSSEConnection);
app.get('/sse/', handleSSEConnection);

// POST endpoint for messages (required by SSE transport)
app.post('/message', async (req: Request, res: Response) => {
  // Get session ID from query parameter (standard MCP SSE pattern)
  const sessionId = req.query.sessionId as string;

  console.log('📨 Received POST /message - Session:', sessionId);

  if (!sessionId) {
    console.error('❌ No session ID provided');
    return res.status(400).json({ error: 'Session ID required' });
  }

  const transport = activeTransports.get(sessionId);

  if (!transport) {
    console.error('❌ Session not found:', sessionId);
    console.error('   Available sessions:', Array.from(activeTransports.keys()));
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!(transport instanceof SSEServerTransport)) {
    console.error('❌ Invalid transport type for session:', sessionId);
    return res.status(400).json({ error: 'Invalid transport type' });
  }

  // CRITICAL: Let the transport handle the message processing
  await transport.handlePostMessage(req, res, req.body);
  console.log('✅ Message handled by transport');
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: ['/health', '/info', '/sse']
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ==================== Server Startup ====================

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log('═'.repeat(70));
  console.log('🚀 Recruitment MCP HTTP Server');
  console.log('═'.repeat(70));
  console.log(`📍 Server URL:    http://localhost:${PORT}`);
  console.log(`📡 SSE Endpoint:  http://localhost:${PORT}/sse`);
  console.log(`❤️  Health Check:  http://localhost:${PORT}/health`);
  console.log(`ℹ️  Info:          http://localhost:${PORT}/info`);
  console.log('═'.repeat(70));
  console.log('');
  console.log('✅ Server is ready to accept connections');
  console.log('   Waiting for ChatGPT to connect...');
  console.log('');
});

// ==================== Graceful Shutdown ====================

const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');

  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  shutdown();
});
