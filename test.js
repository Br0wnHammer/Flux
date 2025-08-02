#!/usr/bin/env node

/**
 * Simple test runner for Flux HTTP Client
 * This file provides a quick way to test the HTTP client functionality
 */

import { HttpClient } from './dist/index.js';

async function runQuickTests() {
  console.log('🚀 Running Flux HTTP Client Quick Tests\n');

  const client = new HttpClient('https://jsonplaceholder.typicode.com');

  try {
    // Test 1: Basic GET request
    console.log('1. Testing GET request...');
    const response1 = await client.get('/posts/1');
    console.log('✅ GET request successful');
    console.log('   Status:', response1.statusCode);
    console.log('   Data keys:', Object.keys(response1.data));
    console.log('   Timing:', response1.timings.total + 'ms\n');

    // Test 2: POST request
    console.log('2. Testing POST request...');
    const postData = { title: 'Test Post', body: 'Test body', userId: 1 };
    const response2 = await client.post('/posts', postData);
    console.log('✅ POST request successful');
    console.log('   Status:', response2.statusCode);
    console.log('   Created ID:', response2.data.id);
    console.log('   Timing:', response2.timings.total + 'ms\n');

    // Test 3: PUT request
    console.log('3. Testing PUT request...');
    const putData = { title: 'Updated Title' };
    const response3 = await client.put('/posts/1', putData);
    console.log('✅ PUT request successful');
    console.log('   Status:', response3.statusCode);
    console.log('   Updated title:', response3.data.title);
    console.log('   Timing:', response3.timings.total + 'ms\n');

    // Test 4: DELETE request
    console.log('4. Testing DELETE request...');
    const response4 = await client.delete('/posts/1');
    console.log('✅ DELETE request successful');
    console.log('   Status:', response4.statusCode);
    console.log('   Timing:', response4.timings.total + 'ms\n');

    // Test 5: Authentication
    console.log('5. Testing authentication...');
    client.setAuthToken('test-token');
    console.log('✅ Auth token set');
    
    client.clearAuthToken();
    console.log('✅ Auth token cleared\n');

    // Test 6: Custom headers
    console.log('6. Testing custom headers...');
    client.setDefaultHeaders({ 'X-Test-Header': 'test-value' });
    const response6 = await client.get('/posts/1');
    console.log('✅ Custom headers test successful');
    console.log('   Status:', response6.statusCode);
    console.log('   Timing:', response6.timings.total + 'ms\n');

    // Test 7: Error handling
    console.log('7. Testing error handling...');
    try {
      await client.get('/nonexistent-endpoint');
    } catch (error) {
      console.log('✅ Error handling working correctly');
      console.log('   Error type:', error.constructor.name);
      console.log('   Error message:', error.message);
    }

    console.log('\n🎉 All quick tests passed!');
    console.log('For comprehensive testing, run: npm test');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuickTests().catch(console.error);
}

export { runQuickTests }; 