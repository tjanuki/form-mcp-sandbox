#!/usr/bin/env node
import { spawn } from 'child_process';

const mcp = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';

mcp.stdout.on('data', (data) => {
  responseData += data.toString();
  const lines = responseData.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    try {
      const msg = JSON.parse(lines[i]);
      if (msg.id === 2) {
        console.log('Response:', JSON.stringify(msg, null, 2));
        mcp.kill();
        process.exit(0);
      }
    } catch (e) {
      // Continue
    }
  }
  responseData = lines[lines.length - 1];
});

setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' }
    }
  }) + '\n');
}, 500);

setTimeout(() => {
  console.log('Testing get_recruitment_details with ID: 1...\n');
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'get_recruitment_details',
      arguments: { recruitment_id: 1 }
    }
  }) + '\n');
}, 1500);

setTimeout(() => {
  console.log('Timeout - no response');
  mcp.kill();
  process.exit(1);
}, 5000);
