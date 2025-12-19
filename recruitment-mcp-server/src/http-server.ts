#!/usr/bin/env node
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { createMCPServer } from './index.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// SSE endpoint for MCP connections
app.get('/sse', async (req: Request, res: Response) => {
  console.log('📡 New SSE connection request');
  console.log('   Origin:', req.headers.origin || 'unknown');
  console.log('   User-Agent:', req.headers['user-agent'] || 'unknown');

  try {
    // Create a new MCP server instance for this connection
    const server = createMCPServer();

    // Create SSE transport
    const transport = new SSEServerTransport('/message', res);

    // Connect the server to the transport
    await server.connect(transport);

    console.log('✅ MCP server connected via SSE');

    // Handle client disconnect
    req.on('close', () => {
      console.log('❌ Client disconnected');
      server.close().catch(console.error);
    });

    // Handle errors
    req.on('error', (error) => {
      console.error('⚠️  Request error:', error);
      server.close().catch(console.error);
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
});

// POST endpoint for messages (required by SSE transport)
app.post('/message', async (req: Request, res: Response) => {
  // The SSE transport handles this internally
  // Just acknowledge receipt
  res.status(200).send('OK');
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
