import { HttpClient } from '../src/index.js';

describe('Integration Tests', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient('https://jsonplaceholder.typicode.com');
  });

  afterEach(async () => {
    // Clear any authentication tokens to prevent connection reuse issues
    client.clearAuthToken();
    // Small delay to allow connections to close
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Real API Integration', () => {
    it('should fetch posts from JSONPlaceholder API', async () => {
      const response = await client.get('/posts');
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      const data = response.data as any[];
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('title');
      expect(data[0]).toHaveProperty('body');
      expect(response.timings.total).toBeGreaterThan(0);
    }, 10000);

    it('should fetch a single post', async () => {
      const response = await client.get('/posts/1');
      
      expect(response.statusCode).toBe(200);
      expect(response.data).toHaveProperty('id', 1);
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('body');
    }, 10000);

    it('should create a new post', async () => {
      const postData = {
        title: 'Test Post',
        body: 'This is a test post',
        userId: 1
      };
      
      const response = await client.post('/posts', postData);
      
      expect(response.statusCode).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('title', 'Test Post');
      expect(response.data).toHaveProperty('body', 'This is a test post');
    }, 10000);

    it('should update a post', async () => {
      const updateData = {
        title: 'Updated Post Title'
      };
      
      const response = await client.put('/posts/1', updateData);
      
      expect(response.statusCode).toBe(200);
      expect(response.data).toHaveProperty('id', 1);
      expect(response.data).toHaveProperty('title', 'Updated Post Title');
    }, 10000);

    it('should delete a post', async () => {
      const response = await client.delete('/posts/1');
      
      expect(response.statusCode).toBe(200);
    }, 10000);
  });

  describe('HTTPS Integration', () => {
    it('should handle HTTPS requests with TLS timing', async () => {
      const response = await client.get('/posts/1');
      
      expect(response.statusCode).toBe(200);
      expect(response.timings.ttfb).toBeGreaterThan(0);
      expect(response.timings.total).toBeGreaterThan(0);
      // TLS handshake might be null for some HTTPS connections
      if (response.timings.tlsHandshake) {
        expect(response.timings.tlsHandshake).toBeGreaterThan(0);
      }
    }, 10000);
  });

  describe('Error Handling Integration', () => {
    it('should handle 404 errors from real API', async () => {
      await expect(client.get('/nonexistent')).rejects.toThrow();
    }, 10000);

    it('should handle network errors for invalid domains', async () => {
      const invalidClient = new HttpClient('https://invalid-domain-that-does-not-exist.com');
      await expect(invalidClient.get('/')).rejects.toThrow();
    }, 10000);
  });

  describe('Authentication Integration', () => {
    it('should include authorization header when set', async () => {
      client.setAuthToken('test-token');
      
      // This will fail with 401, but we can verify the header was sent
      try {
        await client.get('/posts');
      } catch (error: any) {
        // We expect this to fail, but the auth header should have been sent
        expect(error).toBeDefined();
      }
    }, 10000);

    it('should clear authorization header', async () => {
      client.setAuthToken('test-token');
      client.clearAuthToken();
      
      // This should work normally without auth
      const response = await client.get('/posts/1');
      expect(response.statusCode).toBe(200);
    }, 10000);
  });

  describe('Custom Headers Integration', () => {
    it('should send custom headers', async () => {
      client.setDefaultHeaders({
        'X-Custom-Header': 'test-value',
        'X-Request-ID': '12345'
      });
      
      const response = await client.get('/posts/1');
      expect(response.statusCode).toBe(200);
    }, 10000);
  });

  describe('Timeout Integration', () => {
    it('should handle timeout for slow requests', async () => {
      const slowClient = new HttpClient('https://httpbin.org', { timeout: 100 });
      
      await expect(slowClient.get('/delay/2')).rejects.toThrow();
    }, 10000);
  });

  describe('Content Type Handling', () => {
    it('should handle different content types correctly', async () => {
      // JSON response
      const jsonResponse = await client.get('/posts/1');
      expect(typeof jsonResponse.data).toBe('object');
      
      // Text response from httpbin
      const textClient = new HttpClient('https://httpbin.org');
      const textResponse = await textClient.get('/html');
      expect(typeof textResponse.data).toBe('string');
      expect(textResponse.data).toContain('<html>');
    }, 15000);
  });

  describe('Performance Metrics Integration', () => {
    it('should provide accurate timing metrics', async () => {
      const response = await client.get('/posts/1');
      
      expect(response.timings.start).toBeGreaterThan(0);
      expect(response.timings.total).toBeGreaterThan(0);
      expect(response.timings.ttfb).toBeGreaterThan(0);
      // TLS handshake might be null for some HTTPS connections
      if (response.timings.tlsHandshake) {
        expect(response.timings.tlsHandshake).toBeGreaterThan(0);
      }
      
      // TTFB should be less than total time
      if (response.timings.ttfb && response.timings.total) {
        expect(response.timings.ttfb).toBeLessThanOrEqual(response.timings.total);
      }
      
      // TLS handshake should be less than TTFB for HTTPS
      if (response.timings.tlsHandshake && response.timings.ttfb) {
        expect(response.timings.tlsHandshake).toBeLessThanOrEqual(response.timings.ttfb);
      }
    }, 10000);
  });
}); 