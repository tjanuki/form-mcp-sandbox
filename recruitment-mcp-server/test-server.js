#!/usr/bin/env node

/**
 * Quick test to verify the MCP server can be loaded
 * This doesn't actually start the server, just checks for syntax/import errors
 */

import('./dist/index.js')
  .then(() => {
    console.log('✅ Server loaded successfully!');
    console.log('✅ All imports resolved correctly');
    console.log('✅ No syntax errors detected');
    console.log('\nThe server is ready to run.');
    console.log('To start: npm start');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error loading server:');
    console.error(error);
    process.exit(1);
  });
