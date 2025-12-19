#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🧪 Testing MCP Server...\n');

const mcp = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';

mcp.stdout.on('data', (data) => {
  responseData += data.toString();
  // Try to parse complete JSON-RPC messages
  const lines = responseData.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    try {
      const msg = JSON.parse(lines[i]);
      console.log('📨 Received:', JSON.stringify(msg, null, 2));
    } catch (e) {
      // Not valid JSON yet, continue
    }
  }
  responseData = lines[lines.length - 1];
});

mcp.stderr.on('data', (data) => {
  console.log('ℹ️  Server:', data.toString().trim());
});

// Test 1: Initialize
console.log('Test 1: Initializing connection...');
setTimeout(() => {
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  mcp.stdin.write(JSON.stringify(initRequest) + '\n');
}, 500);

// Test 2: List tools
console.log('Test 2: Listing available tools...');
setTimeout(() => {
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  mcp.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1500);

// Test 3: List resources
console.log('Test 3: Listing available resources...');
setTimeout(() => {
  const listResourcesRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'resources/list',
    params: {}
  };
  mcp.stdin.write(JSON.stringify(listResourcesRequest) + '\n');
}, 2500);

// Test 4: Call list_recruitments tool
console.log('Test 4: Calling list_recruitments tool...');
setTimeout(() => {
  const callToolRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'list_recruitments',
      arguments: {
        status: 'published'
      }
    }
  };
  mcp.stdin.write(JSON.stringify(callToolRequest) + '\n');
}, 3500);

// Clean up after tests
setTimeout(() => {
  console.log('\n✅ All tests completed!');
  mcp.kill();
  process.exit(0);
}, 6000);

mcp.on('exit', (code) => {
  console.log(`\nMCP Server exited with code ${code}`);
});
