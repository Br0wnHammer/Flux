import { describe, it, expect, beforeEach } from '@jest/globals';
import { HttpClient, RequestInterceptor, ResponseInterceptor, ErrorInterceptor, HttpClientError } from '../src/index.js';

describe('HttpClient Interceptors', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient('https://jsonplaceholder.typicode.com');
  });

  describe('Request Interceptors', () => {
    it('should apply request interceptor to modify headers', async () => {
      const requestInterceptor: RequestInterceptor = (config) => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Test-Header': 'test-value'
        }
      });

      client.addRequestInterceptor(requestInterceptor);

      // Mock the _makeRequest method to verify headers
      const originalMakeRequest = (client as any)._makeRequest;
      let capturedConfig: any;
      
      (client as any)._makeRequest = async (_url: string, config: any) => {
        capturedConfig = config;
        return {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: Buffer.from('{"id": 1, "title": "test"}'),
          timings: { start: 0n, tlsHandshake: null, ttfb: 10n, total: 20n }
        };
      };

      await client.get('/posts/1');
      
      expect(capturedConfig.headers['X-Test-Header']).toBe('test-value');
      
      // Restore original method
      (client as any)._makeRequest = originalMakeRequest;
    });

    it('should apply multiple request interceptors in order', async () => {
      const interceptor1: RequestInterceptor = (config) => ({
        ...config,
        headers: { ...config.headers, 'X-First': 'first' }
      });

      const interceptor2: RequestInterceptor = (config) => ({
        ...config,
        headers: { ...config.headers, 'X-Second': 'second' }
      });

      client.addRequestInterceptor(interceptor1);
      client.addRequestInterceptor(interceptor2);

      const originalMakeRequest = (client as any)._makeRequest;
      let capturedConfig: any;
      
      (client as any)._makeRequest = async (_url: string, config: any) => {
        capturedConfig = config;
        return {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: Buffer.from('{"id": 1}'),
          timings: { start: 0n, tlsHandshake: null, ttfb: 10n, total: 20n }
        };
      };

      await client.get('/posts/1');
      
      expect(capturedConfig.headers['X-First']).toBe('first');
      expect(capturedConfig.headers['X-Second']).toBe('second');
      
      (client as any)._makeRequest = originalMakeRequest;
    });

    it('should support async request interceptors', async () => {
      const asyncInterceptor: RequestInterceptor = async (config) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          ...config,
          headers: { ...config.headers, 'X-Async': 'async-value' }
        };
      };

      client.addRequestInterceptor(asyncInterceptor);

      const originalMakeRequest = (client as any)._makeRequest;
      let capturedConfig: any;
      
      (client as any)._makeRequest = async (_url: string, config: any) => {
        capturedConfig = config;
        return {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: Buffer.from('{"id": 1}'),
          timings: { start: 0n, tlsHandshake: null, ttfb: 10n, total: 20n }
        };
      };

      await client.get('/posts/1');
      
      expect(capturedConfig.headers['X-Async']).toBe('async-value');
      
      (client as any)._makeRequest = originalMakeRequest;
    });
  });

  describe('Response Interceptors', () => {
    it('should apply response interceptor to modify response', async () => {
      const responseInterceptor: ResponseInterceptor = (response) => ({
        ...response,
        data: { ...(response.data as any), intercepted: true }
      });

      client.addResponseInterceptor(responseInterceptor);

      const originalMakeRequest = (client as any)._makeRequest;
      (client as any)._makeRequest = async (_url: string, _config: any) => ({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: Buffer.from('{"id": 1, "title": "test"}'),
        timings: { start: 0n, tlsHandshake: null, ttfb: 10n, total: 20n }
      });

      const response = await client.get<any>('/posts/1');
      
      expect(response.data.intercepted).toBe(true);
      expect(response.data.id).toBe(1);
      
      (client as any)._makeRequest = originalMakeRequest;
    });

    it('should apply multiple response interceptors in order', async () => {
      const interceptor1: ResponseInterceptor = (response) => ({
        ...response,
        data: { ...(response.data as any), first: true }
      });

      const interceptor2: ResponseInterceptor = (response) => ({
        ...response,
        data: { ...(response.data as any), second: true }
      });

      client.addResponseInterceptor(interceptor1);
      client.addResponseInterceptor(interceptor2);

      const originalMakeRequest = (client as any)._makeRequest;
      (client as any)._makeRequest = async (_url: string, _config: any) => ({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: Buffer.from('{"id": 1}'),
        timings: { start: 0n, tlsHandshake: null, ttfb: 10n, total: 20n }
      });

      const response = await client.get<any>('/posts/1');
      
      expect(response.data.first).toBe(true);
      expect(response.data.second).toBe(true);
      
      (client as any)._makeRequest = originalMakeRequest;
    });
  });

  describe('Error Interceptors', () => {
    it('should apply error interceptor to modify errors', async () => {
      const errorInterceptor: ErrorInterceptor = (error) => {
        error.message = `Intercepted: ${error.message}`;
        return error;
      };

      client.addErrorInterceptor(errorInterceptor);

      const originalMakeRequest = (client as any)._makeRequest;
      (client as any)._makeRequest = async () => {
        throw new HttpClientError('Original error', 404);
      };

      try {
        await client.get('/posts/1');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as HttpClientError).message).toBe('Intercepted: Original error');
      }
      
      (client as any)._makeRequest = originalMakeRequest;
    });
  });

  describe('Interceptor Management', () => {
    it('should clear request interceptors', () => {
      const interceptor: RequestInterceptor = (config) => config;
      client.addRequestInterceptor(interceptor);
      
      expect((client as any).requestInterceptors.length).toBe(1);
      
      client.clearRequestInterceptors();
      
      expect((client as any).requestInterceptors.length).toBe(0);
    });

    it('should clear response interceptors', () => {
      const interceptor: ResponseInterceptor = (response) => response;
      client.addResponseInterceptor(interceptor);
      
      expect((client as any).responseInterceptors.length).toBe(1);
      
      client.clearResponseInterceptors();
      
      expect((client as any).responseInterceptors.length).toBe(0);
    });

    it('should clear error interceptors', () => {
      const interceptor: ErrorInterceptor = (error) => error;
      client.addErrorInterceptor(interceptor);
      
      expect((client as any).errorInterceptors.length).toBe(1);
      
      client.clearErrorInterceptors();
      
      expect((client as any).errorInterceptors.length).toBe(0);
    });

    it('should clear all interceptors', () => {
      client.addRequestInterceptor((config) => config);
      client.addResponseInterceptor((response) => response);
      client.addErrorInterceptor((error) => error);
      
      expect((client as any).requestInterceptors.length).toBe(1);
      expect((client as any).responseInterceptors.length).toBe(1);
      expect((client as any).errorInterceptors.length).toBe(1);
      
      client.clearAllInterceptors();
      
      expect((client as any).requestInterceptors.length).toBe(0);
      expect((client as any).responseInterceptors.length).toBe(0);
      expect((client as any).errorInterceptors.length).toBe(0);
    });
  });
});