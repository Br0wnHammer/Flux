import HttpClient from './http-client.js';

async function runTests() {
  const client = new HttpClient('https://jsonplaceholder.typicode.com');

  // Test 2: GET request with timing
  console.log('Test 1: GET request with timing');
  try {
    const result = await client.get('/posts');
    console.log(`✅ GET request successful`);
    console.log(`📊 Received ${result.data.length} posts`);
    console.log(`⏱️  Total time: ${result.timings.total}ms`);
    console.log(`🔐 TLS Handshake: ${result.timings.tlsHandshake ? result.timings.tlsHandshake + 'ms' : 'N/A'}`);
    console.log(`⚡ Time to first byte: ${result.timings.ttfb ? result.timings.ttfb + 'ms' : 'N/A'}`);
    console.log(`📝 First post title: "${result.data[0].title}"`);
  } catch (error) {
    console.log(`❌ GET request failed: ${error.message}`);
  }
  console.log('');

  // Test 3: POST request with timing
  console.log('Test 2: POST request with timing');
  try {
    const newPost = {
      title: 'Test Post',
      body: 'This is a test post created with our HTTP client',
      userId: 1
    };
    
    const result = await client.post('/posts', newPost);
    console.log(`✅ POST request successful`);
    console.log(`📊 Created post ID: ${result.data.id}`);
    console.log(`⏱️  Total time: ${result.timings.total}ms`);
    console.log(`🔐 TLS Handshake: ${result.timings.tlsHandshake ? result.timings.tlsHandshake + 'ms' : 'N/A'}`);
    console.log(`⚡ Time to first byte: ${result.timings.ttfb ? result.timings.ttfb + 'ms' : 'N/A'}`);
  } catch (error) {
    console.log(`❌ POST request failed: ${error.message}`);
  }
  console.log('');

  // Test 4: PUT request with timing
  console.log('Test 3: PUT request with timing');
  try {
    const updatedData = {
      id: 1,
      title: 'Updated Title',
      body: 'This post has been updated',
      userId: 1
    };
    
    const result = await client.put('/posts/1', updatedData);
    console.log(`✅ PUT request successful`);
    console.log(`📊 Updated post ID: ${result.data.id}`);
    console.log(`⏱️  Total time: ${result.timings.total}ms`);
    console.log(`🔐 TLS Handshake: ${result.timings.tlsHandshake ? `${result.timings.tlsHandshake}ms` : 'N/A'}`);
  } catch (error) {
    console.log(`❌ PUT request failed: ${error.message}`);
  }
  console.log('');

  // Test 5: DELETE request with timing
  console.log('Test 4: DELETE request with timing');
  try {
    const result = await client.delete('/posts/1');
    console.log(`✅ DELETE request successful`);
    console.log(`⏱️  Total time: ${result.timings.total}ms`);
    console.log(`🔐 TLS Handshake: ${result.timings.tlsHandshake ? `${result.timings.tlsHandshake}ms` : 'N/A'}`);
  } catch (error) {
    console.log(`❌ DELETE request failed: ${error.message}`);
  }
  console.log('');

  // Test 6: Custom headers
  console.log('Test 5: Custom headers');
  try {
    const result = await client.get('/posts/1', {
      headers: {
        'X-Test-Header': 'test-value',
        'Accept': 'application/json'
      }
    });
    console.log(`✅ Custom headers request successful`);
    console.log(`📊 Post ID: ${result.data.id}`);
    console.log(`⏱️  Total time: ${result.timings.total}ms`);
  } catch (error) {
    console.log(`❌ Custom headers request failed: ${error.message}`);
  }
  console.log('');

  // Test 7: Authentication token
  console.log('Test 6: Authentication token');
  try {
    client.setAuthToken('test-token');
    const result = await client.get('/posts');
    console.log(`✅ Auth token request successful`);
    console.log(`📊 Received ${result.data.length} posts`);
    console.log(`⏱️  Total time: ${result.timings.total}ms`);
    client.clearAuthToken();
  } catch (error) {
    console.log(`❌ Auth token request failed: ${error.message}`);
    client.clearAuthToken();
  }
  console.log('');

  // Test 8: Error handling (404)
  console.log('Test 7: Error handling (404)');
  try {
    await client.get('/nonexistent-endpoint');
    console.log(`❌ Expected 404 error but request succeeded`);
  } catch (error) {
    console.log(`✅ Error handling working correctly: ${error.message}`);
  }
}

// Run tests
runTests().catch(console.error); 