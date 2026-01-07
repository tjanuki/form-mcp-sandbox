// Quick test script to verify the API client fix
import { createLaravelApiClient } from './dist/services/laravelApiClient.js';
import { config } from 'dotenv';

config();

async function test() {
  try {
    const client = createLaravelApiClient();

    console.log('Testing listRecruitments...');
    const result = await client.listRecruitments({ status: 'published' });

    console.log('\n✅ Success! Results:');
    console.log('Total:', result.total);
    console.log('Current page:', result.current_page);
    console.log('Per page:', result.per_page);
    console.log('Recruitments found:', result.data.length);
    console.log('\nFirst recruitment:');
    console.log('  ID:', result.data[0]?.id);
    console.log('  Title:', result.data[0]?.title);
    console.log('  Company:', result.data[0]?.company_name);
    console.log('  Status:', result.data[0]?.status);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
