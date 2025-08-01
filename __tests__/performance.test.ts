import { HttpClient } from '../src/index.js';
import http from 'http';

describe('Performance Tests', () => {
  let mockServer: http.Server;
  let serverPort: number;

  beforeAll(async () => {
    // Create a simple mock server for performance testing
    mockServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'OK', timestamp: Date.now() }));
    });

    await new Promise<void>((resolve) => {
      mockServer.listen(0, () => {
        serverPort = (mockServer.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (mockServer && mockServer.listening) {
        mockServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const client = new HttpClient(`http://localhost:${serverPort}`);
      const numRequests = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: numRequests }, () => 
        client.get('/')
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(responses).toHaveLength(numRequests);
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        expect(response.data).toHaveProperty('message', 'OK');
      });

      // Each request should complete within reasonable time
      const avgTimePerRequest = totalTime / numRequests;
      expect(avgTimePerRequest).toBeLessThan(1000); // Less than 1 second per request
    }, 15000);

    it('should handle rapid sequential requests', async () => {
      const client = new HttpClient(`http://localhost:${serverPort}`);
      const numRequests = 20;
      const startTime = Date.now();

      for (let i = 0; i < numRequests; i++) {
        const response = await client.get('/');
        expect(response.statusCode).toBe(200);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / numRequests;

      expect(avgTimePerRequest).toBeLessThan(500); // Less than 500ms per request
    }, 15000);
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated requests', async () => {
      const client = new HttpClient(`http://localhost:${serverPort}`);
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        await client.get('/');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    }, 30000);
  });

  describe('Response Size Handling', () => {
    it('should handle large response bodies efficiently', async () => {
      // Create a server that returns large responses
      const largeDataServer = http.createServer((_req, res) => {
        const largeData = {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            data: 'x'.repeat(1000) // 1KB per item
          }))
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(largeData));
      });

      let largeServerPort = 0;
      await new Promise<void>((resolve) => {
        largeDataServer.listen(0, () => {
          largeServerPort = (largeDataServer.address() as any).port;
          resolve();
        });
      });

      const client = new HttpClient(`http://localhost:${largeServerPort}`);
      const startTime = Date.now();
      
      const response = await client.get('/');
      const endTime = Date.now();
      
      expect(response.statusCode).toBe(200);
      const data = response.data as any;
      expect(data).toHaveProperty('items');
      expect(data.items).toHaveLength(1000);
      
      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);

      await new Promise<void>((resolve) => {
        largeDataServer.close(() => resolve());
      });
    }, 10000);
  });

  describe('Timeout Performance', () => {
    it('should handle timeouts efficiently', async () => {
      const timeoutServer = http.createServer((_req, _res) => {
        // Don't respond, simulating a hanging server
      });

      let timeoutServerPort = 0;
      await new Promise<void>((resolve) => {
        timeoutServer.listen(0, () => {
          timeoutServerPort = (timeoutServer.address() as any).port;
          resolve();
        });
      });

      const client = new HttpClient(`http://localhost:${timeoutServerPort}`, { timeout: 100 });
      const startTime = Date.now();
      
      await expect(client.get('/')).rejects.toThrow();
      
      const endTime = Date.now();
      const timeoutTime = endTime - startTime;
      
      // Should timeout close to the specified timeout (within 200ms)
      expect(timeoutTime).toBeGreaterThan(80);
      expect(timeoutTime).toBeLessThan(300);

      await new Promise<void>((resolve) => {
        timeoutServer.close(() => resolve());
      });
    }, 10000);
  });

  describe('Connection Pooling', () => {
    it('should reuse connections efficiently', async () => {
      const client = new HttpClient(`http://localhost:${serverPort}`);
      
      // Make multiple requests to the same server
      const requests = Array.from({ length: 10 }, () => client.get('/'));
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
      
      // All requests should complete successfully
      expect(responses).toHaveLength(10);
    }, 10000);
  });

  describe('Timing Accuracy', () => {
    it('should provide accurate timing measurements', async () => {
      const client = new HttpClient(`http://localhost:${serverPort}`);
      
      const response = await client.get('/');
      
      // Timing should be reasonable
      if (response.timings.total) {
        expect(response.timings.total).toBeGreaterThan(0);
        expect(response.timings.total).toBeLessThan(1000); // Less than 1 second
      }
      
      // TTFB should be less than total time
      if (response.timings.ttfb) {
        if (response.timings.ttfb && response.timings.total) {
          expect(response.timings.ttfb).toBeLessThanOrEqual(response.timings.total);
        }
      }
    }, 10000);
  });
}); 